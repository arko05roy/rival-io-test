import type { Task } from "@/lib/types";
import { getUrgency } from "@/lib/urgency";

interface DeadlineHorizonProps {
  tasks: Task[];
}

export function DeadlineHorizon({ tasks }: DeadlineHorizonProps) {
  const active = tasks.filter((t) => t.status !== "complete");
  const overdue = active.filter((t) => getUrgency(t) === "overdue").length;
  const dueSoon = active.filter((t) => {
    const u = getUrgency(t);
    return u === "high" || u === "medium";
  }).length;
  const clear = active.length - overdue - dueSoon;

  if (active.length === 0) return null;

  const total = active.length;
  const overduePct = (overdue / total) * 100;
  const soonPct = (dueSoon / total) * 100;
  const clearPct = (clear / total) * 100;

  return (
    <div className="mb-6" aria-label="Deadline overview">
      <div className="flex items-baseline justify-between mb-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted dark:text-dark-muted">
          Deadline horizon
        </p>
        <p className="font-mono text-xs text-ink-muted dark:text-dark-muted">
          {active.length} open
        </p>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden flex bg-ink/8 dark:bg-dark-muted/20">
        {overdue > 0 && (
          <div
            className="bg-rose h-full transition-all duration-500"
            style={{ width: `${overduePct}%` }}
            title={`${overdue} overdue`}
          />
        )}
        {dueSoon > 0 && (
          <div
            className="bg-ember h-full transition-all duration-500"
            style={{ width: `${soonPct}%` }}
            title={`${dueSoon} due soon`}
          />
        )}
        {clear > 0 && (
          <div
            className="bg-moss/40 h-full transition-all duration-500"
            style={{ width: `${clearPct}%` }}
            title={`${clear} on track`}
          />
        )}
      </div>

      <div className="flex gap-4 mt-2 font-mono text-[10px] text-ink-muted dark:text-dark-muted">
        {overdue > 0 && (
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-rose mr-1 align-middle" />
            {overdue} overdue
          </span>
        )}
        {dueSoon > 0 && (
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-ember mr-1 align-middle" />
            {dueSoon} due soon
          </span>
        )}
        {clear > 0 && (
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-moss/50 mr-1 align-middle" />
            {clear} on track
          </span>
        )}
      </div>
    </div>
  );
}
