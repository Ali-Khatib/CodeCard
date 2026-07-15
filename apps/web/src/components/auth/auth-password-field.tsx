'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { getPasswordRequirements } from '@/lib/auth/password-guidance';

type AuthPasswordFieldProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: 'current-password' | 'new-password';
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  showGuidance?: boolean;
  describedBy?: string;
};

export function AuthPasswordField({
  id,
  label = 'Password',
  value,
  onChange,
  autoComplete = 'current-password',
  required,
  disabled,
  error,
  showGuidance = false,
  describedBy,
}: AuthPasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const guideId = `${inputId}-guide`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const lastErrorRef = useRef<string | null>(null);
  const reduced = useReducedMotion();
  const requirements = getPasswordRequirements(value);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      lastErrorRef.current = error;
      setShakeKey((k) => k + 1);
      return;
    }
    if (!error) {
      lastErrorRef.current = null;
    }
  }, [error]);

  function toggleVisibility() {
    const input = inputRef.current;
    const start = input?.selectionStart ?? null;
    const end = input?.selectionEnd ?? null;
    setVisible((v) => !v);
    requestAnimationFrame(() => {
      if (!input || start === null || end === null) return;
      input.focus();
      input.setSelectionRange(start, end);
    });
  }

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className={`text-[13px] font-medium transition-colors duration-150 ${
          error ? 'text-[#b45353]' : focused ? 'text-[rgba(120,70,170,0.95)]' : 'text-ink'
        }`}
      >
        {label}
      </label>
      <motion.div
        key={shakeKey > 0 && error ? `shake-${shakeKey}` : 'steady'}
        initial={false}
        animate={error && !reduced && shakeKey > 0 ? { x: [0, -4, 3, -2, 0] } : { x: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="relative"
      >
        <input
          ref={inputRef}
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!touched) setTouched(true);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [
              error ? errorId : null,
              showGuidance && touched ? guideId : null,
              describedBy,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={`cc-auth-input w-full pr-14 ${error ? 'cc-auth-input--error' : ''} ${
            focused ? 'cc-auth-input--focused' : ''
          }`}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          className="absolute inset-y-0 right-1 my-1 rounded-[8px] px-2.5 text-[12px] font-medium text-smoke outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.45)] disabled:opacity-50"
          aria-pressed={visible}
          aria-label={visible ? 'Hide characters' : 'Show characters'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </motion.div>

      <div className="min-h-[18px]" aria-live="polite">
        {error ? (
          <p id={errorId} className="text-[12px] leading-snug text-[#b45353]">
            {error}
          </p>
        ) : null}
      </div>

      {showGuidance ? (
        <AnimatePresence initial={false}>
          {touched ? (
            <motion.ul
              id={guideId}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-smoke"
            >
              {requirements.map((req) => (
                <li
                  key={req.id}
                  className={req.met ? 'text-[#2f6f4e]' : undefined}
                  aria-label={`${req.label}: ${req.met ? 'met' : 'not met'}`}
                >
                  <span aria-hidden>{req.met ? '✓' : '·'}</span> {req.label}
                </li>
              ))}
            </motion.ul>
          ) : (
            <p className="text-[12px] text-smoke">
              Use 8+ characters with upper, lower, and a number.
            </p>
          )}
        </AnimatePresence>
      ) : null}
    </div>
  );
}
