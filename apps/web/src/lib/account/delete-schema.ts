import { z } from 'zod';

/** Exact case-sensitive confirmation — never normalize. */
export const ACCOUNT_DELETION_CONFIRMATION = 'DELETE' as const;

export const ACCOUNT_DELETION_REAUTH_WINDOW_SECONDS = 5 * 60;

const passwordReauthSchema = z
  .object({
    method: z.literal('password'),
    password: z.string().min(1).max(256),
  })
  .strict();

const recentLoginReauthSchema = z
  .object({
    method: z.literal('recent_login'),
  })
  .strict();

export const accountDeletionReauthenticationSchema = z.discriminatedUnion('method', [
  passwordReauthSchema,
  recentLoginReauthSchema,
]);

export const accountDeletionRequestSchema = z
  .object({
    confirmation: z.string().min(1).max(32),
    reauthentication: accountDeletionReauthenticationSchema,
  })
  .strict();

export type AccountDeletionRequest = z.infer<typeof accountDeletionRequestSchema>;
export type AccountDeletionReauthentication = z.infer<
  typeof accountDeletionReauthenticationSchema
>;

export const ACCOUNT_DELETION_ERROR_CODES = [
  'INVALID_CONFIRMATION',
  'UNAUTHENTICATED',
  'REAUTHENTICATION_REQUIRED',
  'RATE_LIMITED',
  'ACCOUNT_DELETION_NOT_READY',
  'ACCOUNT_DELETION_IN_PROGRESS',
  'SHARED_TENANT_BLOCKED',
  'ACCOUNT_DELETION_FAILED',
  'METHOD_NOT_ALLOWED',
  'FORBIDDEN_ORIGIN',
] as const;

export type AccountDeletionErrorCode = (typeof ACCOUNT_DELETION_ERROR_CODES)[number];
