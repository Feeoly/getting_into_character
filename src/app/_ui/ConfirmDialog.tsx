"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel?: string;
  /** 危险操作：主按钮用警示色 */
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel = "取消",
  confirmLabel = "确定",
  danger = false,
  onClose,
  onConfirm,
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

  function handleConfirm() {
    onClose();
    onConfirm();
  }

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
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-ink">
          {title}
        </h2>
        <p
          id="confirm-dialog-desc"
          className="mt-2 text-sm leading-relaxed text-ink-muted"
        >
          {description}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="ui-btn ui-btn-sm px-4" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              danger
                ? "ui-btn ui-btn-sm border-red-600 px-4 text-red-700 hover:bg-red-50"
                : "ui-btn ui-btn-sm px-4"
            }
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
