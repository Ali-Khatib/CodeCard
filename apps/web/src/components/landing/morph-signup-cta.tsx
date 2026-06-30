'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

export function MorphSignupCta({
  layoutId = 'landing-signup-cta',
  label = 'Start free — under 5 minutes',
}: {
  layoutId?: string;
  label?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const router = useRouter();

  useEffect(() => {
    if (expanded) emailRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : '';
    router.push(`/sign-up${q}`);
  };

  return (
    <motion.div layoutId={layoutId} className="overflow-hidden rounded-full" transition={{ duration: 0.22 }}>
      <AnimatePresence mode="wait" initial={false}>
        {!expanded ? (
          <motion.button
            key="cta"
            type="button"
            onClick={() => setExpanded(true)}
            onMouseEnter={() => router.prefetch('/sign-up')}
            onFocus={() => router.prefetch('/sign-up')}
            whileTap={{ scale: 0.98 }}
            className="cc-btn-pill-primary h-11 min-w-[200px] px-7 text-center leading-tight"
          >
            {label}
          </motion.button>
        ) : (
          <motion.form key="form" onSubmit={submit} className="cc-expand-form min-w-[280px] p-4 sm:min-w-[320px]">
            <label htmlFor={`${id}-email`} className="text-[13px] font-medium text-graphite">
              Start with email
            </label>
            <input
              ref={emailRef}
              id={`${id}-email`}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="cc-input mt-2 w-full"
            />
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setExpanded(false)} className="cc-btn-pill-ghost flex-1 py-2 text-[14px]">
                Back
              </button>
              <button type="submit" className="cc-btn-pill-primary flex-1 py-2 text-[14px]">
                Continue
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
