'use client';

import Link from 'next/link';
import { useId, useState, type FormEvent } from 'react';
import { LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import {
  submitWaitlistEmail,
  validateWaitlistEmail,
  waitlistValidationMessage,
} from '@/lib/waitlist/submit-waitlist';
import { useInViewOnce } from './hooks';
import { Magnetic } from './magnetic';

/**
 * The one full-bleed moment of colour: signal. The line from the product
 * brief, crossed out and replaced.
 */
export function Cc2Closing() {
  const [ref, seen] = useInViewOnce<HTMLElement>(0.3);
  const id = useId();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<'joined' | 'already' | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const invalid = validateWaitlistEmail(email);
    if (invalid) {
      setError(waitlistValidationMessage(invalid));
      return;
    }
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const honey = (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    const res = await submitWaitlistEmail(email, { website: honey });
    setPending(false);
    if (!res.ok) {
      setError(waitlistValidationMessage(res.error));
      return;
    }
    setDone(res.status);
  };

  return (
    <section
      ref={ref}
      id="start"
      className="cc2-closing cc2-tone cc2-tone--signal cc2-grain"
      data-in={seen ? 'true' : 'false'}
      aria-labelledby="cc2-closing-title"
    >
      <div className="cc2-wrap cc2-closing__inner">
        <p className="cc2-closing__old">The missing piece in every introduction.</p>
        <h2 id="cc2-closing-title" className="cc2-display cc2-closing__title">
          <span className="cc2-line" style={{ ['--i' as string]: 0 }}>
            <span className="cc2-line__in">Here’s my</span>
          </span>
          <span className="cc2-line" style={{ ['--i' as string]: 1 }}>
            <span className="cc2-line__in">CodeCard.</span>
          </span>
        </h2>

        <div className="cc2-closing__actions">
          <Magnetic>
            <Link href="/sign-up" className="cc2-btn cc2-btn--ink" data-testid="finale-primary-cta">
              Create your CodeCard
              <span className="cc2-btn__arrow" aria-hidden />
            </Link>
          </Magnetic>
          <a href={LIVE_DEMO_PROFILE_HREF} className="cc2-btn cc2-btn--line">
            See a live card
          </a>
        </div>

        <form className="cc2-wait" onSubmit={onSubmit} noValidate aria-describedby={`${id}-msg`}>
          <label htmlFor={`${id}-email`} className="cc2-wait__label">
            Get the app when it ships
          </label>
          {done ? (
            <p id={`${id}-msg`} className="cc2-wait__done" role="status">
              {done === 'already' ? 'You are already on the list.' : 'You are on the list. We will email you once.'}
            </p>
          ) : (
            <>
              <div className="cc2-wait__row">
                <input
                  id={`${id}-email`}
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={error ? true : undefined}
                />
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="cc2-wait__trap"
                />
                <button type="submit" className="cc2-btn cc2-btn--ink cc2-btn--sm" disabled={pending}>
                  {pending ? 'Joining' : 'Join'}
                </button>
              </div>
              <p id={`${id}-msg`} className="cc2-wait__error" role="alert">
                {error}
              </p>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
