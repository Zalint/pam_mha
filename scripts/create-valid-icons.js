/**
 * Crée des icônes PNG valides en utilisant une approche simple
 * Génère des PNG minimaux mais valides
 */

const fs = require('fs');
const path = require('path');

// PNG minimal valide 192x192 (fond vert #2d8b6d)
// Format PNG avec IHDR, IDAT, IEND
// Créé manuellement pour être sûr qu'il soit valide
const createValidPNG = (size) => {
  // Header PNG
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // Pour simplifier, on va créer un PNG très simple avec un fond uni
  // On utilise une approche différente : créer un fichier SVG et le convertir
  // Mais pour l'instant, créons un PNG minimal valide
  
  // PNG 1x1 rouge (pour test) puis on le redimensionne conceptuellement
  // En fait, créons un vrai PNG avec canvas si disponible, sinon SVG
  
  return null; // On va utiliser une autre approche
};

// Approche alternative : créer des PNG via Data URI valide
// Utilisons une image PNG réelle encodée en base64
// PNG 192x192 avec fond vert #2d8b6d et texte "MHA" blanc

// PNG minimal valide - format simplifié
function createSimplePNG(size, bgColor = '#2d8b6d', text = 'MHA') {
  // Pour créer un vrai PNG, on a besoin d'une bibliothèque
  // Mais on peut créer un PNG très simple manuellement
  
  // Utilisons plutôt une approche avec sharp ou canvas si disponible
  // Sinon, créons un SVG qui sera converti
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;
  
  return svg;
}

// Pour l'instant, créons des PNG valides en utilisant une méthode différente
// On va installer sharp ou utiliser une autre solution

const publicDir = path.join(__dirname, '..', 'public');

// Créer des PNG valides en utilisant une bibliothèque si disponible
try {
  // Essayer d'utiliser sharp
  const sharp = require('sharp');
  
  // Créer l'icône 192x192
  const svg192 = createSimplePNG(192);
  sharp(Buffer.from(svg192))
    .png()
    .resize(192, 192)
    .toFile(path.join(publicDir, 'icon-192.png'))
    .then(() => {
      console.log('✓ icon-192.png créé avec sharp');
    });
  
  // Créer l'icône 512x512
  const svg512 = createSimplePNG(512);
  sharp(Buffer.from(svg512))
    .png()
    .resize(512, 512)
    .toFile(path.join(publicDir, 'icon-512.png'))
    .then(() => {
      console.log('✓ icon-512.png créé avec sharp');
      console.log('');
      console.log('✅ Icônes PNG créées avec succès!');
    });
    
} catch (e) {
  // Si sharp n'est pas disponible, utiliser canvas
  try {
    const { createCanvas } = require('canvas');
    
    function createIcon(size) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Fond vert
      ctx.fillStyle = '#2d8b6d';
      ctx.fillRect(0, 0, size, size);
      
      // Texte MHA
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${size * 0.4}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MHA', size / 2, size / 2);
      
      return canvas.toBuffer('image/png');
    }
    
    // Créer icon-192.png
    const icon192 = createIcon(192);
    fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
    console.log('✓ icon-192.png créé avec canvas');
    
    // Créer icon-512.png
    const icon512 = createIcon(512);
    fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);
    console.log('✓ icon-512.png créé avec canvas');
    console.log('');
    console.log('✅ Icônes PNG créées avec succès!');
    
  } catch (e2) {
    // Si ni sharp ni canvas ne sont disponibles
    console.log('⚠️  Les modules sharp ou canvas ne sont pas installés.');
    console.log('');
    console.log('Pour créer les icônes PNG, installez canvas:');
    console.log('  npm install canvas');
    console.log('');
    console.log('Ou utilisez un outil en ligne pour convertir les SVG en PNG:');
    console.log('  - https://convertio.co/svg-png/');
    console.log('  - https://cloudconvert.com/svg-to-png');
    console.log('');
    console.log('Les fichiers SVG sont disponibles dans public/icon-192.svg et public/icon-512.svg');
    process.exit(1);
  }
}

