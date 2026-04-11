import Dexie, { type Table } from "dexie";

import type { Session } from "./sessionTypes";
import type {
  PauseEventRow,
  RehearsalSettingsRow,
  UploadedBackgroundRow,
} from "../session/[id]/rehearsal/_lib/rehearsalTypes";
import type {
  TranscriptionJobRow,
  TranscriptSegmentRow,
} from "../session/[id]/rehearsal/_lib/transcription/transcriptionTypes";

export class AppDB extends Dexie {
  sessions!: Table<Session, string>;
  rehearsalSettings!: Table<RehearsalSettingsRow, string>;
  uploadedBackgrounds!: Table<UploadedBackgroundRow, string>;
  pauseEvents!: Table<PauseEventRow, string>;
  transcriptionJobs!: Table<TranscriptionJobRow, string>;
  transcriptSegments!: Table<TranscriptSegmentRow, string>;

  constructor() {
    super("gic-db");

    this.version(1).stores({
      sessions: "id, createdAt, status, scene",
    });

    this.version(2).stores({
      sessions: "id, createdAt, status, scene",
      rehearsalSettings: "sessionId, updatedAt",
      uploadedBackgrounds: "id, createdAt",
    });

    this.version(3).stores({
      sessions: "id, createdAt, status, scene",
      rehearsalSettings: "sessionId, updatedAt",
      uploadedBackgrounds: "id, createdAt",
      pauseEvents: "id, sessionId, start_ms, createdAt",
    });

    this.version(4).stores({
      sessions: "id, createdAt, status, scene",
      rehearsalSettings: "sessionId, updatedAt",
      uploadedBackgrounds: "id, createdAt",
      pauseEvents: "id, sessionId, start_ms, createdAt",
      transcriptionJobs:
        "id, sessionId, takeId, status, createdAt, [sessionId+createdAt]",
      transcriptSegments:
        "id, jobId, sessionId, takeId, start_ms, [sessionId+start_ms]",
    });

    this.version(5).stores({
      sessions: "id, createdAt, status, scene",
      rehearsalSettings: "sessionId, updatedAt",
      uploadedBackgrounds: "id, createdAt",
      pauseEvents:
        "id, sessionId, takeId, start_ms, createdAt, [sessionId+takeId]",
      transcriptionJobs:
        "id, sessionId, takeId, status, createdAt, [sessionId+createdAt]",
      transcriptSegments:
        "id, jobId, sessionId, takeId, start_ms, [sessionId+start_ms]",
    });
  }
}

export const db = new AppDB();

