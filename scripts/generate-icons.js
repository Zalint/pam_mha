/**
 * Script pour générer les icônes PWA
 * Utilise canvas pour créer des icônes simples avec le logo MHA
 * 
 * Usage: node scripts/generate-icons.js
 * 
 * Prérequis: npm install canvas
 */

const fs = require('fs');
const path = require('path');

// Pour l'instant, créer un script simple qui génère des icônes SVG
// qui peuvent être converties en PNG

function generateIconSVG(size, text = 'MHA') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2d8b6d" rx="${size * 0.1}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" 
        fill="white" text-anchor="middle" dominant-baseline="central">${text}</text>
</svg>`;
}

// Générer les SVG
const icon192SVG = generateIconSVG(192, 'MHA');
const icon512SVG = generateIconSVG(512, 'MHA');

// Sauvegarder les SVG
const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), icon192SVG);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), icon512SVG);

console.log('✅ Icônes SVG générées:');
console.log('   - icon-192.svg');
console.log('   - icon-512.svg');
console.log('');
console.log('⚠️  Pour créer les PNG, vous avez deux options:');
console.log('');
console.log('Option 1: Utiliser un convertisseur en ligne');
console.log('  1. Ouvrir icon-192.svg dans un navigateur');
console.log('  2. Faire clic droit > Enregistrer l\'image sous > icon-192.png');
console.log('  3. Répéter pour icon-512.svg');
console.log('');
console.log('Option 2: Installer canvas et utiliser ce script amélioré');
console.log('  npm install canvas');
console.log('  Puis modifier ce script pour utiliser canvas');

