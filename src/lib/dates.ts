/** Calendar-date helpers — treat due dates as YYYY-MM-DD, never UTC timestamps. */

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

export function parseCalendarDate(
  iso: string | null | undefined
): CalendarDate | null {
  const value = toDateInputValue(iso);
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

export function toLocalDate(iso: string | null | undefined): Date | null {
  const d = parseCalendarDate(iso);
  if (!d) return null;
  return new Date(d.year, d.month - 1, d.day);
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatDueDate(iso: string | null): string {
  const d = parseCalendarDate(iso);
  if (!d) return "No due date";
  const local = new Date(d.year, d.month - 1, d.day);
  const currentYear = new Date().getFullYear();
  return local.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.year !== currentYear ? "numeric" : undefined,
  });
}

export function formatDateInputValue(value: string): string {
  if (!value) return "";
  const d = parseCalendarDate(value);
  if (!d) return value;
  const local = new Date(d.year, d.month - 1, d.day);
  return local.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: d.year !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

export function calendarDateToInput({ year, month, day }: CalendarDate): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getFirstWeekday(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}
