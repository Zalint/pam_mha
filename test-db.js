// Script de test de connexion à la base de données
require('dotenv').config();
const pool = require('./config/database');

async function testConnection() {
  try {
    console.log('Test de connexion à la base de données...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NON DÉFINI');
    console.log('');

    // Test de connexion
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✓ Connexion réussie !');
    console.log('Heure serveur:', result.rows[0].current_time);
    console.log('');

    // Vérifier si la table users existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✓ Table users existe');
      
      // Vérifier l'utilisateur admin
      const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
      
      if (userCheck.rows.length > 0) {
        console.log('✓ Utilisateur admin trouvé');
        console.log('  ID:', userCheck.rows[0].id);
        console.log('  Username:', userCheck.rows[0].username);
        console.log('  FullName:', userCheck.rows[0].fullname);
        console.log('  Role:', userCheck.rows[0].role);
        console.log('  PasswordHash:', userCheck.rows[0].passwordhash ? 'Défini' : 'Non défini');
      } else {
        console.log('✗ Utilisateur admin NON trouvé');
        console.log('  → Création de l\'utilisateur admin...');
        
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash('admin123', 10);
        
        await pool.query(
          `INSERT INTO users (username, "passwordHash", "fullName", role) 
           VALUES ($1, $2, $3, $4)`,
          ['admin', passwordHash, 'Administrateur', 'Admin']
        );
        
        console.log('✓ Utilisateur admin créé avec succès');
      }
    } else {
      console.log('✗ Table users n\'existe pas');
      console.log('  → Exécutez: psql -U postgres -d suivi_pam_mha -f database\\schema.sql');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Erreur:', error.message);
    console.error('Détails:', error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();

