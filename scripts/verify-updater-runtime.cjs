const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'dist-electron', 'main.js');
const source = fs.readFileSync(mainPath, 'utf8');

const namedImportPattern = /import\s*\{[^}]*\bautoUpdater\b[^}]*\}\s*from\s*["']electron-updater["']/;
const electronUpdaterImportPattern = /from\s*["']electron-updater["']/;
const createRequirePattern = /createRequire/;
const requireElectronUpdaterPattern = /\b\w+\(["']electron-updater["']\)/;
const autoUpdaterDestructurePattern = /\{\s*autoUpdater(?:\s*:\s*\w+)?\s*\}\s*=\s*\w+\(["']electron-updater["']\)/;

if (namedImportPattern.test(source)) {
  console.error('dist-electron/main.js contains an unsafe ESM named runtime import of autoUpdater from electron-updater.');
  process.exit(1);
}

if (electronUpdaterImportPattern.test(source)) {
  console.error('dist-electron/main.js imports electron-updater as an ESM dependency; use CommonJS-safe createRequire interop instead.');
  process.exit(1);
}

if (!createRequirePattern.test(source)) {
  console.error('dist-electron/main.js does not contain createRequire for CommonJS-safe electron-updater loading.');
  process.exit(1);
}

if (!requireElectronUpdaterPattern.test(source) || !autoUpdaterDestructurePattern.test(source)) {
  console.error('dist-electron/main.js does not appear to load autoUpdater from electron-updater through createRequire/require.');
  process.exit(1);
}

console.log('Updater runtime verification passed: electron-updater is loaded through CommonJS-safe createRequire interop.');
