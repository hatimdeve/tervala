const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const ico = require('sharp-ico');

// Augmentation significative des tailles minimales pour le favicon
const sizes = [64, 96, 128, 192, 256, 512];
const sourceImage = path.join(__dirname, '../public/images/tervel-logo.png');
const outputDir = path.join(__dirname, '../public');

async function generateFavicons() {
  try {
    // Générer favicon.ico avec des tailles beaucoup plus grandes (64x64, 96x96, 128x128)
    const smallSizes = sizes.filter(size => size <= 128);
    const icoBuffers = await Promise.all(
      smallSizes.map(size =>
        sharp(sourceImage)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer()
      )
    );

    // Écrire le favicon.ico
    const icoBuffer = await ico.encode(icoBuffers);
    fs.writeFileSync(path.join(outputDir, 'favicon.ico'), icoBuffer);

    // Générer les PNG pour PWA avec des tailles plus grandes
    await Promise.all([
      sharp(sourceImage)
        .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(outputDir, 'logo192.png')),
      sharp(sourceImage)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(outputDir, 'logo512.png'))
    ]);

    console.log('✅ Favicons générés avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la génération des favicons:', error);
  }
}

generateFavicons(); 