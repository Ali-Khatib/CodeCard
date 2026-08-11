'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  getPasswordRequirements,
  getPasswordStrength,
  type PasswordStrengthLevel,
} from '@/lib/auth/password-guidance';

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

const STRENGTH_BAR_COLOR: Record<Exclude<PasswordStrengthLevel, 'empty'>, string> = {
  weak: 'bg-[#c45c5c]',
  medium: 'bg-[#d4a017]',
  strong: 'bg-[#3d8f6a]',
  very_strong: 'bg-[#2f6f4e]',
};

const STRENGTH_TEXT_COLOR: Record<Exclude<PasswordStrengthLevel, 'empty'>, string> = {
  weak: 'text-[#b45353]',
  medium: 'text-[#9a7b12]',
  strong: 'text-[#2f6f4e]',
  very_strong: 'text-[#2f6f4e]',
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
  const strengthId = `${inputId}-strength`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const lastErrorRef = useRef<string | null>(null);
  const reduced = useReducedMotion();
  const requirements = getPasswordRequirements(value);
  const strength = getPasswordStrength(value);

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
          error ? 'text-[#b45353]' : focused ? 'text-[rgba(120,70,170,0.95)]' : 'text-[#232324]'
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
              showGuidance ? guideId : null,
              showGuidance && strength.level !== 'empty' ? strengthId : null,
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
          className="absolute inset-y-0 right-1 my-1 rounded-[8px] px-2.5 text-[12px] font-medium text-[#5c5856] outline-none transition-colors hover:text-[#232324] focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.45)] disabled:opacity-50"
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
          <motion.div
            id={guideId}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-3 rounded-[12px] border border-[rgba(34,34,34,0.12)] bg-white/90 p-3"
          >
            <div className="space-y-1.5" aria-live="polite">
              <div
                className="grid grid-cols-4 gap-1.5"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={strength.score}
                aria-valuetext={strength.label || 'Empty'}
                aria-label="Password strength"
              >
                {Array.from({ length: 4 }, (_, index) => {
                  const filled = index < strength.score && strength.level !== 'empty';
                  return (
                    <span
                      key={index}
                      className={`h-1.5 rounded-full transition-colors duration-200 ${
                        filled
                          ? STRENGTH_BAR_COLOR[strength.level]
                          : 'bg-[rgba(34,34,34,0.1)]'
                      }`}
                    />
                  );
                })}
              </div>
              {strength.label ? (
                <p
                  id={strengthId}
                  className={`text-[12px] font-semibold ${STRENGTH_TEXT_COLOR[strength.level]}`}
                >
                  {strength.label}
                </p>
              ) : (
                <p className="text-[12px] font-medium text-[#7a7876]">Password strength</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-medium text-[#232324]">Password must include:</p>
              <ul className="space-y-1.5">
                {requirements.map((req) => (
                  <li
                    key={req.id}
                    className={`flex items-start gap-2 text-[13px] leading-snug ${
                      req.met ? 'text-[#2f6f4e]' : 'text-[#3f3c3a]'
                    }`}
                    aria-label={`${req.label}: ${req.met ? 'met' : 'not met'}`}
                  >
                    <span
                      aria-hidden
                      className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border text-[10px] font-semibold ${
                        req.met
                          ? 'border-[#2f6f4e] bg-[#e8f5ee] text-[#2f6f4e]'
                          : 'border-[rgba(34,34,34,0.28)] bg-white text-[#7a7876]'
                      }`}
                    >
                      {req.met ? '✓' : ''}
                    </span>
                    <span>{req.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  );
}
