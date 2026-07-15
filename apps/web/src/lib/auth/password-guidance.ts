export type PasswordRequirementId = 'length' | 'upper' | 'lower' | 'number';

export type PasswordRequirement = {
  id: PasswordRequirementId;
  label: string;
  met: boolean;
};

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { id: 'length', label: '8+ characters', met: password.length >= 8 },
    { id: 'upper', label: 'Uppercase', met: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Lowercase', met: /[a-z]/.test(password) },
    { id: 'number', label: 'Number', met: /[0-9]/.test(password) },
  ];
}
