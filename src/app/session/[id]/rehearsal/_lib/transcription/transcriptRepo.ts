import { db } from "../../../../../_lib/db";
import {
  TRANSCRIPTION_JOB_ROW_SCHEMA,
  TRANSCRIPT_SEGMENT_ROW_SCHEMA,
  type TranscriptChunk,
  type TranscriptionJobRow,
  type TranscriptionJobStatus,
  type TranscriptSegmentRow,
} from "./transcriptionTypes";

function newId(): string {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type EnqueueJobInput = {
  sessionId: string;
  takeId: string;
  blob: Blob;
  mimeType: string;
  duration_ms?: number;
  engineId: string;
  modelId: string;
};

export async function enqueueTranscriptionJob(input: EnqueueJobInput): Promise<string> {
  const now = Date.now();
  const id = newId();
  const row: TranscriptionJobRow = {
    id,
    sessionId: input.sessionId,
    takeId: input.takeId,
    status: "queued",
    mimeType: input.mimeType,
    duration_ms: input.duration_ms,
    attempt: 0,
    engineId: input.engineId,
    modelId: input.modelId,
    createdAt: now,
    updatedAt: now,
    audioBlob: input.blob,
  };
  const parsed = TRANSCRIPTION_JOB_ROW_SCHEMA.safeParse(row);
  if (!parsed.success) throw new Error("enqueueTranscriptionJob: invalid row");
  await db.transcriptionJobs.put(parsed.data);
  return id;
}

export async function markJobProcessing(jobId: string): Promise<void> {
  await db.transcriptionJobs.update(jobId, {
    status: "processing" satisfies TranscriptionJobStatus,
    updatedAt: Date.now(),
  });
}

export async function markJobFailed(
  jobId: string,
  errorCode: string,
  errorMessage: string,
): Promise<void> {
  const job = await db.transcriptionJobs.get(jobId);
  if (!job) return;
  await db.transcriptionJobs.update(jobId, {
    status: "failed" satisfies TranscriptionJobStatus,
    errorCode,
    errorMessage,
    attempt: job.attempt + 1,
    updatedAt: Date.now(),
  });
}

/**
 * D-05：同 takeId 新 job 成功后，删除其它 job 及其 segments，再写入本 job 分片。
 */
export async function markJobSucceeded(
  jobId: string,
  chunks: TranscriptChunk[],
): Promise<void> {
  const job = await db.transcriptionJobs.get(jobId);
  if (!job) return;

  const now = Date.now();
  const segments: TranscriptSegmentRow[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const row: TranscriptSegmentRow = {
      id: newId(),
      jobId,
      sessionId: job.sessionId,
      takeId: job.takeId,
      idx: typeof c.idx === "number" ? c.idx : i,
      start_ms: c.start_ms,
      end_ms: c.end_ms,
      text: c.text,
    };
    const p = TRANSCRIPT_SEGMENT_ROW_SCHEMA.safeParse(row);
    if (p.success) segments.push(p.data);
    else console.warn("transcriptRepo: skip invalid segment", p.error);
  }
  const validSegments = segments;

  await db.transaction("rw", db.transcriptionJobs, db.transcriptSegments, async () => {
    const sameTake = await db.transcriptionJobs
      .where("takeId")
      .equals(job.takeId)
      .toArray();
    for (const j of sameTake) {
      if (j.id === jobId) continue;
      await db.transcriptSegments.where("jobId").equals(j.id).delete();
      await db.transcriptionJobs.delete(j.id);
    }

    await db.transcriptSegments.where("jobId").equals(jobId).delete();

    if (validSegments.length > 0) {
      await db.transcriptSegments.bulkPut(validSegments);
    }

    await db.transcriptionJobs.put({
      ...job,
      status: "succeeded" satisfies TranscriptionJobStatus,
      errorCode: undefined,
      errorMessage: undefined,
      updatedAt: now,
    });
  });
}

export async function getJob(jobId: string): Promise<TranscriptionJobRow | null> {
  try {
    const row = await db.transcriptionJobs.get(jobId);
    if (!row) return null;
    const parsed = TRANSCRIPTION_JOB_ROW_SCHEMA.safeParse(row);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** 某 take是否已有 queued/processing（幂等入队） */
export async function hasPendingJobForTake(takeId: string): Promise<boolean> {
  const rows = await db.transcriptionJobs.where("takeId").equals(takeId).toArray();
  return rows.some((r) => r.status === "queued" || r.status === "processing");
}

export async function getLatestJobForSession(
  sessionId: string,
): Promise<TranscriptionJobRow | null> {
  try {
    const rows = await db.transcriptionJobs.where("sessionId").equals(sessionId).toArray();
    if (rows.length === 0) return null;
    rows.sort((a, b) => b.createdAt - a.createdAt);
    const top = rows[0];
    const parsed = TRANSCRIPTION_JOB_ROW_SCHEMA.safeParse(top);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function listSegmentsForTake(
  sessionId: string,
  takeId: string,
): Promise<TranscriptSegmentRow[]> {
  try {
    const jobs = await db.transcriptionJobs
      .where("takeId")
      .equals(takeId)
      .and((j) => j.sessionId === sessionId && j.status === "succeeded")
      .toArray();
    if (jobs.length === 0) return [];
    const job = jobs.sort((a, b) => b.createdAt - a.createdAt)[0];
    const segs = await db.transcriptSegments.where("jobId").equals(job.id).toArray();
    const out: TranscriptSegmentRow[] = [];
    for (const s of segs) {
      const p = TRANSCRIPT_SEGMENT_ROW_SCHEMA.safeParse(s);
      if (p.success) out.push(p.data);
    }
    out.sort((a, b) => a.idx - b.idx);
    return out;
  } catch {
    return [];
  }
}

/** 重新转写：取该 take 最近一条 job（含失败）上的 Blob 元数据，由调用方新建 job */
export async function getLatestJobForTake(
  sessionId: string,
  takeId: string,
): Promise<TranscriptionJobRow | null> {
  try {
    const rows = await db.transcriptionJobs
      .where("takeId")
      .equals(takeId)
      .and((j) => j.sessionId === sessionId)
      .toArray();
    if (rows.length === 0) return null;
    rows.sort((a, b) => b.createdAt - a.createdAt);
    const p = TRANSCRIPTION_JOB_ROW_SCHEMA.safeParse(rows[0]);
    return p.success ? p.data : null;
  } catch {
    return null;
  }
}
