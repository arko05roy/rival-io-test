"use client";

import { useState } from "react";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import {
  formatDueDate,
  getUrgency,
  priorityLabel,
  urgencyColor,
  urgencyWidth,
} from "@/lib/urgency";
import { DatePicker, toDateInputValue } from "@/components/date-picker";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
  optimistic?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onComplete,
  onDelete,
  optimistic,
}: TaskCardProps) {
  const urgency = getUrgency(task);
  const isComplete = task.status === "complete";

  return (
    <article
      className={`group relative flex bg-surface-raised dark:bg-dark-raised rounded-lg overflow-hidden border border-ink/6 dark:border-dark-muted/15 hover:border-ink/12 dark:hover:border-dark-muted/25 transition-[box-shadow,border-color] hover:shadow-md ${
        optimistic ? "opacity-70" : ""
      } ${isComplete ? "opacity-60" : ""}`}
    >
      <div
        className={`shrink-0 self-stretch ${urgencyWidth(urgency)} ${urgencyColor(urgency)} ${
          urgency === "overdue" ? "shadow-[2px_0_8px_-2px] shadow-rose/40" : ""
        } transition-all`}
        aria-hidden
        title={
          urgency === "overdue"
            ? "Overdue"
            : urgency !== "none"
              ? "Due soon"
              : undefined
        }
      />

      <div className="flex-1 p-4 sm:p-5 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className={`font-display text-lg leading-snug ${
                isComplete
                  ? "line-through text-ink-muted dark:text-dark-muted"
                  : ""
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-ink-muted dark:text-dark-muted mt-1.5 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          <span
            className={`shrink-0 font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md ${
              task.priority === "high"
                ? "bg-ember/15 text-ember ring-1 ring-ember/20"
                : task.priority === "medium"
                  ? "bg-ink/6 dark:bg-dark-muted/20 text-ink-muted dark:text-dark-muted"
                  : "bg-ink/4 dark:bg-dark-muted/10 text-ink-muted/80"
            }`}
          >
            {priorityLabel(task.priority)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-xs px-2 py-1 rounded border ${
                urgency === "overdue"
                  ? "border-rose/30 bg-rose/8 text-rose"
                  : "border-ink/10 dark:border-dark-muted/20 bg-ink/[0.03] dark:bg-dark-muted/10 text-ink-muted dark:text-dark-muted"
              }`}
            >
              <CalendarStampIcon />
              {formatDueDate(task.due_date)}
            </span>
            <StatusBadge status={task.status} />
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            {!isComplete && (
              <ActionButton
                onClick={() => onComplete(task)}
                className="text-moss hover:bg-moss/10"
              >
                Complete
              </ActionButton>
            )}
            <ActionButton
              onClick={() => onEdit(task)}
              className="text-action hover:bg-action/10"
            >
              Edit
            </ActionButton>
            <ActionButton
              onClick={() => onDelete(task)}
              className="text-rose hover:bg-rose/10"
            >
              Delete
            </ActionButton>
          </div>
        </div>
      </div>
    </article>
  );
}

function ActionButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function CalendarStampIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className="opacity-70"
      aria-hidden
    >
      <rect x="1" y="2" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1" />
      <path d="M1 4.5h10" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { label: string; className: string }> = {
    todo: {
      label: "To do",
      className: "text-ink-muted dark:text-dark-muted",
    },
    in_progress: {
      label: "In progress",
      className: "text-action",
    },
    complete: {
      label: "Done",
      className: "text-moss",
    },
  };
  const { label, className } = config[status];
  return (
    <span className={`text-xs font-medium ${className}`}>{label}</span>
  );
}

export function TaskForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<Task>;
  onSubmit: (data: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(
    initial?.priority ?? "medium"
  );
  const [dueDate, setDueDate] = useState(toDateInputValue(initial?.due_date));
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (title.length > 200) next.title = "Title is too long";
    setErrors(next);
    return Object.keys(next).length === 0;
    if (description.length > 100) {
      next.description = "Description must be 100 characters or fewer";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      title: title.trim(),
      description,
      status,
      priority,
      due_date: dueDate,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="task-title" className="block text-sm mb-1.5">
          Title
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-surface dark:bg-dark-bg border border-ink/15 dark:border-dark-muted/30 text-sm"
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-xs text-rose mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="task-desc" className="block text-sm mb-1.5">
          Description
        </label>
        <textarea
          id="task-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-surface dark:bg-dark-bg border border-ink/15 dark:border-dark-muted/30 text-sm resize-y"
        />
        {errors.description && (
          <p className="text-xs text-rose mt-1">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-status" className="block text-sm mb-1.5">
            Status
          </label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full px-3 py-2 rounded-md bg-surface dark:bg-dark-bg border border-ink/15 dark:border-dark-muted/30 text-sm"
          >
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="complete">Done</option>
          </select>
        </div>
        <div>
          <label htmlFor="task-priority" className="block text-sm mb-1.5">
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full px-3 py-2 rounded-md bg-surface dark:bg-dark-bg border border-ink/15 dark:border-dark-muted/30 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <DatePicker
        id="task-due"
        value={dueDate}
        onChange={setDueDate}
      />

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-md border border-ink/15 dark:border-dark-muted/30 hover:bg-ink/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm rounded-md bg-action hover:bg-action-hover text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : initial?.id ? "Save changes" : "Add task"}
        </button>
      </div>
    </form>
  );
}
