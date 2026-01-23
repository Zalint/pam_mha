/**
 * Script pour créer un nouvel utilisateur
 * 
 * Usage : node scripts/create-user.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createUser() {
  console.log('=== Création d\'un nouvel utilisateur ===\n');

  try {
    const username = await question('Nom d\'utilisateur : ');
    const fullName = await question('Nom complet : ');
    
    console.log('\nRôles disponibles :');
    console.log('  1. Ministre');
    console.log('  2. Directeur de Cabinet');
    console.log('  3. Directeur');
    console.log('  4. Admin');
    const roleChoice = await question('\nChoisir le rôle (1-4) : ');
    
    const roles = ['Ministre', 'Directeur de Cabinet', 'Directeur', 'Admin'];
    const role = roles[parseInt(roleChoice) - 1];

    if (!role) {
      console.error('❌ Rôle invalide');
      rl.close();
      process.exit(1);
    }

    let programme = null;
    if (role === 'Directeur') {
      programme = await question('Programme de responsabilité : ');
    }

    const password = await question('Mot de passe : ');

    if (password.length < 6) {
      console.error('❌ Le mot de passe doit contenir au moins 6 caractères');
      rl.close();
      process.exit(1);
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const result = await pool.query(
      `INSERT INTO users (username, "passwordHash", "fullName", role, programme) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, "fullName", role, programme`,
      [username, passwordHash, fullName, role, programme]
    );

    console.log('\n✅ Utilisateur créé avec succès !');
    console.log('\n📋 Informations :');
    console.log(`   ID : ${result.rows[0].id}`);
    console.log(`   Username : ${result.rows[0].username}`);
    console.log(`   Nom : ${result.rows[0].fullName}`);
    console.log(`   Rôle : ${result.rows[0].role}`);
    if (result.rows[0].programme) {
      console.log(`   Programme : ${result.rows[0].programme}`);
    }

  } catch (err) {
    if (err.code === '23505') {
      console.error('\n❌ Ce nom d\'utilisateur existe déjà');
    } else {
      console.error('\n❌ Erreur :', err.message);
    }
  } finally {
    rl.close();
    await pool.end();
  }
}

createUser();

