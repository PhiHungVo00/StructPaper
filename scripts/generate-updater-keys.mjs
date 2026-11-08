#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const keysDir = path.join(repoRoot, '.tauri-keys');
const privateKeyFile = path.join(keysDir, 'updater.key');
const publicKeyFile = path.join(keysDir, 'updater.key.pub');
const tauriConfPath = path.join(repoRoot, 'apps', 'web', 'src-tauri', 'tauri.conf.json');

console.log('=== Tauri v2 Updater Minisign Keypair Generator ===\n');

// 1. Ensure keys directory exists
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// 2. Execute Tauri CLI signer generate
console.log('Generating Minisign Ed25519 keypair via @tauri-apps/cli...');
const tauriArgs = [
  '--filter',
  '@structpaper/web',
  'exec',
  'tauri',
  'signer',
  'generate',
  '-w',
  path.relative(path.join(repoRoot, 'apps', 'web'), privateKeyFile),
  '--ci',
  '-f',
];

const res = spawnSync('pnpm', tauriArgs, {
  cwd: repoRoot,
  shell: true,
  encoding: 'utf-8',
});

if (res.error) {
  console.error('Failed to run pnpm tauri signer generate:', res.error);
  process.exit(1);
}

if (!fs.existsSync(publicKeyFile) || !fs.existsSync(privateKeyFile)) {
  console.error('Key files were not generated at expected locations.');
  console.error('STDOUT:', res.stdout);
  console.error('STDERR:', res.stderr);
  process.exit(1);
}

const pubkeyContent = fs.readFileSync(publicKeyFile, 'utf-8').trim();
const privateKeyContent = fs.readFileSync(privateKeyFile, 'utf-8').trim();

console.log('\n[SUCCESS] Keypair generated successfully!');
console.log(`Public Key file:  ${path.relative(repoRoot, publicKeyFile)}`);
console.log(`Private Key file: ${path.relative(repoRoot, privateKeyFile)} (DO NOT COMMIT!)`);
console.log('\n--- Minisign Public Key (for tauri.conf.json) ---');
console.log(pubkeyContent);

// 3. Update tauri.conf.json if present
if (fs.existsSync(tauriConfPath)) {
  try {
    const rawConf = fs.readFileSync(tauriConfPath, 'utf-8');
    const conf = JSON.parse(rawConf);

    conf.bundle = conf.bundle || {};
    conf.bundle.createUpdaterArtifacts = true;

    conf.plugins = conf.plugins || {};
    conf.plugins.updater = {
      pubkey: pubkeyContent,
      endpoints: [
        'https://github.com/StructPaper/StructPaper/releases/latest/download/latest.json',
      ],
      windows: {
        installMode: 'passive',
      },
    };

    fs.writeFileSync(tauriConfPath, JSON.stringify(conf, null, 2) + '\n', 'utf-8');
    console.log(`\nUpdated ${path.relative(repoRoot, tauriConfPath)} with updater config & pubkey.`);
  } catch (err) {
    console.error(`Failed to update ${tauriConfPath}:`, err);
  }
}

console.log('\n=== Next Steps ===');
console.log('1. Go to your GitHub repository -> Settings -> Secrets and variables -> Actions');
console.log('2. Add new Repository Secret:');
console.log('   - Name: TAURI_SIGNING_PRIVATE_KEY');
console.log('   - Value: (Paste content of .tauri-keys/updater.key or the key string)');
console.log('3. Optional (if password was set):');
console.log('   - Name: TAURI_SIGNING_PRIVATE_KEY_PASSWORD');
console.log('4. See scripts/updater-signing-guide.md for detailed documentation.');
