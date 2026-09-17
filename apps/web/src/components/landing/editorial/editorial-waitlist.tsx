'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { joinDescribedBy } from '@/lib/a11y/described-by';
import { MOTION_DURATION } from '@/components/motion/motion-tokens';
import {
  submitWaitlistEmail,
  validateWaitlistEmail,
  waitlistValidationMessage,
  type WaitlistSubmitResult,
} from '@/lib/waitlist/submit-waitlist';

type FocusedZoom = { scale: number; y: number };

function readFocusedZoom(): FocusedZoom {
  if (typeof window === 'undefined') return { scale: 1.2, y: -12 };
  if (window.matchMedia('(max-width: 767px)').matches) {
    return { scale: 1.06, y: -4 };
  }
  if (window.matchMedia('(max-width: 1024px)').matches) {
    return { scale: 1.12, y: -8 };
  }
  return { scale: 1.22, y: -12 };
}

function useFocusedZoom(active: boolean, reduceMotion: boolean | null): FocusedZoom {
  const [zoom, setZoom] = useState<FocusedZoom>({ scale: 1.2, y: -12 });

  useEffect(() => {
    const update = () => setZoom(readFocusedZoom());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (reduceMotion || !active) return { scale: 1, y: 0 };
  return zoom;
}

export function EditorialWaitlist() {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const stageRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<WaitlistSubmitResult, { ok: true }> | null>(
    null,
  );

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;

    const onFocusIn = () => setFocused(true);
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (next && root.contains(next)) return;
      window.setTimeout(() => {
        if (!root.contains(document.activeElement)) setFocused(false);
      }, 0);
    };

    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    return () => {
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const isActive = focused || email.trim().length > 0 || Boolean(result);
  const zoom = useFocusedZoom(isActive, reduceMotion);
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: MOTION_DURATION.section, ease: [0.22, 1, 0.36, 1] as const };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const invalid = validateWaitlistEmail(email);
    if (invalid) {
      setError(waitlistValidationMessage(invalid));
      return;
    }
    setPending(true);
    const next = await submitWaitlistEmail(email);
    setPending(false);
    if (!next.ok) {
      setError(waitlistValidationMessage(next.error));
      return;
    }
    setResult(next);
  };

  return (
    <section
      id="waitlist"
      className="cc-ed__section cc-ed-waitlist"
      data-chapter-section="waitlist"
      data-testid="editorial-waitlist"
      aria-labelledby="editorial-waitlist-heading"
    >
      <motion.div
        ref={stageRef}
        className="cc-ed-waitlist__stage"
        animate={{ scale: zoom.scale, y: zoom.y }}
        transition={transition}
        data-waitlist-zoomed={isActive && !reduceMotion ? 'true' : 'false'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {result ? (
            <motion.div
              key="success"
              className="cc-ed-waitlist__copy"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={transition}
            >
              <p className="cc-ed-waitlist__eyebrow">Confirmed</p>
              <h2
                id="editorial-waitlist-heading"
                className="cc-ed-waitlist__title"
              >
                <span className="cc-ed-waitlist__lead">YOU&apos;RE</span>
                <span className="cc-ed-waitlist__accent">IN.</span>
              </h2>
              <p className="cc-ed-waitlist__lede">
                {result.status === 'already'
                  ? "You're already on the list. We'll let you know when CodeCard is ready."
                  : "We'll let you know when CodeCard is ready."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="cc-ed-waitlist__copy"
              initial={false}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={transition}
            >
              <p className="cc-ed-waitlist__eyebrow">Waitlist</p>
              <h2
                id="editorial-waitlist-heading"
                className="cc-ed-waitlist__title"
              >
                <span className="cc-ed-waitlist__lead">GET EARLY</span>
                <span className="cc-ed-waitlist__accent">ACCESS</span>
              </h2>
              <p id={hintId} className="cc-ed-waitlist__lede">
                Be the first to know when CodeCard is ready.
              </p>
              <form
                className="cc-ed-waitlist__form"
                onSubmit={onSubmit}
                noValidate
                onPointerDown={() => setFocused(true)}
              >
                <label htmlFor={fieldId} className="cc-ed-waitlist__label">
                  Email
                </label>
                <input
                  id={fieldId}
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  placeholder="Enter your email"
                  aria-invalid={Boolean(error)}
                  aria-describedby={joinDescribedBy(hintId, error ? errorId : null)}
                  className="cc-ed-waitlist__input"
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFocused(true);
                    if (error) setError(null);
                  }}
                />
                {error ? (
                  <p id={errorId} className="cc-ed-waitlist__error" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="cc-ed__btn-primary cc-instant-press cc-ed-waitlist__submit"
                  disabled={pending}
                >
                  {pending ? 'Joining…' : 'Join the waitlist'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
