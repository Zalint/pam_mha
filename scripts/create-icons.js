/**
 * Script pour créer des icônes PWA simples
 * Utilise canvas pour générer des icônes basiques
 * 
 * Usage: node scripts/create-icons.js
 */

const fs = require('fs');
const path = require('path');

// Créer un SVG simple pour l'icône
const createIconSVG = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2d8b6d"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">MHA</text>
</svg>`;
};

// Créer les fichiers SVG
const publicDir = path.join(__dirname, '..', 'public');

// Créer icon-192.svg
const icon192 = createIconSVG(192);
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), icon192);

// Créer icon-512.svg
const icon512 = createIconSVG(512);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), icon512);

console.log('✓ Icônes SVG créées (icon-192.svg, icon-512.svg)');
console.log('');
console.log('Note: Pour une meilleure compatibilité, convertissez ces SVG en PNG:');
console.log('  - Utilisez un outil en ligne (ex: https://convertio.co/svg-png/)');
console.log('  - Ou utilisez ImageMagick: convert icon-192.svg icon-192.png');
console.log('');
console.log('En attendant, le manifest.json peut utiliser les SVG directement.');

