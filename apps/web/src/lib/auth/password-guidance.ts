import {
  PASSWORD_REQUIREMENT_LINES,
  PASSWORD_REQUIREMENTS_SUMMARY,
} from '@codecard/validation';

export type PasswordRequirementId = 'length' | 'upper' | 'lower' | 'number';

export type PasswordRequirement = {
  id: PasswordRequirementId;
  label: string;
  met: boolean;
};

export type PasswordStrengthLevel = 'empty' | 'weak' | 'medium' | 'strong' | 'very_strong';

export type PasswordStrength = {
  level: PasswordStrengthLevel;
  /** 0–4 filled segments in the meter. */
  score: number;
  label: string;
  metCount: number;
};

export { PASSWORD_REQUIREMENT_LINES, PASSWORD_REQUIREMENTS_SUMMARY };

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: 'length',
      label: PASSWORD_REQUIREMENT_LINES[0],
      met: password.length >= 8,
    },
    {
      id: 'upper',
      label: PASSWORD_REQUIREMENT_LINES[1],
      met: /[A-Z]/.test(password),
    },
    {
      id: 'lower',
      label: PASSWORD_REQUIREMENT_LINES[2],
      met: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: PASSWORD_REQUIREMENT_LINES[3],
      met: /[0-9]/.test(password),
    },
  ];
}

/**
 * Maps the four CodeCard password rules to a 4-segment strength meter.
 * Signup still only requires the four rules; length≥12 or a symbol unlocks “Very strong”.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { level: 'empty', score: 0, label: '', metCount: 0 };
  }

  const requirements = getPasswordRequirements(password);
  const metCount = requirements.filter((req) => req.met).length;
  const hasBonus = password.length >= 12 || /[^A-Za-z0-9]/.test(password);

  if (metCount <= 1) {
    return { level: 'weak', score: 1, label: 'Weak', metCount };
  }
  if (metCount === 2) {
    return { level: 'medium', score: 2, label: 'Medium', metCount };
  }
  if (metCount === 3) {
    return { level: 'strong', score: 3, label: 'Strong', metCount };
  }

  // All four required rules met
  if (hasBonus) {
    return { level: 'very_strong', score: 4, label: 'Very strong', metCount };
  }
  return { level: 'strong', score: 4, label: 'Strong', metCount };
}
