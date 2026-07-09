// Update Vercel env vars for replyos project using REST API
// Usage: node scripts/update-vercel-env.js
const fs = require('fs');
const https = require('https');

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_NAME = 'replyos';
const TEAMSlug = 'mcvsupportes-devs-projects'; // from earlier API response
const ENV_FILE = '/home/z/my-project/.env.local';

if (!TOKEN) {
  console.error('VERCEL_TOKEN env var required');
  process.exit(1);
}

function fetchJson(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname: 'api.vercel.com',
      path: path + (path.includes('?') ? '&' : '?') + 'teamId=team_3wmsDN7eAiJa05KCAUlWrnQU',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(opts, (res) => {
      let chunks = '';
      res.on('data', (d) => (chunks += d));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, json: chunks }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Read .env.local
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
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  vars.push([key, value]);
}

console.log(`Found ${vars.length} env vars. Fetching existing...`);

// Get existing env vars to find their IDs
(async () => {
  const listRes = await fetchJson('GET', `/v9/projects/${PROJECT_NAME}/env`);
  const existing = listRes.json.envs || [];
  console.log(`Project has ${existing.length} env entries`);

  // Group by key
  const existingByKey = {};
  for (const e of existing) {
    if (!existingByKey[e.key]) existingByKey[e.key] = [];
    existingByKey[e.key].push(e);
  }

  for (const [key, value] of vars) {
    // Skip empty values (they'll be removed but not re-added)
    const targets = ['production', 'preview', 'development'];
    const prev = existingByKey[key] || [];

    // Delete existing entries for this key
    for (const e of prev) {
      const delRes = await fetchJson('DELETE', `/v9/projects/${PROJECT_NAME}/env/${e.id}`);
      if (delRes.status !== 204) {
        console.log(`  ! del ${key}/${e.target}: ${delRes.status}`);
      }
    }

    // Create new entries for each target
    for (const target of targets) {
      const body = {
        key,
        value,
        type: 'encrypted',
        target: [target],
      };
      const createRes = await fetchJson('POST', `/v9/projects/${PROJECT_NAME}/env`, body);
      if (createRes.status === 200 || createRes.status === 201) {
        console.log(`  + ${key} [${target}] OK`);
      } else {
        console.log(`  x ${key} [${target}] ${createRes.status}: ${typeof createRes.json === 'string' ? createRes.json.slice(0,200) : JSON.stringify(createRes.json).slice(0,200)}`);
      }
    }
  }
  console.log('Done updating env vars.');
})();
