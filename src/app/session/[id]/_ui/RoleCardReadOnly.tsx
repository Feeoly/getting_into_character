"use client";

import Link from "next/link";

import { getEffectiveRoleCardText, type Session } from "../../../_lib/sessionTypes";
import { role } from "../_lib/roleCopy";
import { RoleCardMarkdown } from "./RoleCardMarkdown";

type Props = {
  session: Session;
  sessionId: string;
  onSessionChange?: (s: Session) => void;
};

export function RoleCardReadOnly({ session, sessionId }: Props) {
  const effective = getEffectiveRoleCardText(session);

  return (
    <div
      id="role-card-readonly"
      className="rounded-[var(--radius-card)] bg-surface px-6 py-5"
    >
      <div className="text-sm font-semibold text-ink">{role.sectionTitle}</div>
      <div className="mt-3 overflow-hidden rounded-2xl">
        <RoleCardMarkdown markdown={effective ?? ""} variant="compact" />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/session/${sessionId}/role/read`} className="ui-btn px-6">
          {role.goRead}
        </Link>
        {session.roleReadAloudCompletedAt ? (
          <span className="inline-flex items-center text-xs text-ink-subtle">{role.readAloudDone}</span>
        ) : null}
      </div>
    </div>
  );
}
