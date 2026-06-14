import type { Task } from "./types";

export type UrgencyLevel = "none" | "low" | "medium" | "high" | "overdue";

export function getUrgency(task: Task): UrgencyLevel {
  if (task.status === "complete" || !task.due_date) return "none";

  const now = new Date();
  const due = new Date(task.due_date);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "overdue";
  if (diffDays <= 1) return "high";
  if (diffDays <= 3) return "medium";
  if (diffDays <= 7) return "low";
  return "none";
}

export function urgencyColor(level: UrgencyLevel): string {
  switch (level) {
    case "overdue":
      return "bg-rose";
    case "high":
      return "bg-ember";
    case "medium":
      return "bg-ember/70";
    case "low":
      return "bg-action/50";
    default:
      return "bg-ink/10 dark:bg-dark-muted/30";
  }
}

export function urgencyWidth(level: UrgencyLevel): string {
  switch (level) {
    case "overdue":
      return "w-1.5";
    case "high":
      return "w-1";
    case "medium":
      return "w-0.5";
    case "low":
      return "w-px";
    default:
      return "w-px";
  }
}

export function formatDueDate(iso: string | null): string {
  if (!iso) return "No due date";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function priorityLabel(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}
