import { describe, expect, it, vi } from 'vitest';
import { sendWaitlistConfirmationEmail } from './send-waitlist-confirmation';

describe('sendWaitlistConfirmationEmail', () => {
  it('skips sending when Resend is not configured', async () => {
    const fetchImpl = vi.fn();
    const sent = await sendWaitlistConfirmationEmail('you@codecard.dev', {}, fetchImpl);
    expect(sent).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts a confirmation message to Resend', async () => {
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
      to: string[];
      subject: string;
    };
    expect(body.to).toEqual(['you@codecard.dev']);
    expect(body.subject).toMatch(/waitlist/i);
  });
});
