# Auto-Update Setup Guide

Planen now includes automatic update checking for both the web app and desktop applications.

## How It Works

### Web App (GitHub Pages)
- Checks for updates every hour by fetching `/version.json`
- Compares the version number with the current version
- Shows a notification banner when a new version is available
- Users can click "Update Now" to refresh the page and get the latest version

### Desktop App (Tauri)
- Uses Tauri's built-in updater plugin
- Checks for updates on app startup
- Downloads and installs updates automatically when the user confirms
- Relaunches the app after updating

## Setup Instructions

### 1. Web App Updates

#### Update the version number

When you release a new version, use the provided helper script:

```bash
./update-version.sh 0.2.0
```

This script automatically updates:
- `version.json`
- `public/version.json`
- `package.json`
- `src/hooks/useUpdateChecker.js`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

Alternatively, you can manually update each file:

1. Edit `version.json` in the project root:
```json
{
  "version": "0.2.0",
  "releaseDate": "2025-10-15"
}
```

2. Update the version in `src/hooks/useUpdateChecker.js`:
```javascript
const CURRENT_VERSION = '0.2.0';
```

3. Update the version in `package.json`:
```json
{
  "version": "0.2.0"
}
```

4. Build and deploy:
```bash
npm run build
npm run deploy
```

The version.json file will be automatically copied to the public directory and deployed with your app.

### 2. Desktop App Updates (Tauri)

#### Initial Setup - Generate Signing Keys

For security, Tauri requires signed updates. Generate a key pair:

```bash
npm run tauri signer generate -- -w ~/.tauri/planen.key
```

This creates:
- Private key: `~/.tauri/planen.key` (keep this SECRET!)
- Public key: displayed in terminal output

#### Configure the Public Key

1. Copy the public key from the terminal output
2. Edit `src-tauri/tauri.conf.json`:
```json
{
  "plugins": {
    "updater": {
      "pubkey": "YOUR_ACTUAL_PUBLIC_KEY_HERE",
      "endpoints": [
        "https://github.com/ktallett/planen/releases/latest/download/latest.json"
      ]
    }
  }
}
```

#### Publishing a New Release

1. Update version in `src-tauri/tauri.conf.json`:
```json
{
  "version": "0.2.0"
}
```

2. Update version in `src-tauri/Cargo.toml`:
```toml
[package]
version = "0.2.0"
```

3. Update version in `package.json` and `src/hooks/useUpdateChecker.js`

4. Build the release:
```bash
npm run tauri:build
```

5. Sign the update files:
```bash
# For Linux .AppImage
npm run tauri signer sign ~/.tauri/planen.key \
  src-tauri/target/release/bundle/appimage/planen_0.2.0_amd64.AppImage

# For macOS .dmg
npm run tauri signer sign ~/.tauri/planen.key \
  src-tauri/target/release/bundle/dmg/Planen_0.2.0_x64.dmg

# For Windows .msi
npm run tauri signer sign ~/.tauri/planen.key \
  src-tauri/target/release/bundle/msi/Planen_0.2.0_x64_en-US.msi
```

Each command will generate a `.sig` file next to the installer.

6. Create a GitHub Release:
   - Go to https://github.com/ktallett/planen/releases/new
   - Tag: `v0.2.0`
   - Title: `Planen v0.2.0`
   - Upload the installers AND their `.sig` files
   - Upload a `latest.json` file (see below)

7. Create `latest.json`:
```json
{
  "version": "0.2.0",
  "notes": "Bug fixes and improvements",
  "pub_date": "2025-10-15T12:00:00Z",
  "platforms": {
    "linux-x86_64": {
      "signature": "SIGNATURE_CONTENT_FROM_.SIG_FILE",
      "url": "https://github.com/ktallett/planen/releases/download/v0.2.0/planen_0.2.0_amd64.AppImage"
    },
    "darwin-x86_64": {
      "signature": "SIGNATURE_CONTENT_FROM_.SIG_FILE",
      "url": "https://github.com/ktallett/planen/releases/download/v0.2.0/Planen_0.2.0_x64.dmg"
    },
    "darwin-aarch64": {
      "signature": "SIGNATURE_CONTENT_FROM_.SIG_FILE",
      "url": "https://github.com/ktallett/planen/releases/download/v0.2.0/Planen_0.2.0_aarch64.dmg"
    },
    "windows-x86_64": {
      "signature": "SIGNATURE_CONTENT_FROM_.SIG_FILE",
      "url": "https://github.com/ktallett/planen/releases/download/v0.2.0/Planen_0.2.0_x64_en-US.msi"
    }
  }
}
```

Get the signature content by reading the `.sig` files:
```bash
cat src-tauri/target/release/bundle/appimage/planen_0.2.0_amd64.AppImage.sig
```

## Testing

### Test Web App Updates

1. Deploy version 0.1.0
2. Change `public/version.json` to version 0.2.0
3. Wait for the update check (or refresh the page)
4. You should see the update notification

### Test Desktop App Updates

1. Build and install version 0.1.0
2. Create a GitHub release with version 0.2.0
3. Launch the app
4. The updater should detect and offer the new version

## Troubleshooting

### Web App
- **Update not detected**: Check browser console for fetch errors
- **Cache issues**: Add `?t=timestamp` to version.json URL (already implemented)

### Desktop App
- **Update check fails**: Verify the public key matches the private key used for signing
- **Signature verification fails**: Ensure you signed the correct file and copied the full signature
- **Update endpoint unreachable**: Check that latest.json is publicly accessible

## Security Notes

- **Never commit the private key** (`~/.tauri/planen.key`) to version control
- Add `*.key` to `.gitignore`
- Store the private key securely (password manager, encrypted storage)
- Without the private key, you cannot sign future updates

## Automation with GitHub Actions

Consider setting up GitHub Actions to automate the build and release process. This can:
- Build for all platforms
- Sign the installers
- Create the latest.json file
- Publish the GitHub release

See Tauri's documentation for CI/CD examples: https://tauri.app/v1/guides/building/cross-platform/
