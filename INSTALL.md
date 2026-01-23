# Guide d'installation détaillé

## 🔧 Prérequis système

### Windows
- Windows 10 ou supérieur
- Node.js 16.x ou supérieur
- PostgreSQL 13.x ou supérieur

### Vérifier les installations
```powershell
node --version
npm --version
psql --version
```

## 📥 Installation complète

### 1. Installation de Node.js (si nécessaire)

Télécharger depuis : https://nodejs.org/
- Choisir la version LTS
- Installer avec les options par défaut

### 2. Installation de PostgreSQL (si nécessaire)

Télécharger depuis : https://www.postgresql.org/download/windows/
- Choisir PostgreSQL 15 ou supérieur
- Installer avec les options par défaut
- Noter le mot de passe de l'utilisateur `postgres`

### 3. Configuration de la base de données

Ouvrir PowerShell en tant qu'administrateur :

```powershell
# Se connecter à PostgreSQL
psql -U postgres

# Dans psql, exécuter :
CREATE DATABASE suivi_pam_mha;
\q
```

Créer les tables :
```powershell
cd c:\ASBB\MHA\POC\SUIVI
psql -U postgres -d suivi_pam_mha -f database\schema.sql
```

### 4. Configuration du projet

```powershell
# Naviguer vers le projet
cd c:\ASBB\MHA\POC\SUIVI

# Installer les dépendances
npm install
```

### 5. Configuration de l'environnement

Créer le fichier `.env` à la racine du projet :

```env
# Configuration serveur
PORT=3000
NODE_ENV=development
PUBLIC_URL=http://localhost:3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=suivi_pam_mha
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_postgres

# JWT (générer un secret aléatoire)
JWT_SECRET=votre_secret_jwt_tres_long_et_aleatoire
JWT_EXPIRATION=24h

# API externe (générer une clé aléatoire)
EXTERNAL_API_KEY=votre_cle_api_externe_aleatoire

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Pour générer des secrets aléatoires :
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 6. Démarrage de l'application

```powershell
# Démarrage normal
npm start

# Ou en mode développement avec auto-reload
npm run dev
```

L'application sera accessible sur : http://localhost:3000

### 7. Première connexion

- **URL** : http://localhost:3000/login.html
- **Username** : `admin`
- **Mot de passe** : `admin123`

⚠️ **IMPORTANT** : Changez immédiatement ce mot de passe !

## 🔐 Sécurité - Première configuration

### 1. Changer le mot de passe admin

Une fois connecté :
1. Aller dans les paramètres du profil
2. Changer le mot de passe par défaut

Ou via SQL :
```sql
-- Se connecter à la base
psql -U postgres -d suivi_pam_mha

-- Générer un nouveau hash de mot de passe
-- (utiliser bcrypt avec un coût de 10)
UPDATE users 
SET "passwordHash" = '$2b$10$...' 
WHERE username = 'admin';
```

### 2. Créer les premiers utilisateurs

Depuis l'interface d'administration (compte Admin) :
- Créer le compte du Ministre
- Créer le compte du Directeur de Cabinet
- Créer les comptes des Directeurs avec leurs programmes respectifs

## 📊 Importer les données du PAM

Les données peuvent être importées :

### Option 1 : Via l'interface web
- Se connecter en tant qu'Admin ou Directeur de Cabinet
- Cliquer sur "Nouvelle action"
- Remplir les informations de chaque action

### Option 2 : Via script SQL
Créer un fichier `import_actions.sql` :

```sql
INSERT INTO actions (programme, intitule, responsable, echeance, tauxPhysique, tauxFinancier, statut) 
VALUES 
('Programme d''Accès Sécurisé à l''Eau Multiusages (PASEM)', 
 'Projet de Réalisation d''une Unité de Dessalement d''Eau de Mer',
 'Direction de l''Exploitation',
 '2026-12-31',
 50.0,
 45.0,
 'En cours'),
-- Ajouter les autres actions...
;
```

Puis exécuter :
```powershell
psql -U postgres -d suivi_pam_mha -f import_actions.sql
```

### Option 3 : Via l'API externe
Utiliser un script pour importer depuis Excel/CSV :

```javascript
// import.js
const fs = require('fs');
const axios = require('axios');

const API_KEY = 'votre_cle_api';
const API_URL = 'http://localhost:3000/api/external';

async function importAction(action) {
  try {
    const response = await axios.post(`${API_URL}/actions`, action, {
      headers: { 'x-api-key': API_KEY }
    });
    console.log('Action importée:', response.data.id);
  } catch (error) {
    console.error('Erreur:', error.response?.data || error.message);
  }
}

// Charger les données et importer
// ...
```

## 🌐 Configuration pour accès réseau local

Pour permettre l'accès depuis d'autres machines du réseau :

### 1. Modifier `.env`
```env
PUBLIC_URL=http://192.168.1.100:3000
CORS_ALLOWED_ORIGINS=http://192.168.1.100:3000
```
(Remplacer par votre adresse IP locale)

### 2. Configurer le pare-feu Windows
```powershell
# Autoriser le port 3000
New-NetFirewallRule -DisplayName "Suivi PAM MHA" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 3. Redémarrer le serveur

Les utilisateurs du réseau pourront accéder via : `http://192.168.1.100:3000`

## 🚨 Résolution de problèmes

### Erreur de connexion à PostgreSQL
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution** : Vérifier que PostgreSQL est démarré
```powershell
# Vérifier le service
Get-Service postgresql*

# Démarrer si nécessaire
Start-Service postgresql-x64-15
```

### Erreur "bcrypt not found"
```
Error: Cannot find module 'bcrypt'
```
**Solution** : Réinstaller les dépendances
```powershell
npm install
```

### Port 3000 déjà utilisé
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution** : Changer le port dans `.env` ou tuer le processus
```powershell
# Trouver le processus
netstat -ano | findstr :3000

# Tuer le processus (remplacer PID)
taskkill /PID 1234 /F
```

### Tables non créées
**Solution** : Vérifier que le schéma a été exécuté
```powershell
psql -U postgres -d suivi_pam_mha -c "\dt"
```

Si les tables n'apparaissent pas :
```powershell
psql -U postgres -d suivi_pam_mha -f database\schema.sql
```

## ✅ Vérification de l'installation

L'installation est réussie si :

1. ✅ Le serveur démarre sans erreur
2. ✅ La page de login s'affiche
3. ✅ La connexion avec admin/admin123 fonctionne
4. ✅ Le dashboard s'affiche (même vide)
5. ✅ Vous pouvez créer une nouvelle action

## 📞 Support

En cas de problème persistant, vérifier :
- Les logs du serveur dans la console
- Les logs PostgreSQL
- Les erreurs dans la console du navigateur (F12)

