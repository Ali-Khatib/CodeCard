export type RecoveryHashSession = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Password-reset emails from the server recover call land as an implicit
 * fragment (`#access_token&refresh_token`). The PKCE browser client does not
 * turn that fragment into a session on its own.
 */
export function parseRecoveryHash(hash: string): RecoveryHashSession | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}
