/**
 * Script pour générer les icônes PWA en PNG
 * Utilise canvas pour créer des icônes avec le logo MHA
 * 
 * Usage: node scripts/generate-icons-png.js
 * 
 * Prérequis: npm install canvas
 */

try {
  const { createCanvas } = require('canvas');
  const fs = require('fs');
  const path = require('path');

  function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Fond vert institutionnel
    ctx.fillStyle = '#2d8b6d';
    ctx.fillRect(0, 0, size, size);

    // Texte MHA au centre
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.4}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MHA', size / 2, size / 2);

    return canvas.toBuffer('image/png');
  }

  const publicDir = path.join(__dirname, '..', 'public');

  // Générer icon-192.png
  const icon192 = generateIcon(192);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
  console.log('✅ icon-192.png créé');

  // Générer icon-512.png
  const icon512 = generateIcon(512);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);
  console.log('✅ icon-512.png créé');

  console.log('');
  console.log('🎉 Icônes PWA générées avec succès!');

} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('⚠️  Le module "canvas" n\'est pas installé.');
    console.log('');
    console.log('Pour installer canvas:');
    console.log('  npm install canvas');
    console.log('');
    console.log('Ou utilisez le script generate-icons.js qui génère des SVG');
    process.exit(1);
  } else {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

