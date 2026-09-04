import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  GITHUB_OAUTH_SCOPES,
  canDisconnectGithub,
  findGithubIdentity,
  hasGithubIdentity,
} from './github-oauth';

describe('GitHub OAuth identity helpers', () => {
  it('requests only read:user and user:email', () => {
    expect(GITHUB_OAUTH_SCOPES).toBe('read:user user:email');
    expect(GITHUB_OAUTH_SCOPES).not.toMatch(/repo|admin:org|gist|write/);
  });

  it('pins those scopes on both OAuth start and identity linking', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/lib/auth/github-oauth.ts'), 'utf8');
    expect(src.match(/scopes: GITHUB_OAUTH_SCOPES/g)?.length).toBe(2);
    expect(src).not.toMatch(/scopes:.*repo/);
  });

  it('allows disconnect only when GitHub is not the last identity', () => {
    expect(canDisconnectGithub([{ provider: 'github' }])).toBe(false);
    expect(
      canDisconnectGithub([{ provider: 'github' }, { provider: 'email' }]),
    ).toBe(true);
    expect(canDisconnectGithub([{ provider: 'email' }])).toBe(false);
    expect(canDisconnectGithub([])).toBe(false);
  });

  it('finds the GitHub identity without exposing tokens', () => {
    const identities = [
      { provider: 'email', id: '1' },
      { provider: 'github', id: '2' },
    ];
    expect(hasGithubIdentity(identities)).toBe(true);
    expect(findGithubIdentity(identities)?.id).toBe('2');
  });
});
