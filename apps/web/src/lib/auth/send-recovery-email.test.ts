import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn();

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({ sendMail }),
  },
}));

import { CODECARD_MAILBOX } from '@/lib/mail/codecard-mail';
import { sendPasswordResetEmail } from '@/lib/auth/send-recovery-email';

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: 'gmail-1', accepted: ['you@codecard.dev'] });
  });

  it('skips sending when no mail transport is configured', async () => {
    const fetchImpl = vi.fn();
    const sent = await sendPasswordResetEmail(
      'you@codecard.dev',
      'https://app.codecard.test/auth/callback?token_hash=h&type=recovery',
      {},
      fetchImpl,
    );
    expect(sent).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends from getcodecard@gmail.com when a Gmail app password is set', async () => {
    const fetchImpl = vi.fn();
    const sent = await sendPasswordResetEmail(
      'you@codecard.dev',
      'https://app.codecard.test/auth/callback?token_hash=h&type=recovery',
      { GMAIL_APP_PASSWORD: 'app-pass' },
      fetchImpl,
    );
    expect(sent).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: `CodeCard <${CODECARD_MAILBOX}>`,
        to: 'you@codecard.dev',
        replyTo: CODECARD_MAILBOX,
        subject: expect.stringMatching(/reset/i),
        text: expect.stringMatching(/reset/i),
      }),
    );
  });
});
