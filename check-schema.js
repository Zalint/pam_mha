require('dotenv').config();
const pool = require('./config/database');

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Colonnes de la table users:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} : ${row.data_type}`);
    });
    
    // Tester une requête SELECT sur la table users
    console.log('\nTest SELECT sur users:');
    const userResult = await pool.query('SELECT * FROM users WHERE id = 1');
    if (userResult.rows[0]) {
      console.log('User admin trouvé:');
      console.log('  Keys:', Object.keys(userResult.rows[0]).join(', '));
      console.log('  isactive:', userResult.rows[0].isactive);
      console.log('  fullname:', userResult.rows[0].fullname);
    }
    
    pool.end();
  } catch (error) {
    console.error('Erreur:', error.message);
    pool.end();
  }
}

checkSchema();

