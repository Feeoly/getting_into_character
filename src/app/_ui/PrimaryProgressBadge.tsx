import {
  primaryProgressClassName,
  primaryProgressLabel,
  resolveSessionPrimaryProgress,
} from "../_lib/sessionProgress";
import type { Session } from "../_lib/sessionTypes";
import type { TranscriptionJobRow } from "../session/[id]/rehearsal/_lib/transcription/transcriptionTypes";

type Props = {
  session: Session;
  /** 无任务时为 null；加载中可传 undefined 显示占位 */
  latestJob: TranscriptionJobRow | null | undefined;
};

export function PrimaryProgressBadge({ session, latestJob }: Props) {
  if (latestJob === undefined) {
    return (
      <span className="inline-flex items-center rounded-full bg-stone-200/60 px-2.5 py-1 text-xs font-semibold text-ink-subtle">
        …
      </span>
    );
  }

  const kind = resolveSessionPrimaryProgress(session, latestJob);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${primaryProgressClassName(kind)}`}
    >
      {primaryProgressLabel(kind)}
    </span>
  );
}
