"use client";

import { useEffect, useId, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 dark:bg-black/60 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full max-w-md rounded-lg bg-surface-raised dark:bg-dark-raised border border-ink/10 dark:border-dark-muted/25 shadow-xl animate-[modal-enter_0.2s_ease-out]"
      >
        <div className="h-1 bg-gradient-to-r from-rose/60 via-ember/40 to-transparent rounded-t-lg" />
        <div className="p-6">
          <h2
            id={titleId}
            className="font-display text-xl text-ink dark:text-dark-ink"
          >
            {title}
          </h2>
          <p
            id={descId}
            className="mt-2 text-sm text-ink-muted dark:text-dark-muted leading-relaxed"
          >
            {description}
          </p>
          <div className="mt-6 flex gap-3 justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md border border-ink/15 dark:border-dark-muted/30 hover:bg-ink/5 dark:hover:bg-dark-muted/10 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm rounded-md text-white disabled:opacity-50 ${
                variant === "danger"
                  ? "bg-rose hover:bg-rose/90"
                  : "bg-action hover:bg-action-hover"
              }`}
            >
              {loading ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
