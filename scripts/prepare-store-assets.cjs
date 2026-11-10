const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

async function prepareStoreAssets() {
  const root = path.resolve(__dirname, '..');
  const output = path.join(root, 'build/store-test/appx');
  await fs.mkdir(output, { recursive: true });
  // Use the existing application logo, never electron-builder's sample artwork.
  for (const [name, width, height] of [
    ['StoreLogo.png', 50, 50],
    ['Square44x44Logo.png', 44, 44],
    ['Square150x150Logo.png', 150, 150],
    ['Wide310x150Logo.png', 310, 150],
  ]) {
    await sharp(path.join(root, 'public/memory-vault-logo.png'))
      .resize(width, height, { fit: 'contain', background: '#243044' })
      .png().toFile(path.join(output, name));
  }
}

module.exports = { prepareStoreAssets };
if (require.main === module) {
  prepareStoreAssets().catch((error) => { console.error(error); process.exitCode = 1; });
}
