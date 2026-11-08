# StructPaper — Tauri v2 Auto-Updater Signing Key Setup Guide

Tauri v2 updater uses **Minisign (Ed25519)** public-key cryptography to verify updater packages (`latest.json`, `.nsis.zip`, `.tar.gz`) before downloading and executing them.

---

## 1. Key Generation

To generate a new keypair, run:
```bash
node scripts/generate-updater-keys.mjs
```
or via pnpm:
```bash
pnpm --filter @structpaper/web exec tauri signer generate -w ../../.tauri-keys/updater.key --ci -f
```

This generates:
- `.tauri-keys/updater.key`: The **private key** (secret!). Must **never** be committed to Git.
- `.tauri-keys/updater.key.pub`: The **public key**, embedded in `tauri.conf.json`.

> [!CAUTION]
> The `.tauri-keys/` directory and `*.key` files are listed in `.gitignore`. **NEVER commit your private key into the repository!**

---

## 2. Public Key Configuration in `tauri.conf.json`

The public key is embedded in `apps/web/src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "pubkey": "<MINISIGN_BASE64_PUBLIC_KEY>",
      "endpoints": [
        "https://github.com/StructPaper/StructPaper/releases/latest/download/latest.json"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

---

## 3. GitHub Actions Secret Configuration

When GitHub Actions builds and publishes releases (on tags `v*`), `tauri-apps/tauri-action` requires the private key to sign the bundle and generate `latest.json` + `.sig` signature files.

1. Navigate to: **GitHub Repo -> Settings -> Secrets and variables -> Actions**
2. Click **New repository secret**:
   - **Name**: `TAURI_SIGNING_PRIVATE_KEY`
   - **Value**: Copy the full contents of `.tauri-keys/updater.key` (or the base64 private key string).
3. If you set a password when generating the key, add:
   - **Name**: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
   - **Value**: `<your-private-key-password>`

---

## 4. How Release Artifacts are Verified

1. `tauri-action` builds the installers (NSIS installer for Windows, DMG for macOS).
2. It generates updater archives: `.nsis.zip` and signs them using `TAURI_SIGNING_PRIVATE_KEY`.
3. It produces `latest.json` containing version, release notes, download URL, and `signature`.
4. When Desktop StructPaper checks for updates, it fetches `latest.json`, validates the signature with `pubkey`, verifies archive integrity, and silently/passively installs the update upon user confirmation.
