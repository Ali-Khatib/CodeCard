export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type CalendarCell = {
  dateKey: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localDateKeyFromIso(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return formatDateKey(parsed);
}

export function todayDateKey(): string {
  return formatDateKey(new Date());
}

export function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function formatDayHeading(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Monday-first 6-week grid so month layouts stay the same height. */
export function monthCells(year: number, monthIndex: number): CalendarCell[] {
  const today = todayDateKey();
  const first = new Date(year, monthIndex, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIndex, 1 - startOffset);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const dateKey = formatDateKey(date);
    cells.push({
      dateKey,
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
      isToday: dateKey === today,
    });
  }
  return cells;
}

export function shiftMonth(
  year: number,
  monthIndex: number,
  delta: number,
): { year: number; monthIndex: number } {
  const next = new Date(year, monthIndex + delta, 1);
  return { year: next.getFullYear(), monthIndex: next.getMonth() };
}

export function isoFromLocalParts(
  dateKey: string,
  hour12: number,
  minute: number,
  meridiem: 'AM' | 'PM',
): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isInteger(hour12) || hour12 < 1 || hour12 > 12) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  let hour = hour12 % 12;
  if (meridiem === 'PM') hour += 12;
  const date = new Date(year, month, day, hour, minute, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Noon-ish UTC so the calendar day stays the same across common time zones. */
export function middayUtcIso(dateKey: string, hour = 17, minute = 0): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), hour, minute, 0, 0),
  ).toISOString();
}

export function timePartsFromIso(iso: string): {
  hour12: number;
  minute: number;
  meridiem: 'AM' | 'PM';
} {
  const date = new Date(iso);
  const hours = Number.isNaN(date.getTime()) ? 12 : date.getHours();
  const minute = Number.isNaN(date.getTime()) ? 0 : date.getMinutes();
  const meridiem: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return { hour12, minute, meridiem };
}
