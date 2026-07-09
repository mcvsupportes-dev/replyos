// Set Vercel env vars from .env.local for the replyos project
// Usage: node scripts/set-vercel-env.js
const fs = require('fs');
const { execSync } = require('child_process');

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT = 'replyos';
const ENV_FILE = '/home/z/my-project/.env.local';

if (!TOKEN) {
  console.error('VERCEL_TOKEN env var required');
  process.exit(1);
}

if (!fs.existsSync(ENV_FILE)) {
  console.error('Missing', ENV_FILE);
  process.exit(1);
}

const raw = fs.readFileSync(ENV_FILE, 'utf8');
const lines = raw.split('\n');
const vars = [];
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  // strip surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  vars.push([key, value]);
}

console.log(`Found ${vars.length} env vars to set on project "${PROJECT}"`);

function run(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
  } catch (e) {
    return '';
  }
}

for (const [key, value] of vars) {
  for (const env of ['production', 'preview', 'development']) {
    run(`vercel env rm "${key}" "${env}" --yes --token "${TOKEN}" --cwd /home/z/my-project 2>/dev/null`);
    // Add via stdin
    try {
      execSync(`vercel env add "${key}" "${env}" --token "${TOKEN}" --cwd /home/z/my-project`, {
        input: value,
        stdio: ['pipe', 'ignore', 'ignore'],
        encoding: 'utf8',
      });
      console.log(`  ✓ ${key} [${env}]`);
    } catch (e) {
      console.log(`  ✗ ${key} [${env}] — ${String(e.message).split('\n')[0]}`);
    }
  }
}

console.log('Done.');
