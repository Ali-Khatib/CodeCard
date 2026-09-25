import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn();

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({ sendMail }),
  },
}));

import {
  WAITLIST_CONTACT_EMAIL,
  buildWaitlistConfirmation,
  sendWaitlistConfirmationEmail,
} from './send-waitlist-confirmation';

describe('sendWaitlistConfirmationEmail', () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: 'gmail-1', accepted: ['you@codecard.dev'] });
  });

  it('skips sending when no mail transport is configured', async () => {
    const fetchImpl = vi.fn();
    const sent = await sendWaitlistConfirmationEmail('you@codecard.dev', {}, fetchImpl);
    expect(sent).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends from getcodecard@gmail.com when a Gmail app password is set', async () => {
    const fetchImpl = vi.fn();
    const sent = await sendWaitlistConfirmationEmail(
      'you@codecard.dev',
      {
        GMAIL_APP_PASSWORD: 'app-pass',
        NEXT_PUBLIC_APP_URL: 'https://codecard.app',
      },
      fetchImpl,
    );
    expect(sent).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: `CodeCard <${WAITLIST_CONTACT_EMAIL}>`,
        to: 'you@codecard.dev',
        replyTo: WAITLIST_CONTACT_EMAIL,
        subject: expect.stringMatching(/waitlist/i),
        text: expect.stringMatching(/news/i),
      }),
    );
  });

  it('posts a confirmation message to Resend from the CodeCard inbox', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    const sent = await sendWaitlistConfirmationEmail(
      'you@codecard.dev',
      {
        RESEND_API_KEY: 're_test',
        NEXT_PUBLIC_APP_URL: 'https://codecard.app',
      },
      fetchImpl,
    );
    expect(sent).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body as string) as {
      from: string;
      to: string[];
      reply_to: string;
      subject: string;
      text: string;
    };
    expect(body.from).toContain(WAITLIST_CONTACT_EMAIL);
    expect(body.to).toEqual(['you@codecard.dev']);
    expect(body.reply_to).toBe(WAITLIST_CONTACT_EMAIL);
    expect(body.subject).toMatch(/waitlist/i);
    expect(body.text).toMatch(/news/i);
  });

  it('writes a yay-you-are-in confirmation', () => {
    const copy = buildWaitlistConfirmation('https://codecard.app');
    expect(copy.subject).toMatch(/yay/i);
    expect(copy.text).toMatch(/waitlist/i);
    expect(copy.text).toMatch(/news/i);
    expect(copy.text).toContain(WAITLIST_CONTACT_EMAIL);
  });
});
