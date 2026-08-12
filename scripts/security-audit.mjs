/**
 * Blocking dependency audit (WS11-T009).
 *
 * Fails on high/critical npm audit findings except documented unfixable
 * advisories. Keep exceptions in sync with docs/CI_SECURITY_AUDITING.md.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** @typedef {{ id: string; package: string; reason: string; owner: string; expires: string }} AuditException */

/** Keep in sync with docs/CI_SECURITY_AUDITING.md §Justified exceptions. */
const EXCEPTIONS = /** @type {AuditException[]} */ ([
  {
    id: 'GHSA-w3rx-r6r6-pgpr',
    package: 'image-size',
    reason:
      'No fixed release yet (advisory range includes latest 2.0.2). Reachable only via Expo/Metro mobile tooling, not the web runtime.',
    owner: 'platform',
    expires: '2026-09-30',
  },
  {
    id: 'GHSA-5p2g-fcmc-qvqq',
    package: 'image-size',
    reason:
      'No fixed release yet (advisory range includes latest 2.0.2). Reachable only via Expo/Metro mobile tooling, not the web runtime.',
    owner: 'platform',
    expires: '2026-09-30',
  },
]);

const today = new Date().toISOString().slice(0, 10);
const expired = EXCEPTIONS.filter((entry) => entry.expires < today);
if (expired.length > 0) {
  console.error('Expired audit exceptions — renew or remove:');
  for (const entry of expired) {
    console.error(`  ${entry.id} (${entry.package}) expired ${entry.expires}`);
  }
  process.exit(1);
}

const allowedIds = new Set(EXCEPTIONS.map((entry) => entry.id));

function advisoryIdsFrom(entry) {
  const vias = Array.isArray(entry?.via) ? entry.via : [];
  return vias
    .map((via) => {
      if (typeof via === 'string') return null;
      const url = typeof via?.url === 'string' ? via.url : '';
      return url.match(/GHSA-[a-z0-9-]+/i)?.[0] ?? null;
    })
    .filter(Boolean);
}

function dependencyNamesFrom(entry) {
  const vias = Array.isArray(entry?.via) ? entry.via : [];
  return vias.filter((via) => typeof via === 'string');
}

function isCovered(name, vulnerabilities, seen = new Set()) {
  if (seen.has(name)) return true;
  seen.add(name);
  const entry = vulnerabilities[name];
  if (!entry) return false;
  if (entry.severity !== 'high' && entry.severity !== 'critical') return true;

  const ids = advisoryIdsFrom(entry);
  if (ids.length > 0) {
    return ids.every((id) => allowedIds.has(id));
  }

  const deps = dependencyNamesFrom(entry);
  if (deps.length === 0) return false;
  return deps.every((dep) => isCovered(dep, vulnerabilities, seen));
}

let report;
try {
  const stdout = execSync('npm audit --audit-level=high --package-lock-only --json', {
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (!stdout.trim()) {
    console.log('npm audit: no high/critical vulnerabilities.');
    process.exit(0);
  }
  report = JSON.parse(stdout);
} catch (error) {
  const stdout =
    error && typeof error === 'object' && 'stdout' in error ? String(error.stdout ?? '') : '';
  try {
    report = JSON.parse(stdout);
  } catch {
    console.error('npm audit failed and did not return JSON.');
    console.error(stdout || error);
    process.exit(1);
  }
}

const vulnerabilities = report?.vulnerabilities ?? {};
const hasHigh = Object.values(vulnerabilities).some(
  (entry) => entry?.severity === 'high' || entry?.severity === 'critical',
);
if (!hasHigh) {
  console.log('npm audit: no high/critical vulnerabilities.');
  process.exit(0);
}

const blockers = Object.entries(vulnerabilities).filter(([name, entry]) => {
  if (entry?.severity !== 'high' && entry?.severity !== 'critical') return false;
  return !isCovered(name, vulnerabilities);
});

readFileSync(resolve(process.cwd(), 'docs/CI_SECURITY_AUDITING.md'), 'utf8');

if (blockers.length === 0) {
  console.log(
    `npm audit: remaining high/critical findings are justified exceptions (${[...allowedIds].join(', ')}).`,
  );
  process.exit(0);
}

console.error('Blocking high/critical vulnerabilities:');
for (const [name, entry] of blockers) {
  console.error(
    `  [${entry.severity}] ${name} ids=${advisoryIdsFrom(entry).join(',') || 'n/a'} via=${dependencyNamesFrom(entry).join(',') || 'n/a'}`,
  );
}
process.exit(1);
