/** Accept ISO timestamps, date-only (YYYY-MM-DD), or datetime-local strings. */
export function coerceIsoDateTime(
  value: string | null | undefined,
): { ok: true; iso: string | null } | { ok: false } {
  if (value === undefined) {
    return { ok: false };
  }
  if (value == null) {
    return { ok: true, iso: null };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true, iso: null };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { ok: true, iso: `${trimmed}T12:00:00.000Z` };
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return { ok: false };
  }
  return { ok: true, iso: new Date(parsed).toISOString() };
}

export function formatScheduleWhen(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatScheduleDay(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}
