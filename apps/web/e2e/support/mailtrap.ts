import path from 'node:path';
import { loadE2EEnvFile } from '../../src/lib/e2e/load-e2e-env';

/**
 * Mailtrap Email Sandbox capture helper (WS14-T002).
 *
 * The isolated codecard-e2e Supabase project sends auth emails through Mailtrap
 * Sandbox SMTP; this module reads the captured messages through the Mailtrap
 * API so the real password-reset E2E can extract the genuine recovery link.
 *
 * Safety rules:
 * - credentials come only from the git-ignored `.env.e2e.local`;
 * - the token is never logged and recovery links are never printed;
 * - deletion is bounded to individual messages addressed to run-scoped
 *   disposable recipients — never inbox-wide cleanup of anything else.
 */

export type MailtrapConfig = {
  apiToken: string;
  accountId: string;
  inboxId: string;
};

type MailtrapMessage = {
  id: number;
  to_email: string;
  subject: string;
};

export function loadMailtrapConfig(): MailtrapConfig | null {
  const values = loadE2EEnvFile(path.resolve(__dirname, '..', '..', '.env.e2e.local'));
  const apiToken = values.CODECARD_E2E_MAILTRAP_API_TOKEN?.trim();
  const accountId = values.CODECARD_E2E_MAILTRAP_ACCOUNT_ID?.trim();
  const inboxId = values.CODECARD_E2E_MAILTRAP_INBOX_ID?.trim();
  if (!apiToken || !accountId || !inboxId) return null;
  return { apiToken, accountId, inboxId };
}

function inboxUrl(config: MailtrapConfig): string {
  return `https://mailtrap.io/api/accounts/${config.accountId}/inboxes/${config.inboxId}`;
}

async function mailtrapFetch(config: MailtrapConfig, url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { ...(init?.headers ?? {}), 'Api-Token': config.apiToken },
  });
  if (!response.ok) {
    // Status only — never the URL query or body, which could carry tokens.
    throw new Error(`Mailtrap API request failed with status ${response.status}`);
  }
  return response;
}

/** Poll the sandbox inbox for a message addressed to the given recipient. */
export async function waitForMessageTo(
  config: MailtrapConfig,
  recipient: string,
  options: { subjectPattern?: RegExp; timeoutMs?: number } = {},
): Promise<MailtrapMessage> {
  const timeoutMs = options.timeoutMs ?? 60_000;
  const deadline = Date.now() + timeoutMs;
  const wanted = recipient.toLowerCase();
  while (Date.now() < deadline) {
    const response = await mailtrapFetch(config, `${inboxUrl(config)}/messages`);
    const messages = (await response.json()) as MailtrapMessage[];
    const match = (Array.isArray(messages) ? messages : []).find(
      (m) =>
        m.to_email?.toLowerCase() === wanted &&
        (!options.subjectPattern || options.subjectPattern.test(m.subject ?? '')),
    );
    if (match) return match;
    await new Promise((r) => setTimeout(r, 3_000));
  }
  throw new Error(`No Mailtrap message for the expected disposable recipient within ${timeoutMs}ms`);
}

/**
 * Extract the first hyperlink from a captured message body. Used for the
 * Supabase recovery link. The caller must never log the returned URL.
 */
export async function extractFirstLink(
  config: MailtrapConfig,
  messageId: number,
): Promise<string> {
  const response = await mailtrapFetch(config, `${inboxUrl(config)}/messages/${messageId}/body.html`);
  const html = await response.text();
  const match = html.match(/href=["']([^"']+)["']/);
  if (!match) {
    throw new Error('Captured message contains no hyperlink');
  }
  return match[1].replace(/&amp;/g, '&');
}

/** Delete one captured message (bounded per-message cleanup). */
export async function deleteMessage(config: MailtrapConfig, messageId: number): Promise<void> {
  await mailtrapFetch(config, `${inboxUrl(config)}/messages/${messageId}`, { method: 'DELETE' });
}

/**
 * Delete every captured message addressed to a disposable recipient carrying
 * the current run ID. Messages for anything else are never touched.
 */
export async function cleanupRunMessages(config: MailtrapConfig, runId: string): Promise<number> {
  const response = await mailtrapFetch(config, `${inboxUrl(config)}/messages`);
  const messages = (await response.json()) as MailtrapMessage[];
  let deleted = 0;
  for (const message of Array.isArray(messages) ? messages : []) {
    const to = message.to_email?.toLowerCase() ?? '';
    if (to.startsWith('codecard-e2e+') && to.includes(runId.toLowerCase())) {
      await deleteMessage(config, message.id);
      deleted += 1;
    }
  }
  return deleted;
}
