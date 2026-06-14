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
    expect(
      getUrgency(makeTask({ due_date: past.toISOString() }))
    ).toBe("overdue");
  });

  it("returns high for tasks due within a day", () => {
    const soon = new Date();
    soon.setHours(soon.getHours() + 12);
    expect(getUrgency(makeTask({ due_date: soon.toISOString() }))).toBe("high");
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
