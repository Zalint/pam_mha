// Script pour corriger le mot de passe admin
require('dotenv').config();
const pool = require('./config/database');
const bcrypt = require('bcrypt');

async function fixPassword() {
  try {
    console.log('Correction du mot de passe admin...');
    
    // Générer un nouveau hash pour admin123
    const passwordHash = await bcrypt.hash('admin123', 10);
    console.log('Nouveau hash généré');
    
    // Mettre à jour dans la base (PostgreSQL convertit en minuscules)
    const result = await pool.query(
      `UPDATE users SET passwordhash = $1 WHERE username = 'admin' RETURNING id, username`,
      [passwordHash]
    );
    
    if (result.rows.length > 0) {
      console.log('✓ Mot de passe admin mis à jour avec succès !');
      console.log('  Utilisateur:', result.rows[0].username);
      console.log('');
      console.log('Vous pouvez maintenant vous connecter avec:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
    } else {
      console.log('✗ Utilisateur admin non trouvé');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Erreur:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixPassword();
