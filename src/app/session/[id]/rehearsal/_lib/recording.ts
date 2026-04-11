export type RecordingKind = "audio" | "video";

export type StartRecordingInput = {
  cameraEnabled: boolean;
  /** 与 cameraEnabled 互斥；为 true 时使用 getDisplayMedia + 麦克风 */
  screenShareEnabled?: boolean;
  timesliceMs?: number;
};

export type StartRecordingResult = {
  stream: MediaStream;
  kind: RecordingKind;
  mimeType?: string;
  /** 与本轮 StopRecordingResult.takeId 相同（录制开始即确定） */
  takeId: string;
};

export type StopRecordingResult = {
  blob: Blob;
  url: string;
  mimeType: string;
  kind: RecordingKind;
  /** 单次录制轮次，用于转写与 Dexie 关联 */
  takeId: string;
};

export type RecordingError = {
  code:
    | "not_supported"
    | "not_allowed"
    | "not_found"
    | "invalid_state"
    | "unknown";
  message: string;
  cause?: unknown;
};

function newTakeId(): string {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

let current:
  | null
  | {
      stream: MediaStream;
      recorder: MediaRecorder;
      chunks: BlobPart[];
      kind: RecordingKind;
      url: string | null;
      takeId: string;
    } = null;

function toRecordingError(err: unknown): RecordingError {
  const name = err instanceof DOMException ? err.name : undefined;

  if (name === "NotAllowedError" || name === "SecurityError") {
    return {
      code: "not_allowed",
      message:
        "未获得麦克风/摄像头/屏幕共享权限。若已取消选择窗口，请重新开始；也可在系统设置里允许浏览器录屏后重试。",
      cause: err,
    };
  }

  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return {
      code: "not_found",
      message: "未找到可用的麦克风/摄像头设备。",
      cause: err,
    };
  }

  if (name === "NotSupportedError") {
    return {
      code: "not_supported",
      message: "当前浏览器不支持录制。请尝试更新浏览器或更换浏览器。",
      cause: err,
    };
  }

  return {
    code: "unknown",
    message: "录制失败。请刷新后重试。",
    cause: err,
  };
}

function safeStopTracks(stream: MediaStream) {
  for (const t of stream.getTracks()) {
    try {
      t.stop();
    } catch {
      // ignore
    }
  }
}

function safeRevoke(url: string | null) {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}

export function pickBestMimeType(kind: RecordingKind): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  if (typeof MediaRecorder.isTypeSupported !== "function") return undefined;

  const audioCandidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  const videoCandidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];

  const list = kind === "audio" ? audioCandidates : videoCandidates;
  for (const mimeType of list) {
    try {
      if (MediaRecorder.isTypeSupported(mimeType)) return mimeType;
    } catch {
      // ignore
    }
  }
  return undefined;
}

export async function startRecording(
  input: StartRecordingInput,
): Promise<StartRecordingResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw toRecordingError(new DOMException("NotSupportedError"));
  }
  if (typeof MediaRecorder === "undefined") {
    throw toRecordingError(new DOMException("NotSupportedError"));
  }

  if (current) {
    throw {
      code: "invalid_state",
      message: "当前正在录制中。",
    } satisfies RecordingError;
  }

  const screenOn = Boolean(input.screenShareEnabled);
  const cameraOn = Boolean(input.cameraEnabled) && !screenOn;
  const kind: RecordingKind = screenOn || cameraOn ? "video" : "audio";

  try {
    let stream: MediaStream;

    if (screenOn) {
      if (typeof navigator.mediaDevices.getDisplayMedia !== "function") {
        throw toRecordingError(new DOMException("NotSupportedError"));
      }
      let display: MediaStream | null = null;
      try {
        display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
      } catch (e) {
        throw toRecordingError(e);
      }
      try {
        const mic = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        stream = new MediaStream([
          ...display.getVideoTracks(),
          ...mic.getAudioTracks(),
        ]);
      } catch (e) {
        safeStopTracks(display);
        throw toRecordingError(e);
      }
    } else {
      const constraints: MediaStreamConstraints = cameraOn
        ? { audio: true, video: true }
        : { audio: true };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    }

    const mimeType = pickBestMimeType(kind);
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const takeId = newTakeId();
    current = { stream, recorder, chunks, kind, url: null, takeId };

    const timeslice = input.timesliceMs ?? 1000;
    recorder.start(timeslice);

    return { stream, kind, mimeType: recorder.mimeType || mimeType, takeId };
  } catch (e) {
    throw toRecordingError(e);
  }
}

export async function stopRecording(): Promise<StopRecordingResult> {
  if (!current) {
    throw {
      code: "invalid_state",
      message: "当前没有进行中的录制。",
    } satisfies RecordingError;
  }

  const { recorder, stream, chunks, kind, takeId } = current;
  safeRevoke(current.url);

  try {
    if (recorder.state === "inactive") {
      safeStopTracks(stream);
      current = null;
      throw {
        code: "invalid_state",
        message: "录制已停止。",
      } satisfies RecordingError;
    }

    const stopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = (e) => reject(e);
    });

    recorder.stop();
    await stopped;

    const mimeType = recorder.mimeType || "application/octet-stream";
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const result: StopRecordingResult = { blob, url, mimeType, kind, takeId };

    safeStopTracks(stream);
    current = null;
    return result;
  } catch (e) {
    safeStopTracks(stream);
    current = null;
    throw toRecordingError(e);
  }
}

