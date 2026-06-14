import { describe, expect, it } from "vitest";
import {
  formatDueDate,
  parseCalendarDate,
  toDateInputValue,
  toLocalDate,
} from "./dates";

describe("toDateInputValue", () => {
  it("extracts YYYY-MM-DD from ISO timestamps", () => {
    expect(toDateInputValue("2026-02-12T00:00:00Z")).toBe("2026-02-12");
    expect(toDateInputValue("2026-02-12T18:30:00.000Z")).toBe("2026-02-12");
  });

  it("returns empty for null", () => {
    expect(toDateInputValue(null)).toBe("");
  });
});

describe("parseCalendarDate", () => {
  it("parses without timezone shift", () => {
    expect(parseCalendarDate("2026-02-12T00:00:00Z")).toEqual({
      year: 2026,
      month: 2,
      day: 12,
    });
  });
});

describe("toLocalDate", () => {
  it("creates local midnight for the calendar date", () => {
    const d = toLocalDate("2026-02-12T00:00:00Z");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(1);
    expect(d?.getDate()).toBe(12);
  });
});

describe("formatDueDate", () => {
  it("handles null", () => {
    expect(formatDueDate(null)).toBe("No due date");
  });

  it("formats the calendar date, not UTC-shifted date", () => {
    const formatted = formatDueDate("2026-02-12T00:00:00Z");
    expect(formatted).toContain("12");
    expect(formatted).toContain("Feb");
    expect(formatted).not.toContain("2222");
  });
});
