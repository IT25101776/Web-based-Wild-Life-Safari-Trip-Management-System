import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(__filename);
const rootDir = path.resolve(scriptsDir, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');
const isWindows = process.platform === 'win32';

const API_URL = 'http://127.0.0.1:8080/api/health';
const LOCAL_URL = 'http://localhost:5173';

let backend = null;
let frontend = null;
let installer = null;
let stopping = false;
let backendWasStartedHere = false;

function lanAddress() {
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const item of entries || []) {
      if (item.family === 'IPv4' && !item.internal) return item.address;
    }
  }
  return null;
}

function prefixStream(stream, prefix, target = process.stdout) {
  let pending = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    pending += chunk.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    for (const line of lines) target.write(`${prefix} ${line}\n`);
  });
  stream.on('end', () => {
    if (pending.length) target.write(`${prefix} ${pending}\n`);
  });
}

function spawnTool(command, args, options = {}) {
  if (!isWindows) return spawn(command, args, options);
  const cmd = process.env.ComSpec || 'cmd.exe';
  const line = [command, ...args].map((part) => {
    const text = String(part);
    return /[\s&|<>^()]/.test(text) ? `\"${text.replace(/\"/g, '\"\"')}\"` : text;
  }).join(' ');
  return spawn(cmd, ['/d', '/s', '/c', line], { ...options, shell: false });
}

function checkUrl(url, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 500));
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

async function waitForApi(maxMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    if (await checkUrl(API_URL)) return true;
    if (backend && backend.exitCode !== null) return false;
    await new Promise((r) => setTimeout(r, 750));
  }
  return false;
}

function runInstallIfNeeded() {
  const viteBin = isWindows
    ? path.join(frontendDir, 'node_modules', '.bin', 'vite.cmd')
    : path.join(frontendDir, 'node_modules', '.bin', 'vite');

  if (fs.existsSync(viteBin)) return Promise.resolve();

  console.log('[web] [SAFARI] First run detected. Installing frontend packages...');
  return new Promise((resolve, reject) => {
    const child = spawnTool(isWindows ? 'npm.cmd' : 'npm', ['install'], {
      cwd: frontendDir,
      windowsHide: true,
      shell: false,
      env: process.env
    });
    installer = child;
    prefixStream(child.stdout, '[web]');
    prefixStream(child.stderr, '[web]', process.stderr);
    child.on('error', reject);
    child.on('exit', (code) => {
      installer = null;
      if (code === 0) resolve();
      else reject(new Error(`npm install exited with code ${code}`));
    });
  });
}

function startBackend() {
  const wrapper = isWindows ? 'mvnw.cmd' : './mvnw';
  const args = ['spring-boot:run', '-Dspring-boot.run.arguments=--server.address=0.0.0.0'];

  backend = spawnTool(wrapper, args, {
    cwd: backendDir,
    windowsHide: true,
    shell: false,
    env: process.env
  });
  backendWasStartedHere = true;
  prefixStream(backend.stdout, '[api]');
  prefixStream(backend.stderr, '[api]', process.stderr);
  backend.on('error', (error) => {
    console.error(`[api] [SAFARI] Could not start backend: ${error.message}`);
  });
}

function startFrontend() {
  frontend = spawnTool(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--open', '--strictPort'], {
    cwd: frontendDir,
    windowsHide: true,
    shell: false,
    env: process.env
  });
  prefixStream(frontend.stdout, '[web]');
  prefixStream(frontend.stderr, '[web]', process.stderr);
  frontend.on('error', (error) => {
    console.error(`[web] [SAFARI] Could not start frontend: ${error.message}`);
    shutdown(1);
  });
  frontend.on('exit', (code) => {
    if (!stopping) {
      console.log(`[web] [SAFARI] Frontend stopped${code == null ? '' : ` with code ${code}`}.`);
      shutdown(code || 0);
    }
  });
}

function killTree(child) {
  if (!child || child.pid == null || child.exitCode !== null) return;
  try {
    if (isWindows) {
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore'
      });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    // Process may already have exited.
  }
}

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  console.log('\n[SAFARI] Stopping development servers...');
  killTree(installer);
  killTree(frontend);
  if (backendWasStartedHere) killTree(backend);
  setTimeout(() => process.exit(exitCode), 450);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

const ip = lanAddress();
console.log('[SAFARI] Starting Safari Lanka...');
console.log(`[SAFARI] Frontend: ${LOCAL_URL}`);
console.log('[SAFARI] API:      http://localhost:8080/api/health');
if (ip) console.log(`[SAFARI] Network:  http://${ip}:5173`);
console.log('[SAFARI] Press Ctrl+C to stop both servers.');
console.log('');

if (!fs.existsSync(path.join(backendDir, isWindows ? 'mvnw.cmd' : 'mvnw'))) {
  console.error('[SAFARI] backend Maven wrapper was not found.');
  process.exit(1);
}
if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
  console.error('[SAFARI] frontend/package.json was not found.');
  process.exit(1);
}

const alreadyRunning = await checkUrl(API_URL);
if (alreadyRunning) {
  console.log('[api] [SAFARI] API is already running on port 8080; using the existing backend.');
} else {
  startBackend();
}

console.log(`[web] [SAFARI] Waiting for the API at ${API_URL}...`);

try {
  const [apiReady] = await Promise.all([
    waitForApi(),
    runInstallIfNeeded()
  ]);

  if (!apiReady) {
    console.error('[SAFARI] Backend did not become ready. Make sure MySQL is running and port 8080 is available.');
    shutdown(1);
  } else {
    console.log('[web] [SAFARI] API is ready. Starting Vite...');
    startFrontend();
  }
} catch (error) {
  console.error(`[SAFARI] Startup failed: ${error.message}`);
  shutdown(1);
}
