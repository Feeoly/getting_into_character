"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  okLabel?: string;
  onClose: () => void;
};

/** 单按钮提示（替代 window.alert） */
export function AlertDialog({
  open,
  title,
  description,
  okLabel = "知道了",
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/45 px-4 py-8 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-card)] border border-ink/15 bg-surface p-5 shadow-xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="alert-dialog-title" className="text-base font-semibold text-ink">
          {title}
        </h2>
        <p
          id="alert-dialog-desc"
          className="mt-2 text-sm leading-relaxed text-ink-muted"
        >
          {description}
        </p>
        <div className="mt-5 flex flex-wrap justify-end">
          <button type="button" className="ui-btn ui-btn-sm px-4" onClick={onClose}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
