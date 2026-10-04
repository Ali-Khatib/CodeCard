'use client';

import { AUDIENCE_ROLE_LABELS, AUDIENCE_ROLES, type AudienceRole } from '@codecard/validation';

const HINT =
  'This is how CodeCard counts you when you open someone else’s card. It matters if you are a recruiter, engineer, founder, manager, or student.';

export function AudienceRoleField({
  value,
  onChange,
  error,
  disabled = false,
  variant = 'app',
}: {
  value: string;
  onChange: (role: AudienceRole) => void;
  error?: string | null;
  disabled?: boolean;
  variant?: 'auth' | 'app';
}) {
  const auth = variant === 'auth';
  const legendClass = auth
    ? error
      ? 'text-[13px] font-medium text-[#b45353]'
      : 'text-[13px] font-medium text-ink'
    : 'cc-app-field-label';
  const hintClass = auth
    ? 'text-[12px] leading-relaxed text-smoke'
    : 'text-[13px] leading-relaxed text-[var(--app-smoke)]';

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className={legendClass}>What are you?</legend>
      <p className={hintClass}>{HINT}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="What are you?">
        {AUDIENCE_ROLES.map((role) => {
          const selected = value === role;
          return (
            <label
              key={role}
              className={
                auth
                  ? `cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      selected
                        ? 'border-ink bg-ink text-white'
                        : 'border-[rgba(34,34,34,0.14)] text-ink hover:bg-[rgba(34,34,34,0.04)]'
                    }`
                  : `cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      selected
                        ? 'border-[var(--app-ink)] bg-[var(--app-ink)] text-[var(--app-paper)]'
                        : 'border-[var(--app-border)] text-[var(--app-ink)] hover:bg-[var(--app-bone)]'
                    }`
              }
            >
              <input
                type="radio"
                name="audience_role"
                value={role}
                checked={selected}
                onChange={() => onChange(role)}
                className="sr-only"
                required={auth}
              />
              {AUDIENCE_ROLE_LABELS[role]}
            </label>
          );
        })}
      </div>
      {error ? (
        <p className={auth ? 'text-[12px] text-[#b45353]' : 'text-sm text-red-600'} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
