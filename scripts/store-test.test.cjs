const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const os = require('node:os');
const vm = require('node:vm');
const { buildSync } = require('esbuild');
const sharp = require('sharp');
const config = require('../electron-builder.store-test.cjs');
const { prepareStoreAssets } = require('./prepare-store-assets.cjs');

const compiled = buildSync({
  entryPoints: [path.join(__dirname, '../electron/updater.ts')],
  bundle: true, write: false, platform: 'node', format: 'cjs',
  external: ['electron', 'electron-updater', './storage-root.cjs'],
  define: { 'import.meta.url': JSON.stringify('file:///updater-test.js') },
}).outputFiles[0].text;

function loadUpdater({ store = false, windowsStore = false, portable = false, packaged = true, platform = 'win32' } = {}) {
  const handlers = new Map();
  const events = new Map();
  const calls = { loads: 0, checks: 0, downloads: 0, installs: 0, timers: [] };
  const autoUpdater = {
    on: (name, callback) => events.set(name, callback),
    checkForUpdates: async () => { calls.checks++; },
    downloadUpdate: async () => { calls.downloads++; },
    quitAndInstall: () => { calls.installs++; },
  };
  const storage = { readSettings: () => ({ lastUpdateCheckAt: '2020-01-01T00:00:00Z' }), writeSettings: () => {} };
  const requireMock = (name) => {
    if (name === 'electron') return {
      app: { isPackaged: packaged, getVersion: () => '0.1.1', getAppPath: () => '/mock-app' },
      BrowserWindow: { getAllWindows: () => [] },
      ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    };
    if (name === 'node:module') return { createRequire: () => requireMock };
    if (name === './storage-root.cjs') return storage;
    if (name.endsWith('package.json')) return { memoryVaultDistribution: store ? 'store' : undefined };
    if (name === 'electron-updater') {
      calls.loads++;
      if (store || windowsStore) throw new Error('Store package tried to load electron-updater');
      return { autoUpdater };
    }
    return require(name);
  };
  const context = {
    module: { exports: {} }, require: requireMock, console, URL,
    process: { platform, windowsStore, env: portable ? { PORTABLE_EXECUTABLE_FILE: 'portable.exe' } : {} },
    setTimeout: (callback) => { calls.timers.push(callback); return {}; },
  };
  vm.runInNewContext(compiled, context);
  const updater = context.module.exports;
  updater.setupUpdater({ getMainWindow: () => null });
  updater.scheduleAutomaticUpdateCheck();
  const sender = { senderFrame: { url: packaged ? 'file:///app/dist/index.html' : 'http://127.0.0.1:5173' } };
  return { updater, calls, autoUpdater, events, invoke: (channel) => handlers.get(channel)(sender) };
}

for (const scenario of [{ store: true }, { windowsStore: true }, { store: true, windowsStore: true }]) {
  test('Store guard blocks loading, scheduling and every update action: ' + JSON.stringify(scenario), async () => {
    const { updater, calls, invoke } = loadUpdater(scenario);
    assert.equal(updater.getUpdateState().supported, false);
    assert.match(updater.getUpdateState().error, /Microsoft Store/);
    assert.equal(updater.getUpdateState().nextAutomaticCheckAt, undefined);
    for (const action of ['check', 'download', 'quit-and-install']) {
      await invoke('updates:' + action);
    }
    assert.equal(calls.loads, 0);
    assert.equal(calls.timers.length, 0);
    assert.equal(calls.checks + calls.downloads + calls.installs, 0);
  });
}

test('NSIS retains opt-in download/install and its scheduled checks', async () => {
  const { updater, calls, invoke, autoUpdater, events } = loadUpdater();
  assert.equal(updater.getUpdateState().supported, true);
  assert.equal(calls.loads, 1);
  assert.equal(autoUpdater.autoDownload, false);
  assert.equal(autoUpdater.autoInstallOnAppQuit, false);
  assert.equal(calls.timers.length, 1);
  assert.equal(calls.checks, 0);
  await invoke('updates:check');
  assert.equal(calls.checks, 1);
  events.get('update-available')({ version: '0.1.2' });
  await invoke('updates:download');
  assert.equal(calls.downloads, 1);
  assert.equal(calls.installs, 0);
  events.get('update-downloaded')({ version: '0.1.2' });
  await invoke('updates:quit-and-install');
  assert.equal(calls.installs, 1);
});

for (const scenario of [{ portable: true }, { packaged: false }, { platform: 'linux' }]) {
  test('Existing unsupported distribution remains guarded: ' + JSON.stringify(scenario), () => {
    const { updater, calls } = loadUpdater(scenario);
    assert.equal(updater.getUpdateState().supported, false);
    assert.equal(calls.loads, 0);
    assert.equal(calls.timers.length, 0);
  });
}

test('NSIS startup timer still performs the existing automatic check', async () => {
  const { calls } = loadUpdater();
  calls.timers[0]();
  await new Promise(setImmediate);
  assert.equal(calls.checks, 1);
  assert.equal(calls.downloads, 0);
  assert.equal(calls.installs, 0);
});

test('Generated AppX manifest and branded assets use the isolated Store configuration', async () => {
  const { default: AppXTarget } = require('app-builder-lib/out/targets/AppxTarget');
  const { Arch } = require('builder-util');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'memory-vault-manifest-'));
  try {
    await prepareStoreAssets();
    for (const [asset, width, height] of [
      ['StoreLogo.png', 50, 50], ['Square44x44Logo.png', 44, 44],
      ['Square150x150Logo.png', 150, 150], ['Wide310x150Logo.png', 310, 150],
    ]) {
      const metadata = await sharp(path.join(__dirname, '../build/store-test/appx', asset)).metadata();
      assert.equal(metadata.width, width);
      assert.equal(metadata.height, height);
    }
    const target = Object.create(AppXTarget.prototype);
    target.options = config.appx;
    target.packager = {
      appInfo: {
        productFilename: 'Memory Vault', productName: 'Memory Vault', name: 'memory-vault',
        description: 'A local-first family memory archive.',
        getVersionInWeirdWindowsForm: () => '0.1.1.0',
      },
      config: {}, platformSpecificBuildOptions: {},
    };
    const manifestPath = path.join(temp, 'AppxManifest.xml');
    await target.writeManifest(manifestPath, Arch.x64, config.appx.publisher, []);
    await config.appxManifestCreated(manifestPath);
    const xml = await fs.readFile(manifestPath, 'utf8');
    assert.match(xml, /Name="MemoryVault.StoreTest"/);
    assert.match(xml, /Publisher='CN=MemoryVault Store Test'/);
    assert.match(xml, /ProcessorArchitecture="x64"/);
    assert.match(xml, /MinVersion="10.0.19041.0"/);
    assert.match(xml, /EntryPoint="Windows.FullTrustApplication"/);
    assert.match(xml, /rescap:Capability Name="runFullTrust"/);
    assert.doesNotMatch(xml, /broadFileSystemAccess|removableStorage|windows.startupTask/);
    await assert.rejects(config.appxManifestCreated(manifestPath), /Unexpected AppX template/);
    assert.equal(config.extraMetadata.memoryVaultDistribution, 'store');
    assert.equal(config.publish, null);
    assert.equal(config.appx.electronUpdaterAware, false);
    assert.equal(config.win.target[0].target, 'appx');
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test('Store runner resolves its tools and cannot use release signing or publishing', async () => {
  const scriptPath = path.join(__dirname, 'build-store-test.cjs');
  const source = await fs.readFile(scriptPath, 'utf8');
  const invocations = [];
  const toolRequire = (name) => {
    if (name === 'node:child_process') return {
      spawnSync: (executable, args, options) => {
        invocations.push({ executable, args, options });
        return { status: 0 };
      },
    };
    if (name === './prepare-store-assets.cjs') return { prepareStoreAssets: async () => {} };
    return require(name);
  };
  toolRequire.resolve = require.resolve;
  const context = {
    require: toolRequire, __dirname, console,
    process: {
      platform: 'win32', execPath: process.execPath,
      env: { CSC_LINK: 'test-only', WIN_CSC_LINK: 'test-only', CSC_KEY_PASSWORD: 'test-only', WIN_CSC_KEY_PASSWORD: 'test-only' },
    },
  };
  vm.runInNewContext(source, context);
  await new Promise(setImmediate);
  assert.equal(context.process.exitCode, undefined);
  assert.equal(invocations.length, 5);
  for (const invocation of invocations) {
    await fs.access(invocation.args[0]);
    assert.equal(invocation.options.env.CSC_IDENTITY_AUTO_DISCOVERY, 'false');
    assert.equal(invocation.options.env.CSC_LINK, undefined);
    assert.equal(invocation.options.env.WIN_CSC_LINK, undefined);
    assert.equal(invocation.options.env.CSC_KEY_PASSWORD, undefined);
    assert.equal(invocation.options.env.WIN_CSC_KEY_PASSWORD, undefined);
  }
  assert.equal(invocations[4].args.slice(-2).join(' '), '--publish never');
  assert.ok(invocations[4].args.includes('electron-builder.store-test.cjs'));
});
