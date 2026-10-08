#!/usr/bin/env node
'use strict';
/**
 * icecode.dev host launcher — pulls CI-built releases from GitHub and serves them.
 *
 *   push to main ─► GitHub Actions builds .next/standalone ─► Release `site-<n>-<sha>`
 *                   (site.tar.gz + manifest.json, see .github/workflows/release.yml)
 *   this launcher polls releases/latest/download/manifest.json every DEPLOY_POLL_SECONDS
 *   ─► download + sha256 check + unpack ─► start the new server on a spare loopback port
 *   ─► health check ─► flip the proxy to it ─► stop the old one.
 *
 * A release that fails its health check is never put in front of visitors; the one
 * already serving keeps serving. No npm dependencies on purpose: this file has to keep
 * working no matter what the site's package.json says.
 *
 * Console commands (Pterodactyl console / stdin):
 *   status    what is serving, what was before, whether updates are paused
 *   update    check GitHub now (also retries a release that failed before)
 *   rollback  go back to the previous release and PAUSE auto-updates
 *   resume    un-pause auto-updates and check now
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const ROOT = process.env.DEPLOY_ROOT || __dirname;
const REPO = process.env.DEPLOY_REPO || 'icetrahan/icecode-portfolio';
// Testing override: a local folder (or URL) holding manifest.json + the tarball.
const BASE_URL = process.env.DEPLOY_BASE_URL || '';
const POLL_MS = Math.max(30, Number(process.env.DEPLOY_POLL_SECONDS || 120)) * 1000;
const PUBLIC_PORT = Number(process.env.SERVER_PORT || process.env.PORT || 25017);
const INTERNAL_PORTS = [Number(process.env.DEPLOY_PORT_A || 3101), Number(process.env.DEPLOY_PORT_B || 3102)];
const KEEP_RELEASES = 3;
const HEALTH_TIMEOUT_MS = 90_000;
const DRAIN_MS = 10_000;
// Heavy assets that are gitignored (so never in a release) but served under /public.
// Looked up in <root>/assets/<name> first, then the legacy <root>/public/<name>.
const ASSET_DIRS = ['SkinViewer', 'PortMusic'];

const RELEASES = path.join(ROOT, 'releases');
const STATE_FILE = path.join(ROOT, 'deploy-state.json');
const LOG_FILE = path.join(ROOT, 'logs', 'deploy.log');

fs.mkdirSync(RELEASES, { recursive: true });
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch { /* logging must never kill the site */ }
}

// ---------------------------------------------------------------- state

function readState() {
  try { return { failed: [], ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) }; }
  catch { return { active: null, previous: null, paused: false, failed: [] }; }
}
function saveState() {
  fs.writeFileSync(STATE_FILE + '.tmp', JSON.stringify(state, null, 2));
  fs.renameSync(STATE_FILE + '.tmp', STATE_FILE);
}
const state = readState();
let current = null;          // { tag, sha, port, child, dir }
let busy = false;
let lastError = '';
let lastCheck = null;

// ---------------------------------------------------------------- fetching releases

const manifestUrl = () => BASE_URL
  ? joinUrl(BASE_URL, 'manifest.json')
  : `https://github.com/${REPO}/releases/latest/download/manifest.json`;
const tarballUrl = (m) => BASE_URL
  ? joinUrl(BASE_URL, m.asset)
  : `https://github.com/${REPO}/releases/download/${encodeURIComponent(m.tag)}/${encodeURIComponent(m.asset)}`;
const joinUrl = (base, name) => /^https?:/.test(base) ? base.replace(/\/?$/, '/') + name : path.join(base, name);

async function getBytes(url) {
  if (!/^https?:/.test(url)) return fs.readFileSync(url);
  const res = await fetch(url, {
    headers: { 'user-agent': 'icecode-launcher', 'cache-control': 'no-cache' },
    redirect: 'follow',
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

const releaseDir = (tag) => path.join(RELEASES, tag.replace(/[^\w.-]/g, '_'));
const isInstalled = (tag) => fs.existsSync(path.join(releaseDir(tag), 'server.js'));

// A release that can never work (bad checksum, wrong shape) is remembered as failed so it
// isn't re-downloaded every poll; `update` retries it by hand.
const broken = (msg) => Object.assign(new Error(msg), { broken: true });

async function install(m) {
  const dir = releaseDir(m.tag);
  if (isInstalled(m.tag)) return dir;
  log(`downloading ${m.tag} (${String(m.sha).slice(0, 7)}, ${Math.round((m.size || 0) / 1e6)} MB)…`);
  const buf = await getBytes(tarballUrl(m));
  const got = crypto.createHash('sha256').update(buf).digest('hex');
  if (got !== m.sha256) throw broken(`sha256 mismatch for ${m.tag} (manifest ${m.sha256.slice(0, 12)}, got ${got.slice(0, 12)})`);

  const tmp = dir + '.partial';
  const tarball = dir + '.tar.gz';
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(tarball, buf);
  // Relative path + cwd: keeps GNU tar from reading "C:\…" as a remote host when tested on Windows.
  const r = spawnSync('tar', ['-xzf', path.relative(tmp, tarball)], { cwd: tmp, encoding: 'utf8' });
  fs.rmSync(tarball, { force: true });
  if (r.status !== 0) throw new Error(`tar failed (${r.status}): ${(r.stderr || r.error || '').toString().trim()}`);
  if (!fs.existsSync(path.join(tmp, 'server.js'))) throw broken(`${m.tag} has no server.js — not a standalone build`);
  overlayAssets(tmp);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.renameSync(tmp, dir);
  return dir;
}

function overlayAssets(dir) {
  const pub = path.join(dir, 'public');
  fs.mkdirSync(pub, { recursive: true });
  for (const name of ASSET_DIRS) {
    const dst = path.join(pub, name);
    if (fs.existsSync(dst)) continue; // the release ships its own copy
    const src = [path.join(ROOT, 'assets', name), path.join(ROOT, 'public', name)].find((p) => fs.existsSync(p));
    if (!src) { log(`⚠ asset folder ${name} not found on the host — /${name}/ will 404`); continue; }
    const copied = linkTree(src, dst);
    if (copied) log(`⚠ ${copied} asset file(s) under ${name} were copied, not hard-linked`);
  }
}

// Hard links: no extra disk per release, and Next sees ordinary files.
function linkTree(src, dst) {
  let copied = 0;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copied += linkTree(s, d);
    else {
      try { fs.linkSync(s, d); } catch { fs.copyFileSync(s, d); copied++; }
    }
  }
  return copied;
}

function prune() {
  const keep = new Set([state.active?.tag, state.previous?.tag].filter(Boolean).map((t) => path.basename(releaseDir(t))));
  const dirs = fs.readdirSync(RELEASES, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.endsWith('.partial'))
    .map((e) => ({ name: e.name, mtime: fs.statSync(path.join(RELEASES, e.name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const d of dirs.slice(KEEP_RELEASES)) {
    if (keep.has(d.name)) continue;
    fs.rmSync(path.join(RELEASES, d.name), { recursive: true, force: true });
    log(`pruned old release ${d.name}`);
  }
}

// ---------------------------------------------------------------- running releases

const byPort = new Map();    // port -> child

function startServer(tag, dir, port) {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: dir,
    // HOSTNAME must be overridden: Docker sets it to the container id and Next binds to it.
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), HOSTNAME: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const tagShort = tag.replace(/^site-/, '');
  const pipe = (stream, write) => stream.on('data', (d) => {
    for (const line of d.toString().split('\n')) if (line.trim()) write(`[${tagShort}] ${line}`);
  });
  pipe(child.stdout, (l) => console.log(l));
  pipe(child.stderr, (l) => console.error(l));
  byPort.set(port, child);
  child.on('exit', (code, signal) => {
    if (byPort.get(port) === child) byPort.delete(port);
    if (child.stopping) return;
    log(`${tag} server exited unexpectedly (code ${code}, signal ${signal})`);
    if (current && current.child === child) scheduleRestart();
  });
  return child;
}

function stopChild(child, graceMs = 8000) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null || child.signalCode !== null) return resolve();
    child.stopping = true;
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, graceMs);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
    try { child.kill('SIGTERM'); } catch { resolve(); }
  });
}

async function waitHealthy(port, child) {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) return false;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(10_000), redirect: 'manual' });
      if (res.status < 500) return true;
    } catch { /* not listening yet */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/** Start `tag` beside whatever is serving, and only switch to it once it answers. */
async function activate(tag, sha, dir, { recordFailure = true } = {}) {
  const port = current?.port === INTERNAL_PORTS[0] ? INTERNAL_PORTS[1] : INTERNAL_PORTS[0];
  if (byPort.has(port)) await stopChild(byPort.get(port));
  log(`starting ${tag} on 127.0.0.1:${port}…`);
  const child = startServer(tag, dir, port);
  if (!(await waitHealthy(port, child))) {
    await stopChild(child);
    log(`✗ ${tag} failed its health check — ${current ? `still serving ${current.tag}` : 'nothing is serving yet'}`);
    if (recordFailure && !state.failed.includes(tag)) { state.failed.push(tag); saveState(); }
    return false;
  }
  const old = current;
  current = { tag, sha, port, child, dir };
  if (state.active?.tag !== tag) {
    if (state.active) state.previous = state.active;
    state.active = { tag, sha, activatedAt: new Date().toISOString() };
  }
  state.failed = state.failed.filter((t) => t !== tag);
  saveState();
  log(`✓ now serving ${tag} (${String(sha).slice(0, 7)})`);
  if (old && old.child !== child) setTimeout(() => stopChild(old.child), DRAIN_MS);
  try { prune(); } catch (e) { log(`prune failed: ${e.message}`); }
  return true;
}

let restartDelay = 2000;
function scheduleRestart() {
  const c = current;
  setTimeout(async () => {
    if (current !== c) return; // a deploy replaced it meanwhile
    log(`restarting ${c.tag}…`);
    const child = startServer(c.tag, c.dir, c.port);
    current = { ...c, child };
    if (await waitHealthy(c.port, child)) { restartDelay = 2000; log(`✓ ${c.tag} back up`); }
    else restartDelay = Math.min(restartDelay * 2, 60_000);
  }, restartDelay);
}

// ---------------------------------------------------------------- the update loop

async function checkForUpdate(reason) {
  if (busy) return;
  busy = true;
  let pending = null;
  try {
    lastCheck = new Date().toISOString();
    const m = JSON.parse((await getBytes(manifestUrl())).toString('utf8'));
    if (!m.tag || !m.asset || !m.sha256) throw new Error('manifest.json is missing tag/asset/sha256');
    lastError = '';
    if (current?.tag === m.tag) return;
    const manual = reason === 'manual';
    if (state.paused && !manual && current) return;
    if (state.failed.includes(m.tag) && !manual) return;
    pending = m.tag;
    log(`new release ${m.tag} (${reason})`);
    const dir = await install(m);
    await activate(m.tag, m.sha, dir);
  } catch (e) {
    if (e.broken && pending && !state.failed.includes(pending)) { state.failed.push(pending); saveState(); }
    // Same error every poll (GitHub down, no release yet) is logged once, not every 2 minutes.
    if (e.message !== lastError) log(`update check failed: ${e.message}`);
    lastError = e.message;
  } finally {
    busy = false;
  }
}

async function rollback() {
  const prev = state.previous;
  if (!prev || !isInstalled(prev.tag)) return log('rollback: no previous release on disk');
  if (busy) return log('rollback: a deploy is in progress, try again in a moment');
  busy = true;
  try {
    state.paused = true;
    saveState();
    if (await activate(prev.tag, prev.sha, releaseDir(prev.tag), { recordFailure: false })) {
      log(`rolled back to ${prev.tag}; auto-update PAUSED (type "resume" to re-enable)`);
    }
  } finally {
    busy = false;
  }
}

// ---------------------------------------------------------------- the public front door

const HOP_BY_HOP = ['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'te', 'trailer', 'upgrade'];
const agent = new http.Agent({ keepAlive: true, maxSockets: 256 });

const front = http.createServer((req, res) => {
  if (req.url === '/__release') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({
      serving: current?.tag ?? null, sha: current?.sha ?? null,
      previous: state.previous?.tag ?? null, paused: !!state.paused, lastCheck,
    }));
  }
  const t = current;
  if (!t) {
    res.writeHead(503, { 'content-type': 'text/plain', 'retry-after': '15' });
    return res.end('icecode.dev is starting up — try again in a moment.');
  }
  const headers = { ...req.headers };
  for (const h of HOP_BY_HOP) delete headers[h];
  const up = http.request({ host: '127.0.0.1', port: t.port, method: req.method, path: req.url, headers, agent }, (ur) => {
    const out = { ...ur.headers, 'x-icecode-release': t.tag };
    for (const h of HOP_BY_HOP) if (h !== 'transfer-encoding') delete out[h];
    res.writeHead(ur.statusCode, ur.statusMessage, out);
    ur.pipe(res);
  });
  up.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('Bad gateway');
  });
  req.pipe(up);
});

// ---------------------------------------------------------------- boot + console

async function main() {
  log(`launcher up — repo ${BASE_URL || REPO}, polling every ${POLL_MS / 1000}s`);
  await new Promise((r) => front.listen(PUBLIC_PORT, '0.0.0.0', r));
  log(`front door listening on :${PUBLIC_PORT}`);

  if (state.active && isInstalled(state.active.tag)) {
    await activate(state.active.tag, state.active.sha, releaseDir(state.active.tag), { recordFailure: false });
  }
  await checkForUpdate('boot');
  if (!current) log('⚠ nothing is serving yet — will keep checking');
  console.log('Server Ready'); // Pterodactyl egg 19's start marker
  setInterval(() => checkForUpdate('poll'), POLL_MS).unref();
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  for (const cmd of data.split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter(Boolean)) {
    if (cmd === 'status') {
      log(`serving ${current?.tag ?? 'nothing'} · previous ${state.previous?.tag ?? 'none'} · ` +
        `auto-update ${state.paused ? 'PAUSED' : 'on'} · failed [${state.failed.join(', ')}] · last check ${lastCheck ?? 'never'}`);
    } else if (cmd === 'update') checkForUpdate('manual');
    else if (cmd === 'rollback') rollback();
    else if (cmd === 'resume') { state.paused = false; saveState(); log('auto-update resumed'); checkForUpdate('manual'); }
    else log(`unknown command "${cmd}" — try: status, update, rollback, resume`);
  }
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log(`${signal} — stopping`);
  front.close();
  await Promise.all([...byPort.values()].map((c) => stopChild(c, 5000)));
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main().catch((e) => { log(`fatal: ${e.stack || e.message}`); process.exit(1); });
