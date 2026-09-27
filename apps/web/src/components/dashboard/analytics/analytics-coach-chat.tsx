'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';
import type { OwnerAnalyticsSummary } from '@/lib/dashboard/analytics-aggregate';
import {
  ANALYTICS_COACH_PROMPTS,
  answerAnalyticsQuestion,
  buildSampleCoachThread,
  type AnalyticsCoachMessage,
} from '@/lib/dashboard/analytics-coach';
import type { AnalyticsReview } from '@/lib/dashboard/analytics-review';
import { AppCard, SectionLabel } from '../ui/dashboard-ui';

export function AnalyticsCoachChat({
  review,
  summary,
  sample = false,
}: {
  review: AnalyticsReview;
  summary?: Pick<OwnerAnalyticsSummary, 'profileViews' | 'projectViews' | 'researchViews'>;
  sample?: boolean;
}) {
  const inputId = useId();
  const seed = useMemo(
    () => (sample ? buildSampleCoachThread(review) : []),
    [review, sample],
  );
  const [messages, setMessages] = useState<AnalyticsCoachMessage[]>(seed);
  const [draft, setDraft] = useState('');

  function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    const reply = answerAnalyticsQuestion(text, review, summary);
    setMessages((current) => [...current, { role: 'user', text }, { role: 'assistant', text: reply }]);
    setDraft('');
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(draft);
  }

  return (
    <AppCard className="cc-analytics-coach !p-5 md:!p-6" data-analytics-coach={sample ? 'sample' : 'live'}>
      <SectionLabel>{sample ? 'Sample coach' : 'Ask these numbers'}</SectionLabel>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--app-smoke)]">
        Turn the counts into a decision. Ask what to move, or what the traffic means.
      </p>

      <ul className="cc-analytics-coach__thread" aria-live="polite">
        {messages.length === 0 ? (
          <li className="cc-analytics-coach__empty">
            Start with a question below. The answer stays on this card&apos;s numbers.
          </li>
        ) : (
          messages.map((message, index) => (
            <li
              key={`${message.role}-${index}-${message.text.slice(0, 24)}`}
              className={`cc-analytics-coach__bubble cc-analytics-coach__bubble--${message.role}`}
            >
              <p>{message.text}</p>
            </li>
          ))
        )}
      </ul>

      <div className="cc-analytics-coach__prompts">
        {ANALYTICS_COACH_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="cc-analytics-coach__prompt"
            onClick={() => ask(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className="cc-analytics-coach__form" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor={inputId}>
          Ask about your analytics
        </label>
        <input
          id={inputId}
          className="cc-app-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask what to change…"
          autoComplete="off"
        />
        <button type="submit" className="cc-app-btn cc-app-btn--soft">
          Ask
        </button>
      </form>
    </AppCard>
  );
}
