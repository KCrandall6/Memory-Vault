const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const source = path.join(__dirname, '..', 'public', 'memory-vault-logo.png');
const outputDir = path.join(__dirname, '..', 'build');
const output = path.join(outputDir, 'icon.ico');

const sizes = [16, 24, 32, 48, 64, 128, 256];

function writeUInt16LE(buffer, value, offset) {
  buffer.writeUInt16LE(value, offset);
}

function writeUInt32LE(buffer, value, offset) {
  buffer.writeUInt32LE(value, offset);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const images = await Promise.all(
    sizes.map(async (size) => {
      const png = await sharp(source)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();

      return { size, png };
    })
  );

  const headerSize = 6;
  const directoryEntrySize = 16;
  const directorySize = images.length * directoryEntrySize;
  const imageDataOffset = headerSize + directorySize;
  const totalSize = imageDataOffset + images.reduce((sum, image) => sum + image.png.length, 0);

  const ico = Buffer.alloc(totalSize);

  writeUInt16LE(ico, 0, 0);
  writeUInt16LE(ico, 1, 2);
  writeUInt16LE(ico, images.length, 4);

  let imageOffset = imageDataOffset;

  images.forEach((image, index) => {
    const entryOffset = headerSize + index * directoryEntrySize;
    const sizeByte = image.size === 256 ? 0 : image.size;

    ico[entryOffset] = sizeByte;
    ico[entryOffset + 1] = sizeByte;
    ico[entryOffset + 2] = 0;
    ico[entryOffset + 3] = 0;

    writeUInt16LE(ico, 1, entryOffset + 4);
    writeUInt16LE(ico, 32, entryOffset + 6);
    writeUInt32LE(ico, image.png.length, entryOffset + 8);
    writeUInt32LE(ico, imageOffset, entryOffset + 12);

    image.png.copy(ico, imageOffset);
    imageOffset += image.png.length;
  });

  fs.writeFileSync(output, ico);
  console.log(`Created ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
