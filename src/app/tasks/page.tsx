"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from "@/lib/api";
import {
  clearAuth,
  getStoredUser,
  isAuthenticated,
} from "@/lib/auth";
import type { Task, TaskFilters, User } from "@/lib/types";
import { TaskCard, TaskForm } from "@/components/task-card";
import { DeadlineHorizon } from "@/components/deadline-horizon";
import { useTheme } from "@/components/theme-provider";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Done" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Created date" },
  { value: "due_date", label: "Due date" },
  { value: "priority", label: "Priority" },
];

export default function TasksPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [searchInput, setSearchInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listTasks({
        ...filters,
        search: filters.search || undefined,
        status: filters.status || undefined,
      });
      setTasks(res.tasks);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      if (err instanceof Error && err.message.includes("401")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [filters, router]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setUser(getStoredUser<User>());
    fetchTasks();
  }, [fetchTasks, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  async function handleCreate(data: Parameters<typeof TaskForm>[0]["onSubmit"] extends (d: infer D) => void ? D : never) {
    setFormLoading(true);
    try {
      await createTask({
        ...data,
        due_date: data.due_date || null,
      });
      setShowForm(false);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate(data: Parameters<typeof TaskForm>[0]["onSubmit"] extends (d: infer D) => void ? D : never) {
    if (!editingTask) return;
    setFormLoading(true);
    try {
      await updateTask(editingTask.id, {
        ...data,
        due_date: data.due_date || null,
      });
      setEditingTask(null);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleComplete(task: Task) {
    const prev = [...tasks];
    setOptimisticIds((s) => new Set(s).add(task.id));
    setTasks((ts) =>
      ts.map((t) =>
        t.id === task.id ? { ...t, status: "complete" as const } : t
      )
    );

    try {
      await updateTask(task.id, { status: "complete" });
      await fetchTasks();
    } catch (err) {
      setTasks(prev);
      setError(err instanceof Error ? err.message : "Failed to complete task");
    } finally {
      setOptimisticIds((s) => {
        const next = new Set(s);
        next.delete(task.id);
        return next;
      });
    }
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Delete "${task.title}"?`)) return;

    const prev = [...tasks];
    setOptimisticIds((s) => new Set(s).add(task.id));
    setTasks((ts) => ts.filter((t) => t.id !== task.id));
    setTotal((t) => Math.max(0, t - 1));

    try {
      await deleteTask(task.id);
      await fetchTasks();
    } catch (err) {
      setTasks(prev);
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setOptimisticIds((s) => {
        const next = new Set(s);
        next.delete(task.id);
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile status filter */}
      <div className="lg:hidden flex gap-1.5 p-3 overflow-x-auto border-b border-ink/10 dark:border-dark-muted/20 bg-surface-raised dark:bg-dark-raised">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              setFilters((f) => ({ ...f, status: opt.value, page: 1 }))
            }
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              (filters.status ?? "") === opt.value
                ? "bg-rail text-white"
                : "bg-ink/5 dark:bg-dark-muted/15 text-ink-muted dark:text-dark-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <aside className="hidden lg:flex lg:w-56 shrink-0 bg-rail text-white p-5 lg:min-h-screen flex-col gap-6 relative overflow-hidden">
        <div className="absolute inset-0 ledger-rules-dark pointer-events-none" aria-hidden />
        <div className="relative">
          <p className="font-display text-xl">Ledger</p>
          <p className="font-mono text-[10px] text-white/40 mt-0.5 truncate">
            {user?.email}
          </p>
        </div>

        <nav className="relative space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-2">
            Filter
          </p>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setFilters((f) => ({ ...f, status: opt.value, page: 1 }))
              }
              className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                (filters.status ?? "") === opt.value
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </nav>

        <div className="relative mt-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={toggle}
            className="text-left px-3 py-2 text-sm text-white/60 hover:text-white"
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="text-left px-3 py-2 text-sm text-white/60 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-5 lg:p-10 max-w-4xl w-full ledger-paper">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted dark:text-dark-muted mb-2">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="font-display text-3xl lg:text-4xl">Your tasks</h1>
            <p className="text-sm text-ink-muted dark:text-dark-muted mt-1">
              {total === 0 && !loading
                ? "Nothing on the ledger yet"
                : `${total} task${total === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="shrink-0 px-4 py-2.5 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium shadow-sm"
          >
            Add task
          </button>
        </header>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            placeholder="Search by title…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-md bg-surface-raised dark:bg-dark-raised border border-ink/15 dark:border-dark-muted/30 text-sm"
            aria-label="Search tasks"
          />
          <select
            value={filters.sort_by}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                sort_by: e.target.value as TaskFilters["sort_by"],
                page: 1,
              }))
            }
            className="px-3 py-2 rounded-md bg-surface-raised dark:bg-dark-raised border border-ink/15 dark:border-dark-muted/30 text-sm"
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
          <select
            value={filters.sort_order}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                sort_order: e.target.value as "asc" | "desc",
                page: 1,
              }))
            }
            className="px-3 py-2 rounded-md bg-surface-raised dark:bg-dark-raised border border-ink/15 dark:border-dark-muted/30 text-sm"
            aria-label="Sort order"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>

        {!loading && tasks.length > 0 && <DeadlineHorizon tasks={tasks} />}

        {error && (
          <div
            role="alert"
            className="mb-4 px-4 py-3 rounded-md bg-rose/10 text-rose text-sm flex justify-between items-center"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {(showForm || editingTask) && (
          <div className="mb-6 p-5 rounded-lg bg-surface-raised dark:bg-dark-raised border border-ink/10 dark:border-dark-muted/20 shadow-sm">
            <h2 className="font-display text-lg mb-4">
              {editingTask ? "Edit task" : "New task"}
            </h2>
            <TaskForm
              initial={editingTask ?? undefined}
              loading={formLoading}
              onCancel={() => {
                setShowForm(false);
                setEditingTask(null);
              }}
              onSubmit={editingTask ? handleUpdate : handleCreate}
            />
          </div>
        )}

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-lg bg-ink/5 dark:bg-dark-muted/10 animate-pulse"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="font-display text-xl mb-2">Ledger is empty</p>
            <p className="text-sm text-ink-muted dark:text-dark-muted mb-6">
              {filters.search || filters.status
                ? "No tasks match your filters. Try adjusting them."
                : "Add your first task to get started."}
            </p>
            {!filters.search && !filters.status && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-md bg-action hover:bg-action-hover text-white text-sm"
              >
                Add task
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3" role="list">
            {tasks.map((task) => (
              <li key={task.id} className="task-enter">
                <TaskCard
                  task={task}
                  optimistic={optimisticIds.has(task.id)}
                  onEdit={setEditingTask}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav
            className="flex items-center justify-between mt-8 pt-4 border-t border-ink/10 dark:border-dark-muted/20"
            aria-label="Pagination"
          >
            <button
              type="button"
              disabled={filters.page === 1}
              onClick={() =>
                setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
              }
              className="px-3 py-1.5 text-sm rounded border border-ink/15 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm font-mono text-ink-muted dark:text-dark-muted">
              Page {filters.page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={filters.page === totalPages}
              onClick={() =>
                setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
              }
              className="px-3 py-1.5 text-sm rounded border border-ink/15 disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}
