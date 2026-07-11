export type OAuthProvider = 'google' | 'github';

export function isAuthSubmissionBlocked(state: {
  emailPending: boolean;
  oauthPending: OAuthProvider | null;
}): boolean {
  return state.emailPending || state.oauthPending !== null;
}

export function oauthButtonLabel(provider: OAuthProvider, pending: OAuthProvider | null): string {
  if (pending !== provider) {
    return provider === 'github' ? 'Continue with GitHub' : 'Continue with Google';
  }
  return provider === 'github' ? 'Connecting to GitHub…' : 'Connecting to Google…';
}
