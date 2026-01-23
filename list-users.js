require('dotenv').config();
const pool = require('./config/database');

async function listUsers() {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        username, 
        fullname, 
        role, 
        isactive,
        createdat
      FROM users 
      ORDER BY id
    `);
    
    console.log('\n=== LISTE DES UTILISATEURS ===\n');
    
    if (result.rows.length === 0) {
      console.log('Aucun utilisateur trouvé.');
    } else {
      result.rows.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Nom: ${user.fullname}`);
        console.log(`  Rôle: ${user.role}`);
        console.log(`  Actif: ${user.isactive ? 'Oui' : 'Non'}`);
        console.log(`  Créé le: ${user.createdat}`);
        console.log('');
      });
      
      console.log(`Total: ${result.rows.length} utilisateur(s)`);
    }
    
    pool.end();
  } catch (error) {
    console.error('Erreur:', error.message);
    pool.end();
  }
}

listUsers();

