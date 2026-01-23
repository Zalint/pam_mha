/**
 * Script de test pour diagnostiquer le problème de login/token
 */

require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

async function makeRequest(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }
  
  return { status: response.status, data };
}

async function testLogin() {
  console.log('=== TEST DE LOGIN ===\n');
  
  try {
    // 1. Test de login
    console.log('1. Tentative de login...');
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    console.log('✓ Login réussi');
    console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
    console.log('User:', JSON.stringify(loginResponse.data.user, null, 2));
    
    const token = loginResponse.data.token;
    
    // 2. Test d'une requête avec le token
    console.log('\n2. Test requête /api/actions avec le token...');
    const actionsResponse = await makeRequest(`${BASE_URL}/api/actions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Requête actions réussie');
    console.log('Nombre d\'actions:', actionsResponse.data.length);
    
    // 3. Test /api/statistics
    console.log('\n3. Test requête /api/statistics avec le token...');
    const statsResponse = await makeRequest(`${BASE_URL}/api/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Requête statistics réussie');
    console.log('Stats:', JSON.stringify(statsResponse.data, null, 2));
    
    console.log('\n=== TOUS LES TESTS RÉUSSIS ===');
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    process.exit(1);
  }
}

// Vérifier que le serveur est démarré
console.log('Assurez-vous que le serveur est démarré (.\start.ps1)\n');

testLogin();

