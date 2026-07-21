import { describe, expect, it } from 'vitest';
import {
  SIGNUP_CONFIRMATION_TITLE,
  resolveSignUpOutcome,
  signupConfirmationBody,
} from '@/lib/auth/signup-result';
import { SESSION_EXPIRED_MESSAGE } from '@/lib/auth/session-expiry';

describe('resolveSignUpOutcome', () => {
  it('treats user + null session as email confirmation (not session expired)', () => {
    const outcome = resolveSignUpOutcome({
      data: { user: { id: 'u1', email: 'a@example.com' }, session: null },
      error: null,
      email: 'a@example.com',
    });
    expect(outcome).toEqual({
      kind: 'needs_email_confirmation',
      email: 'a@example.com',
    });
    expect(SIGNUP_CONFIRMATION_TITLE.toLowerCase()).not.toContain('expired');
    expect(signupConfirmationBody('a@example.com')).toContain('a@example.com');
    expect(signupConfirmationBody('a@example.com')).not.toContain(SESSION_EXPIRED_MESSAGE);
  });

  it('treats user + session as authenticated', () => {
    const outcome = resolveSignUpOutcome({
      data: {
        user: { id: 'u1' },
        session: { access_token: 'tok' },
      },
      error: null,
      email: 'a@example.com',
    });
    expect(outcome).toEqual({ kind: 'authenticated' });
  });

  it('maps real signup errors without claiming session expiry', () => {
    const outcome = resolveSignUpOutcome({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
      email: 'a@example.com',
    });
    expect(outcome.kind).toBe('error');
    if (outcome.kind === 'error') {
      expect(outcome.message).toMatch(/already exists/i);
      expect(outcome.message).not.toBe(SESSION_EXPIRED_MESSAGE);
    }
  });

  it('does not treat missing user as authenticated or confirmation', () => {
    const outcome = resolveSignUpOutcome({
      data: { user: null, session: null },
      error: null,
      email: 'a@example.com',
    });
    expect(outcome.kind).toBe('error');
  });
});
