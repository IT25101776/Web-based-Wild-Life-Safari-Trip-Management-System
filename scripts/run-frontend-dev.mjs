import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = path.join(root, 'frontend');
const win = process.platform === 'win32';
const vite = path.join(cwd, 'node_modules', '.bin', win ? 'vite.cmd' : 'vite');

function run(args) {
  return new Promise((resolve) => {
    const child = win
      ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', ['npm.cmd', ...args].join(' ')], {
          cwd,
          stdio: 'inherit',
          windowsHide: true,
          shell: false
        })
      : spawn('npm', args, { cwd, stdio: 'inherit', shell: false });
    child.on('exit', (code) => resolve(code ?? 0));
  });
}

if (!fs.existsSync(vite)) {
  console.log('[SAFARI] First run detected. Installing frontend packages...');
  const installCode = await run(['install']);
  if (installCode !== 0) process.exit(installCode);
}
process.exit(await run(['run', 'dev', '--', '--open', '--strictPort']));
