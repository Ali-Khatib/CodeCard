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
