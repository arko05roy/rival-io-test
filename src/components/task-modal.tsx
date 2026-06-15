"use client";

import { useEffect, useId, useRef } from "react";
import type { Task } from "@/lib/types";
import { TaskForm } from "@/components/task-card";

interface TaskModalProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<Task>;
  loading?: boolean;
  onSubmit: (data: {
    title: string;
    description: string;
    status: Task["status"];
    priority: Task["priority"];
    due_date: string;
  }) => void;
  onClose: () => void;
}

export function TaskModal({
  open,
  mode,
  initial,
  loading,
  onSubmit,
  onClose,
}: TaskModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const focusable = panelRef.current?.querySelector<HTMLElement>(
      "input, textarea, select, button"
    );
    focusable?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const entryNo = mode === "create" ? "New" : "Edit";
  const title = mode === "create" ? "New entry" : "Edit entry";
  const description =
    mode === "create"
      ? "Record a task on your ledger."
      : "Update this ledger entry.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/35 dark:bg-black/55 backdrop-blur-[3px]"
        aria-label="Close dialog"
        onClick={() => !loading && onClose()}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-surface-raised dark:bg-dark-raised border border-ink/10 dark:border-dark-muted/25 shadow-[0_8px_40px_-8px_rgba(24,27,32,0.2)] dark:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.5)] animate-[modal-enter_0.22s_ease-out]"
      >
        <div className="auth-perforation h-3 border-b border-ink/6 dark:border-dark-muted/15" aria-hidden />

        <div className="auth-margin-rule pl-7 pr-5 sm:pl-8 sm:pr-6 py-6 sm:py-7">
          <header className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted dark:text-dark-muted">
                  Entry {entryNo}
                </span>
                <span className="font-mono text-[10px] text-ember/80 uppercase tracking-wider">
                  {mode === "create" ? "Ledger" : "Revision"}
                </span>
              </div>
              <h2
                id={titleId}
                className="font-display text-2xl text-ink dark:text-dark-ink"
              >
                {title}
              </h2>
              <p
                id={descId}
                className="text-sm text-ink-muted dark:text-dark-muted mt-1"
              >
                {description}
              </p>

              {description.length >100 && (
                <p className="text-sm text-ink-muted dark:text-dark-muted mt-1">
                  Description is too long. Please shorten it.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="shrink-0 p-1.5 rounded-md text-ink-muted dark:text-dark-muted hover:bg-ink/5 dark:hover:bg-dark-muted/15 disabled:opacity-50"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </header>

          <TaskForm
            key={initial?.id ?? "new"}
            initial={initial}
            loading={loading}
            onCancel={onClose}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4.5 4.5l7 7M11.5 4.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
