export type PauseDetectorInput = {
  stream: MediaStream;
  thresholdMs: number;
  energyFloor: number;
  smoothingMs: number;
  cooldownMs: number;
  onPauseStart: (pauseStartEpochMs: number) => void;
  onPauseEnd: (pauseEndEpochMs: number) => void;
};

export type PauseDetector = {
  stop: () => void;
};

function rmsFromTimeDomain(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

export function createPauseDetector(input: PauseDetectorInput): PauseDetector {
  let raf = 0;
  let stopped = false;

  const thresholdMs = Math.max(0, Math.round(input.thresholdMs));
  const energyFloor = Math.max(0, input.energyFloor);
  const smoothingMs = Math.max(0, Math.round(input.smoothingMs));
  const cooldownMs = Math.max(0, Math.round(input.cooldownMs));

  const audioCtx = new AudioContext();
  void audioCtx.resume().catch(() => {
    // ignore
  });

  const source = audioCtx.createMediaStreamSource(input.stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const buf = new Uint8Array(analyser.fftSize);

  let lastTs = Date.now();
  let smooth = 0;
  let belowSince: number | null = null;
  let paused = false;
  let pauseStartEpochMs: number | null = null;
  let lastPromptEpochMs = 0;

  const tick = () => {
    if (stopped) return;
    raf = requestAnimationFrame(tick);

    analyser.getByteTimeDomainData(buf);
    const energy = rmsFromTimeDomain(buf);

    const now = Date.now();
    const dt = Math.max(0, now - lastTs);
    lastTs = now;

    const alpha = smoothingMs <= 0 ? 1 : Math.min(1, dt / (smoothingMs + dt));
    smooth = smooth + alpha * (energy - smooth);

    const isBelow = smooth < energyFloor;

    if (!paused) {
      if (isBelow) {
        if (belowSince === null) belowSince = now;
        const silentFor = now - belowSince;

        const cooldownOk = now - lastPromptEpochMs >= cooldownMs;
        if (silentFor >= thresholdMs && cooldownOk) {
          paused = true;
          pauseStartEpochMs = belowSince;
          lastPromptEpochMs = now;
          input.onPauseStart(pauseStartEpochMs);
        }
      } else {
        belowSince = null;
      }
      return;
    }

    // paused === true
    if (!isBelow) {
      const end = now;
      paused = false;
      belowSince = null;
      pauseStartEpochMs = null;
      input.onPauseEnd(end);
    }
  };

  raf = requestAnimationFrame(tick);

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {
        // ignore
      }
      void audioCtx.close().catch(() => {
        // ignore
      });
    },
  };
}

