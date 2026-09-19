'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  createOwnerEventAction,
  deleteOwnerEventAction,
  updateOwnerEventAction,
} from '@/app/actions/owner-events';
import { AppButton, AppCard } from '@/components/dashboard/ui/dashboard-ui';
import { FadeInView } from '@/components/dashboard/fade-in-view';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { sanitizeMutationError } from '@/lib/dashboard/mutation-feedback';
import type { HomeFollowUp } from '@/lib/schedule/home-schedule-core';
import type { OwnerEvent } from '@/lib/schedule/owner-events-core';
import {
  formatDayHeading,
  isoFromLocalParts,
  localDateKeyFromIso,
  monthCells,
  monthLabel,
  shiftMonth,
  timePartsFromIso,
  todayDateKey,
  WEEKDAY_LABELS,
} from '@/lib/schedule/calendar-month';
import { formatScheduleWhen } from '@/lib/schedule/datetime';

export type HomeScheduleSectionProps = {
  events: OwnerEvent[];
  followUps: HomeFollowUp[];
  scheduleError?: boolean;
  preview?: boolean;
  basePath?: string;
};

const MINUTES = [0, 15, 30, 45];
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function minuteOptions(current: number): number[] {
  if (MINUTES.includes(current)) return MINUTES;
  return [...MINUTES, current].sort((a, b) => a - b);
}

export function HomeScheduleSection({
  events,
  followUps,
  scheduleError = false,
  preview = false,
  basePath = '/dashboard',
}: HomeScheduleSectionProps) {
  const { notifySuccess, notifyError } = useMutationFeedback();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [selectedKey, setSelectedKey] = useState(todayDateKey);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [hour12, setHour12] = useState(12);
  const [minute, setMinute] = useState(0);
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('AM');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localEvents, setLocalEvents] = useState(events);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const listedEvents = preview ? localEvents : events;
  const cells = useMemo(() => monthCells(year, monthIndex), [year, monthIndex]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, OwnerEvent[]>();
    for (const event of listedEvents) {
      const key = localDateKeyFromIso(event.startsAt);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [listedEvents]);

  const followUpsByDay = useMemo(() => {
    const map = new Map<string, HomeFollowUp[]>();
    for (const item of followUps) {
      const key = localDateKeyFromIso(item.followUpAt);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [followUps]);

  const dayEvents = eventsByDay.get(selectedKey) ?? [];
  const dayFollowUps = followUpsByDay.get(selectedKey) ?? [];

  const resetForm = (nextKey = selectedKey) => {
    setEditingId(null);
    setTitle('');
    setLocation('');
    setHour12(12);
    setMinute(0);
    setMeridiem('AM');
    setSelectedKey(nextKey);
  };

  const startEdit = (event: OwnerEvent) => {
    const parts = timePartsFromIso(event.startsAt);
    setEditingId(event.id);
    setTitle(event.title);
    setLocation(event.location ?? '');
    setHour12(parts.hour12);
    setMinute(parts.minute);
    setMeridiem(parts.meridiem);
  };

  const saveEvent = () => {
    if (pending) return;
    const startsAt = isoFromLocalParts(selectedKey, hour12, minute, meridiem);
    if (!startsAt || !title.trim()) {
      notifyError(MUTATION_FEEDBACK.schedule.createFailed);
      return;
    }
    const payload = {
      title: title.trim(),
      location: location.trim() || null,
      startsAt,
    };
    if (preview) {
      setLocalEvents((current) => {
        if (editingId) {
          return current.map((event) =>
            event.id === editingId ? { ...event, ...payload } : event,
          );
        }
        return [
          ...current,
          {
            id: `demo-${Date.now()}`,
            ...payload,
            endsAt: null,
            notes: null,
          },
        ];
      });
      notifySuccess(editingId ? MUTATION_FEEDBACK.schedule.updated : MUTATION_FEEDBACK.schedule.created);
      resetForm(selectedKey);
      return;
    }
    startTransition(async () => {
      const result = editingId
        ? await updateOwnerEventAction({ eventId: editingId, ...payload })
        : await createOwnerEventAction(payload);
      if (!result.success) {
        notifyError(
          sanitizeMutationError(
            result.error,
            editingId ? MUTATION_FEEDBACK.schedule.updateFailed : MUTATION_FEEDBACK.schedule.createFailed,
          ),
        );
        return;
      }
      notifySuccess(editingId ? MUTATION_FEEDBACK.schedule.updated : MUTATION_FEEDBACK.schedule.created);
      resetForm(selectedKey);
    });
  };

  const removeEvent = (event: OwnerEvent) => {
    if (pending) return;
    if (!window.confirm(`Remove "${event.title}" from your calendar?`)) return;
    if (preview) {
      setLocalEvents((current) => current.filter((item) => item.id !== event.id));
      if (editingId === event.id) resetForm(selectedKey);
      notifySuccess(MUTATION_FEEDBACK.schedule.deleted);
      return;
    }
    startTransition(async () => {
      const result = await deleteOwnerEventAction({ eventId: event.id });
      if (!result.success) {
        notifyError(sanitizeMutationError(result.error, MUTATION_FEEDBACK.schedule.deleteFailed));
        return;
      }
      if (editingId === event.id) resetForm(selectedKey);
      notifySuccess(MUTATION_FEEDBACK.schedule.deleted);
    });
  };

  const goMonth = (delta: number) => {
    const next = shiftMonth(year, monthIndex, delta);
    setYear(next.year);
    setMonthIndex(next.monthIndex);
  };

  return (
    <FadeInView delay={0.14}>
      <section className="cc-profile-home__zone" aria-label="Calendar and follow-ups">
        <div className="cc-profile-home__zone-head">
          <div>
            <p className="cc-workspace-section__eyebrow">Your calendar</p>
            <h2 className="cc-workspace-section__title">Events and follow-ups</h2>
            <p className="cc-workspace-section__copy">
              Pick a day. See what is already planned. Add a place you will be, or open a follow-up.
            </p>
          </div>
          <AppButton variant="ghost" href={`${basePath}/connections`}>
            Open Connections →
          </AppButton>
        </div>

        {scheduleError ? (
          <AppCard tone="meringue" className="!p-5">
            <p className="text-[15px] text-[var(--app-ink)]">
              Your calendar could not be loaded. Identity and sharing still work.
            </p>
          </AppCard>
        ) : (
          <div className="cc-home-calendar">
            <AppCard className="cc-home-calendar__month !p-4 sm:!p-5">
              <div className="cc-home-calendar__nav">
                <button
                  type="button"
                  className="cc-home-calendar__nav-btn"
                  onClick={() => goMonth(-1)}
                  aria-label="Previous month"
                >
                  ←
                </button>
                <h3 className="cc-home-calendar__month-label">{monthLabel(year, monthIndex)}</h3>
                <button
                  type="button"
                  className="cc-home-calendar__nav-btn"
                  onClick={() => goMonth(1)}
                  aria-label="Next month"
                >
                  →
                </button>
              </div>

              <div className="cc-home-calendar__weekdays" aria-hidden>
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="cc-home-calendar__grid" role="grid" aria-label={monthLabel(year, monthIndex)}>
                {Array.from({ length: 6 }, (_, week) => (
                  <div key={week} className="cc-home-calendar__week" role="row">
                    {cells.slice(week * 7, week * 7 + 7).map((cell) => {
                      const hasEvent = (eventsByDay.get(cell.dateKey)?.length ?? 0) > 0;
                      const hasFollowUp = (followUpsByDay.get(cell.dateKey)?.length ?? 0) > 0;
                      const selected = cell.dateKey === selectedKey;
                      const label = [
                        formatDayHeading(cell.dateKey),
                        hasEvent ? 'has an event' : '',
                        hasFollowUp ? 'has a follow-up' : '',
                      ]
                        .filter(Boolean)
                        .join(', ');
                      return (
                        <button
                          key={cell.dateKey}
                          type="button"
                          data-calendar-day={cell.dateKey}
                          aria-label={label}
                          aria-pressed={selected}
                          className={[
                            'cc-home-calendar__day',
                            cell.inMonth ? '' : 'cc-home-calendar__day--outside',
                            cell.isToday ? 'cc-home-calendar__day--today' : '',
                            selected ? 'cc-home-calendar__day--selected' : '',
                            hasEvent ? 'cc-home-calendar__day--event' : '',
                            hasFollowUp ? 'cc-home-calendar__day--followup' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => {
                            setSelectedKey(cell.dateKey);
                            if (editingId) resetForm(cell.dateKey);
                          }}
                        >
                          <span>{cell.day}</span>
                          <span className="cc-home-calendar__dots" aria-hidden>
                            {hasEvent ? <i className="cc-home-calendar__dot cc-home-calendar__dot--event" /> : null}
                            {hasFollowUp ? (
                              <i className="cc-home-calendar__dot cc-home-calendar__dot--followup" />
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <ul className="cc-home-calendar__legend">
                <li>
                  <i className="cc-home-calendar__dot cc-home-calendar__dot--event" /> Event
                </li>
                <li>
                  <i className="cc-home-calendar__dot cc-home-calendar__dot--followup" /> Follow-up
                </li>
              </ul>
            </AppCard>

            <AppCard className="cc-home-calendar__day-panel !p-4 sm:!p-5">
              <p className="cc-home-calendar__day-kicker">Selected day</p>
              <h3 className="cc-home-calendar__day-title">{formatDayHeading(selectedKey)}</h3>

              {dayEvents.length === 0 && dayFollowUps.length === 0 ? (
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--app-smoke)]">
                  Nothing planned this day. Add an event below, or set a follow-up from Connections.
                </p>
              ) : null}

              {dayEvents.length > 0 ? (
                <ul className="cc-home-calendar__items">
                  {dayEvents.map((event) => (
                    <li key={event.id} className="cc-home-calendar__item">
                      <div className="min-w-0">
                        <p className="cc-home-calendar__item-kind">Event</p>
                        <p className="truncate font-medium text-[var(--app-ink)]">{event.title}</p>
                        <p className="mt-0.5 text-[12px] text-[var(--app-smoke)]">
                          {formatScheduleWhen(event.startsAt)}
                          {event.location ? ` · ${event.location}` : ''}
                        </p>
                      </div>
                      <div className="cc-home-calendar__item-actions">
                        <button type="button" onClick={() => startEdit(event)} disabled={pending}>
                          Edit
                        </button>
                        <button type="button" onClick={() => removeEvent(event)} disabled={pending}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {dayFollowUps.length > 0 ? (
                <ul className="cc-home-calendar__items">
                  {dayFollowUps.map((item) => (
                    <li key={item.connectionId} className="cc-home-calendar__item">
                      <div className="min-w-0">
                        <p className="cc-home-calendar__item-kind cc-home-calendar__item-kind--followup">
                          Follow-up
                        </p>
                        <p className="truncate font-medium text-[var(--app-ink)]">{item.personName}</p>
                        {item.context ? (
                          <p className="mt-0.5 text-[12px] text-[var(--app-smoke)]">{item.context}</p>
                        ) : null}
                      </div>
                      <Link href={`${basePath}/connections`} className="cc-home-calendar__open">
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              {preview ? (
                <p className="mt-4 text-[12px] text-[var(--app-smoke)]">
                  Demo calendar. Changes stay on this page. Sign in to save events to your account.
                </p>
              ) : null}

              <form
                  className="cc-home-calendar__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEvent();
                  }}
                >
                  <p className="cc-home-calendar__form-title">
                    {editingId ? 'Edit event' : 'Add event'}
                  </p>
                  <label className="cc-home-calendar__label" htmlFor="home-cal-title">
                    Event title
                  </label>
                  <input
                    id="home-cal-title"
                    className="cc-app-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    required
                    placeholder="Conference, meetup, coffee"
                    disabled={pending}
                  />
                  <div className="cc-home-calendar__time">
                    <label className="cc-home-calendar__label" htmlFor="home-cal-hour">
                      Time
                    </label>
                    <div className="cc-home-calendar__time-row">
                      <select
                        id="home-cal-hour"
                        className="cc-app-input"
                        value={hour12}
                        onChange={(e) => setHour12(Number(e.target.value))}
                        disabled={pending}
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <span aria-hidden>:</span>
                      <select
                        className="cc-app-input"
                        aria-label="Minutes"
                        value={minute}
                        onChange={(e) => setMinute(Number(e.target.value))}
                        disabled={pending}
                      >
                        {minuteOptions(minute).map((m) => (
                          <option key={m} value={m}>
                            {String(m).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <select
                        className="cc-app-input"
                        aria-label="AM or PM"
                        value={meridiem}
                        onChange={(e) => setMeridiem(e.target.value as 'AM' | 'PM')}
                        disabled={pending}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                  <label className="cc-home-calendar__label" htmlFor="home-cal-place">
                    Place
                  </label>
                  <input
                    id="home-cal-place"
                    className="cc-app-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={200}
                    placeholder="Optional"
                    disabled={pending}
                  />
                  <div className="cc-home-calendar__form-actions">
                    {editingId ? (
                      <button
                        type="button"
                        className="cc-app-btn cc-app-btn--ghost"
                        onClick={() => resetForm(selectedKey)}
                        disabled={pending}
                      >
                        Cancel
                      </button>
                    ) : null}
                    <button type="submit" className="cc-app-btn cc-app-btn--primary" disabled={pending}>
                      {editingId ? 'Save event' : 'Add event'}
                    </button>
                  </div>
                </form>
            </AppCard>
          </div>
        )}
      </section>
    </FadeInView>
  );
}
