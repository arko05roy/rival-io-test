"use client";

import type { Task, User } from "@/lib/types";
import { getUrgency } from "@/lib/urgency";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses", short: "All" },
  { value: "todo", label: "To do", short: "To do" },
  { value: "in_progress", label: "In progress", short: "Active" },
  { value: "complete", label: "Done", short: "Done" },
] as const;

interface TasksSidebarProps {
  user: User | null;
  tasks: Task[];
  total: number;
  loading: boolean;
  activeStatus: string;
  theme: "light" | "dark";
  onFilter: (status: string) => void;
  onAddTask: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export function TasksSidebar({
  user,
  tasks,
  total,
  loading,
  activeStatus,
  theme,
  onFilter,
  onAddTask,
  onToggleTheme,
  onLogout,
}: TasksSidebarProps) {
  const email = user?.email ?? "";
  const initial = email ? email[0].toUpperCase() : "?";
  const stats = getOpenStats(tasks);

  return (
    <aside className="hidden lg:flex lg:w-[17.5rem] shrink-0 bg-rail text-white min-h-screen flex-col relative overflow-hidden">
      <div className="absolute inset-0 ledger-rules-dark opacity-70 pointer-events-none" aria-hidden />
      <div className="absolute -left-16 bottom-24 w-48 h-48 rounded-full bg-ember/10 blur-3xl pointer-events-none" aria-hidden />

      <div className="relative flex flex-col flex-1 p-6">
        <header className="pb-6 border-b border-white/10">
          <p className="font-display text-2xl tracking-tight">Ledger</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 mt-1">
            Task ledger
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-md bg-white/10 border border-white/15 flex items-center justify-center font-mono text-sm text-white/90 shrink-0"
              aria-hidden
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white/90 truncate">{email || "Signed in"}</p>
              <p className="font-mono text-[10px] text-white/40 mt-0.5">
                {loading ? "Loading…" : `${total} task${total === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
        </header>

        <nav className="py-6 flex-1" aria-label="Filter by status">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35 mb-3 px-1">
            Index
          </p>
          <ul className="space-y-0.5">
            {STATUS_OPTIONS.map((opt) => {
              const active = (activeStatus ?? "") === opt.value;
              return (
                <li key={opt.value || "all"}>
                  <button
                    type="button"
                    onClick={() => onFilter(opt.value)}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-left transition-colors ${
                      active
                        ? "bg-white/12 text-white"
                        : "text-white/55 hover:text-white hover:bg-white/6"
                    }`}
                    aria-current={active ? "true" : undefined}
                  >
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full transition-all ${
                        active ? "bg-ember" : "bg-transparent group-hover:bg-white/20"
                      }`}
                      aria-hidden
                    />
                    <StatusIcon status={opt.value} active={active} />
                    <span className={active ? "font-medium" : ""}>{opt.short}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-5">
          <button
            type="button"
            onClick={onAddTask}
            className="w-full py-2.5 px-4 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium shadow-sm flex items-center justify-center gap-2"
          >
            <PlusIcon />
            Add task
          </button>

          {!loading && stats.open > 0 && (
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-3.5">
              <div className="flex items-baseline justify-between mb-2.5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/35">
                  Open ledger
                </p>
                <span className="font-mono text-[10px] text-white/40">
                  {stats.open} open
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden flex bg-white/10">
                {stats.overdue > 0 && (
                  <div
                    className="bg-rose h-full"
                    style={{ width: `${(stats.overdue / stats.open) * 100}%` }}
                  />
                )}
                {stats.dueSoon > 0 && (
                  <div
                    className="bg-ember h-full"
                    style={{ width: `${(stats.dueSoon / stats.open) * 100}%` }}
                  />
                )}
                {stats.clear > 0 && (
                  <div
                    className="bg-moss/50 h-full"
                    style={{ width: `${(stats.clear / stats.open) * 100}%` }}
                  />
                )}
              </div>
              <div className="mt-2.5 space-y-1 font-mono text-[10px] text-white/45">
                {stats.overdue > 0 && (
                  <p>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose mr-1.5 align-middle" />
                    {stats.overdue} overdue
                  </p>
                )}
                {stats.dueSoon > 0 && (
                  <p>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-ember mr-1.5 align-middle" />
                    {stats.dueSoon} due soon
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 space-y-0.5">
            <SidebarAction onClick={onToggleTheme} icon={<ThemeIcon dark={theme === "dark"} />}>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </SidebarAction>
            <SidebarAction onClick={onLogout} icon={<SignOutIcon />}>
              Sign out
            </SidebarAction>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileStatusFilter({
  activeStatus,
  onFilter,
}: {
  activeStatus: string;
  onFilter: (status: string) => void;
}) {
  return (
    <div className="lg:hidden flex gap-1.5 p-3 overflow-x-auto border-b border-ink/10 dark:border-dark-muted/20 bg-surface-raised dark:bg-dark-raised">
      {STATUS_OPTIONS.map((opt) => {
        const active = (activeStatus ?? "") === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onFilter(opt.value)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              active
                ? "bg-rail text-white shadow-sm"
                : "bg-ink/5 dark:bg-dark-muted/15 text-ink-muted dark:text-dark-muted"
            }`}
            aria-current={active ? "true" : undefined}
          >
            <StatusIcon status={opt.value} active={active} compact />
            {opt.short}
          </button>
        );
      })}
    </div>
  );
}

function getOpenStats(tasks: Task[]) {
  const active = tasks.filter((t) => t.status !== "complete");
  const overdue = active.filter((t) => getUrgency(t) === "overdue").length;
  const dueSoon = active.filter(
    (t) => {
      const u = getUrgency(t);
      return u === "high" || u === "medium";
    }
  ).length;
  return {
    open: active.length,
    overdue,
    dueSoon,
    clear: active.length - overdue - dueSoon,
  };
}

function SidebarAction({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white/55 hover:text-white hover:bg-white/6 transition-colors text-left"
    >
      <span className="text-white/40">{icon}</span>
      {children}
    </button>
  );
}

function StatusIcon({
  status,
  active,
  compact,
}: {
  status: string;
  active: boolean;
  compact?: boolean;
}) {
  const size = compact ? 12 : 14;
  const color = active ? "text-ember" : "text-white/35";

  if (status === "") {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" className={color} aria-hidden>
        <rect x="2" y="2" width="4" height="4" rx="0.5" fill="currentColor" />
        <rect x="8" y="2" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.5" />
        <rect x="2" y="8" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.5" />
        <rect x="8" y="8" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
      </svg>
    );
  }
  if (status === "todo") {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" className={color} aria-hidden>
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    );
  }
  if (status === "in_progress") {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" className={color} aria-hidden>
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M7 7V3.5A3.5 3.5 0 0 1 7 10.5" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" className={color} aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
      <path d="M5 7l1.5 1.5L9.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ThemeIcon({ dark }: { dark: boolean }) {
  if (dark) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.8 2.8l1 1M10.2 10.2l1 1M2.8 11.2l1-1M10.2 3.8l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M10.5 8.5a4 4 0 1 1-5-5 4.5 4.5 0 0 0 5 5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M5.5 2H3.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9 10l2.5-2.5L9 5M5.5 7.5H11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
