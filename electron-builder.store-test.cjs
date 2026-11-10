const path = require('node:path');
const fs = require('node:fs/promises');
const { build } = require('./package.json');

// Explicit config: do not merge the auto-discovered electron-builder.json5.
// Only the Store runner uses this file; existing NSIS/portable/release paths do not.
module.exports = {
  ...build,
  extends: null,
  asar: true,
  directories: {
    output: 'release/store-test',
    buildResources: 'build/store-test',
  },
  files: ['dist/**', 'dist-electron/**', 'resources/**', 'package.json'],
  asarUnpack: [
    'node_modules/better-sqlite3/**',
    'node_modules/sharp/**',
    'node_modules/@img/**',
  ],
  extraMetadata: { memoryVaultDistribution: 'store' },
  publish: null,
  win: {
    target: [{ target: 'appx', arch: ['x64'] }],
    icon: path.join(__dirname, 'build/icon.ico'),
    signAndEditExecutable: false,
  },
  appx: {
    identityName: 'MemoryVault.StoreTest',
    publisher: 'CN=MemoryVault Store Test',
    publisherDisplayName: 'Memory Vault (Development)',
    applicationId: 'MemoryVault',
    displayName: 'Memory Vault Store Test',
    artifactName: 'Memory-Vault-StoreTest-${version}-${arch}.${ext}',
    backgroundColor: '#243044',
    languages: ['en-US'],
    addAutoLaunchExtension: false,
    electronUpdaterAware: false,
    setBuildNumber: false,
  },
  // 24.13.3 hardcodes an obsolete Windows 10 floor in its AppX template.
  // Use the supported hook rather than patching the installed builder.
  appxManifestCreated: async (manifestPath) => {
    const manifest = await fs.readFile(manifestPath, 'utf8');
    const updated = manifest.replace(
      /<TargetDeviceFamily Name="Windows.Desktop" MinVersion="[^"]+" MaxVersionTested="[^"]+"\s*\/>/,
      '<TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.19041.0" MaxVersionTested="10.0.19041.0" />',
    );
    if (updated === manifest) throw new Error('Unexpected AppX template; review the Windows version hook.');
    await fs.writeFile(manifestPath, updated);
    const output = path.join(__dirname, 'release/store-test');
    await fs.mkdir(output, { recursive: true });
    await fs.copyFile(manifestPath, path.join(output, 'AppxManifest.xml'));
  },
};
