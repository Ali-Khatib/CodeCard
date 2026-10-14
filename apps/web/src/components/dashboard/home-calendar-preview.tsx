'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { HomeFollowUp } from '@/lib/schedule/home-schedule-core';
import type { OwnerEvent } from '@/lib/schedule/owner-events-core';
import { formatDateKey, localDateKeyFromIso, todayDateKey } from '@/lib/schedule/calendar-month';
import { formatScheduleWhen } from '@/lib/schedule/datetime';

type Item = {
  id: string;
  when: string;
  title: string;
  kind: 'Event' | 'Follow-up';
};

function weekKeys(today: Date): { key: string; label: string; day: number }[] {
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      key: formatDateKey(date),
      label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index] ?? '',
      day: date.getDate(),
    };
  });
}

export function HomeCalendarPreview({
  events,
  followUps,
  scheduleError = false,
  basePath = '/dashboard',
}: {
  events: OwnerEvent[];
  followUps: HomeFollowUp[];
  scheduleError?: boolean;
  basePath?: string;
}) {
  const today = todayDateKey();
  const days = useMemo(() => weekKeys(new Date()), []);
  const marked = useMemo(() => {
    const keys = new Set<string>();
    for (const event of events) {
      const key = localDateKeyFromIso(event.startsAt);
      if (key) keys.add(key);
    }
    for (const item of followUps) {
      const key = localDateKeyFromIso(item.followUpAt);
      if (key) keys.add(key);
    }
    return keys;
  }, [events, followUps]);

  const upcoming = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const items: Item[] = [
      ...events.map((event) => ({
        id: `event-${event.id}`,
        when: event.startsAt,
        title: event.title,
        kind: 'Event' as const,
      })),
      ...followUps.map((item) => ({
        id: `follow-${item.connectionId}`,
        when: item.followUpAt,
        title: item.personName,
        kind: 'Follow-up' as const,
      })),
    ];
    return items
      .filter((item) => {
        const time = new Date(item.when).getTime();
        return !Number.isNaN(time) && time >= start.getTime();
      })
      .sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime())
      .slice(0, 3);
  }, [events, followUps]);

  const href = `${basePath}/calendar`;

  return (
    <section className="cc-home-desk__calendar" aria-labelledby="home-calendar-preview">
      <div className="cc-home-desk__calendar-head">
        <h2 id="home-calendar-preview" className="cc-home-desk__section-title">
          Your calendar
        </h2>
        <Link href={href} className="cc-home-desk__text-link">
          Open calendar
        </Link>
      </div>
      {scheduleError ? (
        <p className="cc-home-desk__muted">Your calendar could not be loaded.</p>
      ) : (
        <>
          <ol className="cc-home-week">
            {days.map((day) => (
              <li key={day.key}>
                <Link
                  href={href}
                  className={`cc-home-week__day${day.key === today ? ' is-today' : ''}${marked.has(day.key) ? ' has-items' : ''}`}
                  aria-label={`${day.label} ${day.day}${marked.has(day.key) ? ', scheduled' : ''}`}
                >
                  <span className="cc-home-week__label">{day.label}</span>
                  <span className="cc-home-week__num">{day.day}</span>
                </Link>
              </li>
            ))}
          </ol>
          {upcoming.length > 0 ? (
            <ul className="cc-home-upcoming">
              {upcoming.map((item) => (
                <li key={item.id}>
                  <Link href={href}>
                    <span className="cc-home-upcoming__kind">{item.kind}</span>
                    <span className="cc-home-upcoming__title">{item.title}</span>
                    <span className="cc-home-upcoming__when">{formatScheduleWhen(item.when)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cc-home-desk__muted">Nothing scheduled this week.</p>
          )}
        </>
      )}
    </section>
  );
}
