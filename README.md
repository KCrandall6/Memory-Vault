# Memory Vault

Memory Vault is an Electron + React app for organizing photos, documents, videos, and other media. It stores files in a portable archive folder alongside a SQLite database so the entire library can live on an external drive.

## Developing

### Prerequisites
- Node.js 18+
- npm

### Run the Electron dev app
The Vite dev server is wired to Electron through `vite-plugin-electron`. Launch the full desktop app (with access to `file://` previews) via:

```bash
npm install
npm run dev
```

This starts Vite and automatically opens an Electron window pointed at the dev server. If you manually open the `http://localhost:5173` URL in a normal browser, local file previews will be blocked by the browser sandbox; use the Electron window instead.

### Linting

```bash
npm run lint
```

## Building an installer / portable build

The project is configured for electron-builder. Generate platform installers (including a Windows `.exe`) with:

```bash
npm run build
```

Outputs are written to `release/<version>/` based on `electron-builder.json5`. For Windows you will see:
- `Memory Vault-Windows-<version>-Setup.exe` (NSIS installer with selectable install directory)
- `win-unpacked/` folder containing a portable `Memory Vault.exe`

On macOS a `.dmg` is produced, and on Linux an `.AppImage` is produced under the same release folder.

## File/storage layout

In packaged builds, the archive folder (`Memory Vault Archive`) and SQLite database (`memoryvault.db`) are created next to the executable by default. In development they are created under your user data directory (e.g., `%AppData%/temp-project---template-react/MemoryVault`).