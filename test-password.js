// Test du hash du mot de passe admin
const bcrypt = require('bcrypt');

const hashFromDB = '$2b$10$rBV2KJ9k3HhXQVxDfZQf5.6kxJZ4pKGqmJ3XRgQl5KGMqxqFZqYqK';
const password = 'admin123';

console.log('Test du mot de passe admin...');
console.log('Hash dans la base:', hashFromDB);
console.log('Mot de passe testé:', password);
console.log('');

bcrypt.compare(password, hashFromDB, (err, result) => {
  if (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
  
  if (result) {
    console.log('✓ Le mot de passe "admin123" correspond au hash !');
  } else {
    console.log('✗ Le mot de passe "admin123" NE correspond PAS au hash !');
    console.log('');
    console.log('→ Génération d\'un nouveau hash pour "admin123"...');
    
    bcrypt.hash(password, 10, (err, newHash) => {
      if (err) {
        console.error('Erreur:', err);
        process.exit(1);
      }
      
      console.log('Nouveau hash:', newHash);
      console.log('');
      console.log('→ Mettez à jour la base de données avec ce hash:');
      console.log(`UPDATE users SET "passwordHash" = '${newHash}' WHERE username = 'admin';`);
    });
  }
});

