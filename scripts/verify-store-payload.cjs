const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const asar = require('@electron/asar');

const resources = process.env.MEMORY_VAULT_PACKAGE_RESOURCES;
assert.ok(resources, 'Run through verify-store-package.ps1');
const archive = path.join(resources, 'app.asar');
const metadata = JSON.parse(asar.extractFile(archive, 'package.json').toString());
assert.equal(metadata.memoryVaultDistribution, 'store', 'Store updater guard metadata is missing');
assert.equal(metadata.main, 'dist-electron/main.js');
const files = asar.listPackage(archive).map((file) => file.replace(/\\/g, '/'));
for (const entry of ['/dist/index.html', '/dist-electron/main.js', '/dist-electron/preload.js', '/resources/create-database.sql']) {
  assert.ok(files.includes(entry), 'Missing packaged file: ' + entry);
}
assert.ok(!fs.existsSync(path.join(resources, 'app-update.yml')), 'Store payload must not include GitHub update configuration');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const location = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(location) : [location];
  });
}
const unpacked = walk(path.join(resources, 'app.asar.unpacked'));
const sqlite = unpacked.filter((file) => file.endsWith('better_sqlite3.node'));
const sharp = unpacked.filter((file) => /sharp-win32-x64\.node$/.test(file));
assert.ok(sqlite.length > 0, 'SQLite native binding must be unpacked');
assert.ok(sharp.length > 0, 'Sharp Windows x64 native binding must be unpacked');
assert.ok(unpacked.some((file) => /libvips.*\.dll$/i.test(file)), 'Sharp libvips DLL must be unpacked');
for (const file of [...sqlite, ...sharp]) {
  const data = fs.readFileSync(file);
  assert.equal(data.readUInt16LE(0), 0x5a4d, 'Expected a Windows PE native binding');
  const peOffset = data.readUInt32LE(0x3c);
  assert.equal(data.readUInt32LE(peOffset), 0x4550);
  assert.equal(data.readUInt16LE(peOffset + 4), 0x8664, 'Expected AMD64 native binding');
}
console.log('Store payload verified: metadata, renderer, preload, SQLite schema and unpacked Windows x64 native bindings.');
console.log('Native binding presence/architecture does not prove DLL loading or runtime behavior.');
