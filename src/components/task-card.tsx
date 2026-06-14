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

      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={`font-display text-lg leading-snug truncate ${
                isComplete ? "line-through text-ink-muted dark:text-dark-muted" : ""
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-ink-muted dark:text-dark-muted mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          <span
            className={`shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
              task.priority === "high"
                ? "bg-ember/15 text-ember"
                : task.priority === "medium"
                  ? "bg-ink/8 dark:bg-dark-muted/20 text-ink-muted dark:text-dark-muted"
                  : "bg-ink/5 dark:bg-dark-muted/10 text-ink-muted/70"
            }`}
          >
            {priorityLabel(task.priority)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex items-center gap-3 text-xs font-mono text-ink-muted dark:text-dark-muted">
            <span className={urgency === "overdue" ? "text-rose" : ""}>
              {formatDueDate(task.due_date)}
            </span>
            <StatusBadge status={task.status} />
          </div>

          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
            {!isComplete && (
              <button
                type="button"
                onClick={() => onComplete(task)}
                className="text-xs px-2 py-1 rounded text-moss hover:bg-moss/10"
              >
                Complete
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="text-xs px-2 py-1 rounded text-action hover:bg-action/10"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="text-xs px-2 py-1 rounded text-rose hover:bg-rose/10"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const labels: Record<TaskStatus, string> = {
    todo: "To do",
    in_progress: "In progress",
    complete: "Done",
  };
  return (
    <span className="text-ink-muted/80 dark:text-dark-muted/80">
      {labels[status]}
    </span>
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
  const [dueDate, setDueDate] = useState(
    initial?.due_date ? initial.due_date.slice(0, 10) : ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (title.length > 200) next.title = "Title is too long";
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="task-due" className="block text-sm mb-1.5">
            Due date
          </label>
          <input
            id="task-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface dark:bg-dark-bg border border-ink/15 dark:border-dark-muted/30 text-sm font-mono"
          />
        </div>
      </div>

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
