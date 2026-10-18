import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(__filename);
const rootDir = path.resolve(scriptsDir, '..');
const isWindows = process.platform === 'win32';

let app = null;
let tunnel = null;
let stopping = false;

function commandExists(command) {
  const result = spawnSync(command, ['version'], {
    cwd: rootDir,
    stdio: 'ignore',
    shell: isWindows
  });
  return result.status === 0;
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

async function waitForFrontend(maxMs = 180000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    if (await checkUrl('http://127.0.0.1:5173')) return true;
    if (app && app.exitCode !== null) return false;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
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
    // Process may already be stopped.
  }
}

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  console.log('\n[NGROK] Stopping Safari Lanka and ngrok...');
  killTree(tunnel);
  killTree(app);
  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

if (!commandExists('ngrok')) {
  console.error('[NGROK] ngrok was not found in PATH.');
  console.error('[NGROK] Install it first, then run: ngrok config add-authtoken YOUR_TOKEN');
  console.error('[NGROK] After that, run this command again: npm run host:ngrok');
  process.exit(1);
}

console.log('============================================================');
console.log(' SAFARI LANKA - NGROK HOSTING MODE');
console.log('============================================================');
console.log('[1/2] Starting Spring Boot + Vite + MySQL connection...');
console.log('[INFO] Keep MySQL Server running while the public website is online.');
console.log('[INFO] MySQL port 3306 is NOT exposed to the internet.');
console.log('');

app = spawn(process.execPath, [path.join(scriptsDir, 'run-dev.mjs')], {
  cwd: rootDir,
  stdio: 'inherit',
  windowsHide: false
});

app.on('exit', (code) => {
  if (!stopping && tunnel) shutdown(code || 0);
});

const ready = await waitForFrontend();
if (!ready) {
  console.error('[NGROK] Safari Lanka did not become ready on port 5173.');
  console.error('[NGROK] Check the app terminal for MySQL, Java or port errors.');
  shutdown(1);
} else {
  console.log('');
  console.log('[2/2] App is ready. Starting ONE ngrok tunnel on port 5173...');
  console.log('[INFO] Copy the HTTPS Forwarding URL printed by ngrok and share that URL.');
  console.log('[INFO] /api requests are securely proxied to the local Spring Boot backend.');
  console.log('[INFO] Press Ctrl+C to stop the public tunnel and the website.');
  console.log('');

  tunnel = spawn('ngrok', ['http', '5173'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: isWindows,
    windowsHide: false
  });

  tunnel.on('exit', (code) => {
    if (!stopping) shutdown(code || 0);
  });
}
