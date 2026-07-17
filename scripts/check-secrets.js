#!/usr/bin/env node
/**
 * Scans repository for accidental secret commits.
 * Run in CI and locally before push.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.next', 'dist', '.git', '.turbo', 'coverage']);
const IGNORE_FILES = new Set(['check-secrets.js', 'index.test.ts']);

const PATTERNS = [
  { name: 'Stripe live secret', re: /sk_live_[a-zA-Z0-9]{16,}/ },
  { name: 'Stripe test secret', re: /sk_test_[a-zA-Z0-9]{16,}/ },
  { name: 'Supabase service role JWT', re: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/ },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private key block', re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Hardcoded password assignment', re: /password\s*=\s*['"][^'"]{8,}['"]/i },
  { name: 'Forbidden NEXT_PUBLIC secret', re: /NEXT_PUBLIC_(STRIPE|SECRET|SERVICE|WEBHOOK|UPSTASH)/ },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|jsx|json|env|md|sql|toml|yaml|yml)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const violations = [];

for (const file of walk(ROOT)) {
  if (IGNORE_FILES.has(path.basename(file))) continue;
  if (file.includes('.env') && !file.endsWith('.example')) continue;

  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  const relPosix = rel.replace(/\\/g, '/');
  const isTestFile = /\.(test|spec|contract\.test)\.(ts|tsx|js|jsx)$/.test(relPosix);

  for (const { name, re } of PATTERNS) {
    if (re.test(content)) {
      if (name === 'Supabase service role JWT' && rel.includes('.example')) continue;
      if (name === 'Hardcoded password assignment' && rel.includes('test')) continue;
      // False positive: env guard module documents forbidden NEXT_PUBLIC_ prefixes.
      if (name === 'Forbidden NEXT_PUBLIC secret' && relPosix.includes('lib/security/env')) continue;
      // False positive: security regression tests assert forbidden prefixes must not appear in app code.
      if (name === 'Forbidden NEXT_PUBLIC secret' && isTestFile) continue;
      violations.push({ file: rel, name });
    }
  }
}

try {
  const trackedEnv = execSync('git ls-files "*.env" "*.env.*"', { cwd: ROOT, encoding: 'utf8' }).trim();
  if (trackedEnv) {
    for (const f of trackedEnv.split('\n').filter(Boolean)) {
      if (!f.endsWith('.example')) violations.push({ file: f, name: 'Env file tracked in git' });
    }
  }
} catch {
  // git not available
}

if (violations.length) {
  console.error('SECRET SCAN FAILED:\n');
  for (const v of violations) console.error(`  [${v.name}] ${v.file}`);
  process.exit(1);
}

console.log('Secret scan passed.');
