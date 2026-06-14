import { describe, expect, it } from "vitest";
import { getUrgency, urgencyColor, formatDueDate } from "./urgency";
import type { Task } from "./types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "1",
    user_id: "u1",
    title: "Test",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("getUrgency", () => {
  it("returns none for completed tasks", () => {
    expect(getUrgency(makeTask({ status: "complete" }))).toBe("none");
  });

  it("returns overdue for past due dates", () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    const y = past.getFullYear();
    const m = String(past.getMonth() + 1).padStart(2, "0");
    const d = String(past.getDate()).padStart(2, "0");
    expect(
      getUrgency(makeTask({ due_date: `${y}-${m}-${d}T00:00:00Z` }))
    ).toBe("overdue");
  });

  it("returns high for tasks due within a day", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 1);
    const y = soon.getFullYear();
    const m = String(soon.getMonth() + 1).padStart(2, "0");
    const d = String(soon.getDate()).padStart(2, "0");
    expect(getUrgency(makeTask({ due_date: `${y}-${m}-${d}T00:00:00Z` }))).toBe(
      "high"
    );
  });
});

describe("urgencyColor", () => {
  it("maps overdue to rose", () => {
    expect(urgencyColor("overdue")).toContain("rose");
  });
});

describe("formatDueDate", () => {
  it("handles null", () => {
    expect(formatDueDate(null)).toBe("No due date");
  });
});
