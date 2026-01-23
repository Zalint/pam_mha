/**
 * Script pour générer le hash du nouveau mot de passe admin
 * Nouveau mot de passe: Mha@2024@!!
 */

const bcrypt = require('bcrypt');

const newPassword = 'Mha@2024@!!';

bcrypt.hash(newPassword, 10).then(hash => {
  console.log('\n🔐 Nouveau hash généré pour le mot de passe: Mha@2024@!!\n');
  console.log('Hash bcrypt:');
  console.log(hash);
  console.log('\n📋 Commande SQL à exécuter en production:\n');
  console.log(`UPDATE users SET passwordhash = '${hash}' WHERE username = 'admin';\n`);
  console.log('✅ Exécutez cette commande sur votre base de production!\n');
});

