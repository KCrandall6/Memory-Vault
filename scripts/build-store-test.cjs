const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { prepareStoreAssets } = require('./prepare-store-assets.cjs');

async function main() {
  if (process.platform !== 'win32') {
    throw new Error('AppX packaging requires Windows. Use the experimental Windows Store CI workflow; Linux compilation alone cannot produce or install this package.');
  }
  const root = path.resolve(__dirname, '..');
  const environment = { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' };
  // This experiment must not consume release signing credentials.
  for (const name of ['CSC_LINK', 'CSC_KEY_PASSWORD', 'WIN_CSC_LINK', 'WIN_CSC_KEY_PASSWORD']) delete environment[name];
  const run = (entry, args) => {
    const result = spawnSync(process.execPath, [require.resolve(entry), ...args], {
      cwd: root, env: environment, stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(entry + ' failed (exit ' + result.status + ').');
  };
  await prepareStoreAssets();
  run('typescript/bin/tsc', ['--noEmit']);
  run(path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js'), ['build']);
  run('../scripts/verify-preload.cjs', []);
  run('../scripts/verify-updater-runtime.cjs', []);
  run('electron-builder/out/cli/cli.js', [
    '--config', 'electron-builder.store-test.cjs',
    '--win', 'appx', '--x64', '--publish', 'never',
  ]);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
