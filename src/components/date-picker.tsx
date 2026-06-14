"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  calendarDateToInput,
  formatDateInputValue,
  getDaysInMonth,
  getFirstWeekday,
  parseCalendarDate,
  toDateInputValue,
} from "@/lib/dates";

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({ id, value, onChange, label = "Due date" }: DatePickerProps) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const parsed = parseCalendarDate(value);
  const today = new Date();
  const viewYear = parsed?.year ?? today.getFullYear();
  const viewMonth = parsed?.month ?? today.getMonth() + 1;

  const [cursorYear, setCursorYear] = useState(viewYear);
  const [cursorMonth, setCursorMonth] = useState(viewMonth);

  useEffect(() => {
    if (open) {
      setCursorYear(viewYear);
      setCursorMonth(viewMonth);
    }
  }, [open, viewYear, viewMonth]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function selectDay(day: number) {
    onChange(calendarDateToInput({ year: cursorYear, month: cursorMonth, day }));
    setOpen(false);
    triggerRef.current?.focus();
  }

  function prevMonth() {
    if (cursorMonth === 1) {
      setCursorMonth(12);
      setCursorYear((y) => y - 1);
    } else {
      setCursorMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (cursorMonth === 12) {
      setCursorMonth(1);
      setCursorYear((y) => y + 1);
    } else {
      setCursorMonth((m) => m + 1);
    }
  }

  const daysInMonth = getDaysInMonth(cursorYear, cursorMonth);
  const firstWeekday = getFirstWeekday(cursorYear, cursorMonth);
  const monthLabel = new Date(cursorYear, cursorMonth - 1, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" }
  );

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayParts = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm mb-1.5">
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listId}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-surface dark:bg-dark-bg border border-ink/15 dark:border-dark-muted/30 text-sm text-left hover:border-ink/25 dark:hover:border-dark-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
      >
        <span className={value ? "font-mono" : "text-ink-muted dark:text-dark-muted"}>
          {value ? formatDateInputValue(value) : "Pick a date"}
        </span>
        <CalendarIcon />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={listId}
          role="dialog"
          aria-label="Choose due date"
          className="absolute z-40 mt-1.5 w-full min-w-[17rem] rounded-lg border border-ink/12 dark:border-dark-muted/25 bg-surface-raised dark:bg-dark-raised shadow-lg overflow-hidden animate-[modal-enter_0.15s_ease-out]"
        >
          <div className="ledger-rules-dark h-1 opacity-30" aria-hidden />
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded hover:bg-ink/5 dark:hover:bg-dark-muted/15 text-ink-muted dark:text-dark-muted"
                aria-label="Previous month"
              >
                <ChevronLeft />
              </button>
              <p className="font-mono text-xs uppercase tracking-wider text-ink-muted dark:text-dark-muted">
                {monthLabel}
              </p>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded hover:bg-ink/5 dark:hover:bg-dark-muted/15 text-ink-muted dark:text-dark-muted"
                aria-label="Next month"
              >
                <ChevronRight />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {WEEKDAYS.map((d) => (
                <span
                  key={d}
                  className="text-center font-mono text-[10px] text-ink-muted/70 dark:text-dark-muted/70 py-1"
                >
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (day === null) {
                  return <span key={`empty-${i}`} />;
                }
                const isSelected =
                  parsed?.year === cursorYear &&
                  parsed?.month === cursorMonth &&
                  parsed?.day === day;
                const isToday =
                  todayParts.year === cursorYear &&
                  todayParts.month === cursorMonth &&
                  todayParts.day === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={`aspect-square rounded text-sm font-mono transition-colors ${
                      isSelected
                        ? "bg-action text-white"
                        : isToday
                          ? "ring-1 ring-ember/60 text-ember hover:bg-ember/10"
                          : "hover:bg-ink/5 dark:hover:bg-dark-muted/15"
                    }`}
                    aria-pressed={isSelected}
                    aria-label={`${monthLabel} ${day}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-ink/8 dark:border-dark-muted/20">
              <button
                type="button"
                onClick={() => {
                  onChange(
                    calendarDateToInput({
                      year: todayParts.year,
                      month: todayParts.month,
                      day: todayParts.day,
                    })
                  );
                  setOpen(false);
                }}
                className="flex-1 px-2 py-1.5 text-xs rounded border border-ink/12 dark:border-dark-muted/25 hover:bg-ink/5 dark:hover:bg-dark-muted/10"
              >
                Today
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="flex-1 px-2 py-1.5 text-xs rounded text-ink-muted dark:text-dark-muted hover:bg-ink/5 dark:hover:bg-dark-muted/10"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0 text-ink-muted dark:text-dark-muted"
      aria-hidden
    >
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export { toDateInputValue };
