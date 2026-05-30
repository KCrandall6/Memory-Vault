# Memory Vault

Memory Vault is an Electron + React app for organizing photos, documents, videos, and other media. It stores files in a portable archive folder alongside a SQLite database so the entire library can live on an external drive.

## Developing

### Prerequisites
- Node.js 18+
- npm

### Run the Electron dev app
Use the full Electron development command for normal testing:

```bash
npm install
npm run dev
```

`npm run dev` starts the Vite renderer dev server and, through `vite-plugin-electron`, opens the real Electron shell pointed at that dev server. This keeps the app in the same architecture used by production: the renderer talks to the preload bridge, and the preload bridge calls Electron IPC handlers for file selection, preview generation, database search/details, saves, and downloads.

Do **not** use a normal browser tab as your primary development target. Browser-only Vite testing cannot access arbitrary local files and does not have the Electron preload bridge, so selected-file previews and archived media URLs can behave differently or fail entirely. If you only need a renderer isolation check, you can run `npm run renderer:dev`, but local-file workflows must be verified with `npm run dev`.

### Linting

```bash
npm run lint
```

## Building an installer / portable build

The project is configured for electron-builder. Generate the production renderer (`dist/`), Electron main/preload output (`dist-electron/`), and platform installers (including a Windows `.exe`) with:

```bash
npm run build
```

Outputs are written to `release/<version>/` based on `electron-builder.json5`. For Windows you will see:
- `Memory Vault-Windows-<version>-Setup.exe` (NSIS installer with selectable install directory)
- `win-unpacked/` folder containing a portable `Memory Vault.exe`

On macOS a `.dmg` is produced, and on Linux an `.AppImage` is produced under the same release folder.

## File/storage layout

In packaged builds, the archive folder (`Memory Vault Archive`) and SQLite database (`memoryvault.db`) are created next to the executable by default. In development they are created under your user data directory (e.g., `%AppData%/temp-project---template-react/MemoryVault`).