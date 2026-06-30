#!/usr/bin/env node
/**
 * CodeCard one-command starter
 * Usage:
 *   npm start           → install, setup env, migrate (if linked), run web
 *   npm start -- --mobile  → also start Expo
 *   npm start -- --skip-install
 */

import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const skipInstall = args.includes('--skip-install');
const withMobile = args.includes('--mobile') || args.includes('--all');
const skipMigrate = args.includes('--skip-migrate');

const WEB_ENV = path.join(ROOT, 'apps/web/.env.local');
const WEB_ENV_EXAMPLE = path.join(ROOT, 'apps/web/.env.example');
const MOBILE_ENV = path.join(ROOT, 'apps/mobile/.env');
const MOBILE_ENV_EXAMPLE = path.join(ROOT, 'apps/mobile/.env.example');

function log(msg) {
  console.log(`\n▸ ${msg}`);
}

function warn(msg) {
  console.warn(`\n⚠ ${msg}`);
}

function run(cmd, cmdArgs, opts = {}) {
  const cwd = opts.cwd ?? ROOT;
  const result =
    process.platform === 'win32'
      ? spawnSync('cmd.exe', ['/d', '/s', '/c', cmd, ...cmdArgs], {
          cwd,
          stdio: 'inherit',
          shell: false,
        })
      : spawnSync(cmd, cmdArgs, {
          cwd,
          stdio: 'inherit',
          shell: false,
        });

  if (result.error) {
    console.error(`\n✗ Failed to run ${cmd}: ${result.error.message}`);
    return false;
  }
  return result.status === 0;
}

function copyIfMissing(src, dest, label) {
  if (fs.existsSync(dest)) {
    log(`${label} already exists — skipping copy`);
    return;
  }
  if (!fs.existsSync(src)) {
    warn(`${label} template not found at ${src}`);
    return;
  }
  fs.copyFileSync(src, dest);
  log(`Created ${path.relative(ROOT, dest)} from template`);
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function hasSupabaseConfigured() {
  const env = readEnvFile(WEB_ENV);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('YOUR_PROJECT') && url !== '');
}

function tryMigrate() {
  if (skipMigrate) {
    log('Skipping database migrations (--skip-migrate)');
    return;
  }

  if (!hasSupabaseConfigured()) {
    warn(
      'Supabase not configured in apps/web/.env.local — skipping migrations.\n' +
        '  Demo mode works at http://localhost:3000/demo\n' +
        '  For auth/dashboard: add Supabase keys, then run: npm run db:migrate',
    );
    return;
  }

  const linked = fs.existsSync(path.join(ROOT, 'supabase/.temp/project-ref'));
  if (!linked && !fs.existsSync(path.join(ROOT, '.supabase'))) {
    warn(
      'Supabase project not linked — skipping migrations.\n' +
        '  Run once: npx supabase login && npx supabase link --project-ref YOUR_REF\n' +
        '  Then: npm run db:migrate',
    );
    return;
  }

  log('Applying database migrations…');
  const ok = run('npx', ['supabase', 'db', 'push']);
  if (!ok) {
    warn('Migration failed — web app will still start. Fix Supabase link and retry: npm run db:migrate');
  } else {
    log('Database migrations applied');
  }
}

function ensurePlaceholderEnv() {
  const env = readEnvFile(WEB_ENV);
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    warn(
      'No Supabase URL in .env.local — using placeholders for demo browsing only.\n' +
        '  Sign-up/dashboard will NOT work until you add real Supabase keys.',
    );
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  }
  process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function spawnDev(name, cmd, cmdArgs, cwd) {
  const child =
    process.platform === 'win32'
      ? spawn('cmd.exe', ['/d', '/s', '/c', cmd, ...cmdArgs], {
          cwd,
          stdio: 'inherit',
          shell: false,
          env: { ...process.env },
        })
      : spawn(cmd, cmdArgs, {
          cwd,
          stdio: 'inherit',
          shell: false,
          env: { ...process.env },
        });
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) console.error(`\n✗ ${name} exited with code ${code}`);
  });
  return child;
}

async function main() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║         CodeCard — starting…         ║');
  console.log('╚══════════════════════════════════════╝');

  const nodeMajor = Number(process.version.slice(1).split('.')[0]);
  if (nodeMajor < 20) {
    console.error('\n✗ Node.js 20+ required. Current: ' + process.version);
    process.exit(1);
  }

  if (!skipInstall) {
    log('Installing dependencies…');
    if (!run('npm', ['install'])) {
      console.error('\n✗ npm install failed');
      process.exit(1);
    }
  }

  copyIfMissing(WEB_ENV_EXAMPLE, WEB_ENV, 'Web env');
  copyIfMissing(MOBILE_ENV_EXAMPLE, MOBILE_ENV, 'Mobile env');

  tryMigrate();
  ensurePlaceholderEnv();

  log('Starting web → http://localhost:3000');
  log('  /demo     static demo profile');
  log('  /sign-up  create account (needs Supabase)');

  const children = [];
  children.push(
    spawnDev('web', 'npm', ['run', 'dev'], path.join(ROOT, 'apps/web')),
  );

  if (withMobile) {
    log('Starting mobile (Expo)…');
    children.push(
      spawnDev('mobile', 'npm', ['run', 'start'], path.join(ROOT, 'apps/mobile')),
    );
  }

  const shutdown = () => {
    for (const c of children) c.kill('SIGTERM');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
