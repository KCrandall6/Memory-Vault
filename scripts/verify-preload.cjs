const fs = require('fs');
const path = require('path');

const preloadPath = path.resolve(__dirname, '..', 'dist-electron', 'preload.js');

function fail(message) {
  console.error(`Preload verification failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(preloadPath)) {
  fail(`Expected generated preload file at ${preloadPath}`);
}

const source = fs.readFileSync(preloadPath, 'utf8');
const topLevelEsmPattern = /^\s*(?:import\s+(?:[^'";]+\s+from\s+)?['"][^'"]+['"]|export\s+(?:\{|\*|default|const|let|var|function|class))\b/m;
const electronRequirePattern = /require\(\s*['"]electron['"]\s*\)/;

if (topLevelEsmPattern.test(source)) {
  fail('dist-electron/preload.js contains a top-level ESM import or export statement. Sandboxed Electron preload scripts must be CommonJS-compatible.');
}

if (!electronRequirePattern.test(source)) {
  fail('dist-electron/preload.js does not contain a CommonJS require("electron") call.');
}

console.log('Preload verification passed: dist-electron/preload.js is CommonJS-compatible and requires Electron.');
