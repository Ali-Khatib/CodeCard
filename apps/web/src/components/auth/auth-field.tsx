'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type AuthFieldProps = {
  id?: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  describedBy?: string;
  name?: string;
  pattern?: string;
  prefix?: React.ReactNode;
  onBlur?: () => void;
};

export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  required,
  disabled,
  error,
  describedBy,
  name,
  pattern,
  prefix,
  onBlur,
}: AuthFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [focused, setFocused] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const lastErrorRef = useRef<string | null>(null);
  const reduced = useReducedMotion();

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
        className={prefix ? 'flex items-center gap-2' : undefined}
      >
        {prefix ? <span className="shrink-0 text-[13px] text-smoke">{prefix}</span> : null}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          pattern={pattern}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [error ? errorId : null, describedBy].filter(Boolean).join(' ') || undefined
          }
          className={`cc-auth-input w-full ${error ? 'cc-auth-input--error' : ''} ${
            focused ? 'cc-auth-input--focused' : ''
          }`}
        />
      </motion.div>
      <div className="min-h-[18px]" aria-live="polite">
        {error ? (
          <p id={errorId} className="text-[12px] leading-snug text-[#b45353]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
