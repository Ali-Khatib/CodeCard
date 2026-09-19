'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  createOwnerEventAction,
  deleteOwnerEventAction,
} from '@/app/actions/owner-events';
import { AppButton, AppCard } from '@/components/dashboard/ui/dashboard-ui';
import { FadeInView } from '@/components/dashboard/fade-in-view';
import { EMPTY_STATE_COPY } from '@/lib/dashboard/empty-state-copy';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { sanitizeMutationError } from '@/lib/dashboard/mutation-feedback';
import type { HomeFollowUp } from '@/lib/schedule/home-schedule-core';
import type { OwnerEvent } from '@/lib/schedule/owner-events-core';
import { formatScheduleDay, formatScheduleWhen } from '@/lib/schedule/datetime';

export type HomeScheduleSectionProps = {
  events: OwnerEvent[];
  followUps: HomeFollowUp[];
  scheduleError?: boolean;
  preview?: boolean;
  basePath?: string;
};

function defaultStartsAtLocal(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function HomeScheduleSection({
  events,
  followUps,
  scheduleError = false,
  preview = false,
  basePath = '/dashboard',
}: HomeScheduleSectionProps) {
  const { notifySuccess, notifyError } = useMutationFeedback();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState(defaultStartsAtLocal);
  const [pending, startTransition] = useTransition();

  const addEvent = () => {
    if (preview || pending) return;
    startTransition(async () => {
      const result = await createOwnerEventAction({
        title,
        location: location || null,
        startsAt,
      });
      if (!result.success) {
        notifyError(sanitizeMutationError(result.error, MUTATION_FEEDBACK.schedule.createFailed));
        return;
      }
      setTitle('');
      setLocation('');
      setStartsAt(defaultStartsAtLocal());
      notifySuccess(MUTATION_FEEDBACK.schedule.created);
    });
  };

  const removeEvent = (eventId: string, eventTitle: string) => {
    if (preview || pending) return;
            if (!window.confirm(`Remove "${eventTitle}" from your calendar?`)) return;
    startTransition(async () => {
      const result = await deleteOwnerEventAction({ eventId });
      if (!result.success) {
        notifyError(sanitizeMutationError(result.error, MUTATION_FEEDBACK.schedule.deleteFailed));
        return;
      }
      notifySuccess(MUTATION_FEEDBACK.schedule.deleted);
    });
  };

  return (
    <FadeInView delay={0.14}>
      <section className="cc-profile-home__zone" aria-label="Calendar and follow-ups">
        <div className="cc-profile-home__zone-head">
          <div>
            <p className="cc-workspace-section__eyebrow">Your calendar</p>
            <h2 className="cc-workspace-section__title">Events and follow-ups</h2>
            <p className="cc-workspace-section__copy">
              Put places you plan to be on the calendar, then keep warm intros from going cold.
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
          <div className="cc-home-schedule">
            <AppCard className="cc-home-schedule__col !p-5">
              <p className="text-[13px] text-[var(--app-smoke)]">Upcoming schedule</p>
              {events.length === 0 ? (
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--app-smoke)]">
                  {EMPTY_STATE_COPY.home.noEvents}
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {events.map((event) => (
                    <li key={event.id} className="cc-home-schedule__row">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--app-ink)]">{event.title}</p>
                        <p className="mt-0.5 text-[12px] text-[var(--app-smoke)]">
                          {formatScheduleWhen(event.startsAt)}
                          {event.location ? ` · ${event.location}` : ''}
                        </p>
                      </div>
                      {preview ? null : (
                        <button
                          type="button"
                          className="cc-home-schedule__remove"
                          onClick={() => removeEvent(event.id, event.title)}
                          disabled={pending}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {preview ? (
                <p className="mt-4 text-[12px] text-[var(--app-smoke)]">
                  Demo calendar. Sign in to add your own events.
                </p>
              ) : (
                <form
                  className="cc-home-schedule__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addEvent();
                  }}
                >
                  <label className="sr-only" htmlFor="home-event-title">
                    Event title
                  </label>
                  <input
                    id="home-event-title"
                    className="cc-app-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    required
                    placeholder="Conference, meetup, coffee"
                    disabled={pending}
                  />
                  <label className="sr-only" htmlFor="home-event-when">
                    Starts
                  </label>
                  <input
                    id="home-event-when"
                    className="cc-app-input"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    required
                    disabled={pending}
                  />
                  <label className="sr-only" htmlFor="home-event-location">
                    Location
                  </label>
                  <input
                    id="home-event-location"
                    className="cc-app-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={200}
                    placeholder="Optional place"
                    disabled={pending}
                  />
                  <button type="submit" className="cc-app-btn cc-app-btn--primary" disabled={pending}>
                    Add event
                  </button>
                </form>
              )}
            </AppCard>

            <AppCard className="cc-home-schedule__col !p-5">
              <p className="text-[13px] text-[var(--app-smoke)]">Follow-ups</p>
              {followUps.length === 0 ? (
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--app-smoke)]">
                  {EMPTY_STATE_COPY.home.noFollowUps}
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {followUps.map((item) => (
                    <li key={item.connectionId}>
                      <Link
                        href={`${basePath}/connections`}
                        className="cc-home-schedule__row cc-home-schedule__row--link"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--app-ink)]">{item.personName}</p>
                          <p className="mt-0.5 text-[12px] text-[var(--app-smoke)]">
                            {formatScheduleDay(item.followUpAt)}
                            {item.context ? ` · ${item.context}` : ''}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>
          </div>
        )}
      </section>
    </FadeInView>
  );
}
