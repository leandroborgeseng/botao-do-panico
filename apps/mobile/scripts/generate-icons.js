/**
 * Gera icon.png e adaptive-icon.png a partir do logo para atender aos requisitos
 * do Google Play (ícone visível, 1024x1024). Requer: npm install (sharp).
 *
 * Uso: node scripts/generate-icons.js
 */

const path = require('path');
const fs = require('fs');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('Execute: npm install (sharp está em devDependencies)');
    process.exit(1);
  }

  const assetsDir = path.join(__dirname, '..', 'assets');
  const logoPath = path.join(assetsDir, 'logo-prefeitura-franca.png');
  if (!fs.existsSync(logoPath)) {
    console.error('Arquivo não encontrado:', logoPath);
    process.exit(1);
  }

  const size = 1024;
  const padding = Math.round(size * 0.15); // zona segura; logo centralizado
  const maxLogoWidth = size - padding * 2;
  const maxLogoHeight = size - padding * 2;

  const logo = sharp(logoPath);
  const meta = await logo.metadata();
  const w = meta.width || 751;
  const h = meta.height || 377;
  const scale = Math.min(maxLogoWidth / w, maxLogoHeight / h, 1);
  const logoW = Math.round(w * scale);
  const logoH = Math.round(h * scale);
  const left = Math.round((size - logoW) / 2);
  const top = Math.round((size - logoH) / 2);

  // Fundo branco 1024x1024
  const background = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer();

  const resizedLogo = await sharp(logoPath)
    .resize(logoW, logoH)
    .png()
    .toBuffer();

  const iconBuffer = await sharp(background)
    .composite([{ input: resizedLogo, left, top }])
    .png()
    .toBuffer();

  const iconPath = path.join(assetsDir, 'icon.png');
  const adaptivePath = path.join(assetsDir, 'adaptive-icon.png');
  const store512Path = path.join(assetsDir, 'icon-play-store-512.png');
  fs.writeFileSync(iconPath, iconBuffer);
  fs.writeFileSync(adaptivePath, iconBuffer);

  const icon512 = await sharp(iconBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync(store512Path, icon512);

  console.log('Ícones gerados:');
  console.log('  -', iconPath, '(1024x1024)');
  console.log('  -', adaptivePath, '(1024x1024)');
  console.log('  -', store512Path, '(512x512 – use na Play Console em Principais recursos da página da loja)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
