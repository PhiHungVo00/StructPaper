import { renameSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(__dirname, '../src/app/api');
const apiBackupDir = path.resolve(__dirname, '../src/app/__api_backup__');

let moved = false;
try {
  if (existsSync(apiDir)) {
    console.log('[export-desktop] Temporarily stashing src/app/api for static export...');
    renameSync(apiDir, apiBackupDir);
    moved = true;
  }
  console.log('[export-desktop] Running next build with NEXT_EXPORT=true...');
  const res = spawnSync('npx', ['next', 'build'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NEXT_EXPORT: 'true' },
    cwd: path.resolve(__dirname, '..'),
  });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
} finally {
  if (moved && existsSync(apiBackupDir)) {
    console.log('[export-desktop] Restoring src/app/api...');
    renameSync(apiBackupDir, apiDir);
  }
}
