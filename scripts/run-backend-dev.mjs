import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = path.join(root, 'backend');
const win = process.platform === 'win32';

const child = win
  ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'mvnw.cmd spring-boot:run -Dspring-boot.run.arguments=--server.address=0.0.0.0'], {
      cwd,
      stdio: 'inherit',
      windowsHide: true,
      shell: false
    })
  : spawn('./mvnw', ['spring-boot:run', '-Dspring-boot.run.arguments=--server.address=0.0.0.0'], {
      cwd,
      stdio: 'inherit',
      shell: false
    });

child.on('exit', (code) => process.exit(code ?? 0));
