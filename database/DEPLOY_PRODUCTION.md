# 🚀 Guide de Déploiement en Production - MHA PAM 2026

## 📋 Vue d'ensemble

Ce guide explique comment déployer l'application en production en deux étapes :
1. **Création du schéma** : tables, index, triggers, etc.
2. **Import des données** : seed avec les données actuelles de l'environnement local

---

## ✅ Prérequis

- Accès à un serveur PostgreSQL en production
- Droits d'administration sur la base de données
- Node.js installé localement (pour générer le seed)
- Accès SSH ou interface d'administration de la base de données

---

## 🔧 Étape 1 : Générer le seed depuis l'environnement local

### 1.1 Exécuter le script d'export

Depuis votre environnement local (où se trouvent vos données actuelles) :

```bash
node database/export_seed.js
```

Ce script va :
- Se connecter à votre base de données locale
- Extraire toutes les données (users, userAssignments, actions, historique)
- Générer le fichier `database/production_seed.sql`

### 1.2 Vérifier le fichier généré

Ouvrez `database/production_seed.sql` et vérifiez que :
- Le nombre de lignes correspond à vos attentes
- Les données sensibles (mots de passe) sont bien hashées
- Aucune donnée de test ne doit être importée

---

## 🗄️ Étape 2 : Créer le schéma en production

### 2.1 Se connecter à la base de données de production

**Option A : Via psql**
```bash
psql -h <host_production> -U <user_production> -d <database_production>
```

**Option B : Via un outil GUI**
- pgAdmin, DBeaver, TablePlus, etc.

### 2.2 Exécuter le script de schéma

```sql
\i database/production_schema.sql
```

Ou copiez-collez le contenu du fichier dans votre interface.

### 2.3 Vérifier la création

```sql
-- Vérifier que toutes les tables sont créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Résultat attendu :
-- users
-- userAssignments
-- actions
-- historique
```

---

## 📊 Étape 3 : Importer les données

### 3.1 Exécuter le script de seed

```sql
\i database/production_seed.sql
```

Ou copiez-collez le contenu du fichier.

### 3.2 Vérifier l'import

```sql
-- Compter les utilisateurs
SELECT COUNT(*) FROM users;

-- Compter les assignations
SELECT COUNT(*) FROM userAssignments;

-- Compter les actions
SELECT COUNT(*) FROM actions;

-- Compter l'historique
SELECT COUNT(*) FROM historique;

-- Vérifier un utilisateur admin existe
SELECT username, fullName, role FROM users WHERE role = 'Admin';
```

---

## 🔐 Étape 4 : Sécurité post-déploiement

### 4.1 Changer le mot de passe admin par défaut

Le schéma crée un utilisateur `admin` avec le mot de passe `admin123`.

**⚠️ IMPORTANT : Changez ce mot de passe IMMÉDIATEMENT !**

Deux options :

**Option A : Depuis l'interface web**
1. Connectez-vous avec `admin` / `admin123`
2. Allez dans "Gestion des utilisateurs"
3. Modifiez le mot de passe

**Option B : Via SQL**
```sql
-- Générer un nouveau hash depuis votre environnement local
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('NOUVEAU_MOT_DE_PASSE_FORT', 10).then(console.log);"

-- Puis en production
UPDATE users 
SET passwordHash = 'HASH_GÉNÉRÉ_CI-DESSUS' 
WHERE username = 'admin';
```

### 4.2 Créer un utilisateur ministre/directeur

Si vous n'avez pas encore d'utilisateurs métier, créez-en via l'interface ou SQL :

```sql
-- Exemple : créer un utilisateur Ministre
INSERT INTO users (username, passwordHash, fullName, role, isActive)
VALUES (
  'ministre',
  '$2b$10$...', -- générez un hash sécurisé
  'Ministre de l\'Hydraulique et de l\'Assainissement',
  'Ministre',
  TRUE
);
```

---

## 🔍 Étape 5 : Tests de validation

### 5.1 Test de connexion

```bash
curl -X POST https://votre-domaine.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"NOUVEAU_MOT_DE_PASSE"}'
```

Résultat attendu : un token JWT

### 5.2 Test de récupération des actions

```bash
curl https://votre-domaine.com/api/actions \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"
```

Résultat attendu : la liste des actions

### 5.3 Test de l'historique

```bash
curl https://votre-domaine.com/api/actions/1/historique \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"
```

---

## 🌐 Étape 6 : Configuration de l'application

### 6.1 Variables d'environnement en production

Configurez votre fichier `.env` en production :

```env
# Base de données
DB_HOST=<host_production>
DB_PORT=5432
DB_NAME=<database_production>
DB_USER=<user_production>
DB_PASSWORD=<password_production>

# JWT
JWT_SECRET=<secret_fort_et_unique>
JWT_EXPIRATION=24h

# Serveur
NODE_ENV=production
PORT=3000
PUBLIC_URL=https://votre-domaine.com

# API externe
API_KEY=<votre_api_key_externe>

# CORS
CORS_ALLOWED_ORIGINS=https://votre-domaine.com
```

### 6.2 Démarrer l'application

```bash
# Mode production
NODE_ENV=production node server.js

# Ou avec PM2 (recommandé)
pm2 start server.js --name mha-pam
pm2 save
pm2 startup
```

---

## 📝 Checklist finale

Avant de mettre en production, vérifiez :

- [ ] Le schéma SQL a été exécuté avec succès
- [ ] Le seed SQL a été exécuté avec succès
- [ ] Toutes les tables contiennent les données attendues
- [ ] Le mot de passe admin par défaut a été changé
- [ ] Les variables d'environnement sont correctement configurées
- [ ] Les certificats SSL sont configurés (HTTPS)
- [ ] Le firewall autorise uniquement les ports nécessaires
- [ ] Les backups automatiques sont configurés
- [ ] Le monitoring est en place
- [ ] Les logs sont configurés
- [ ] L'application démarre correctement
- [ ] Les tests de connexion fonctionnent
- [ ] Les tests des endpoints API fonctionnent

---

## 🆘 Dépannage

### Erreur : "relation does not exist"

➡️ Le schéma n'a pas été exécuté correctement. Réexécutez `production_schema.sql`

### Erreur : "duplicate key value"

➡️ Des données existent déjà. Options :
- Supprimez les données existantes : `TRUNCATE TABLE users, userAssignments, actions, historique CASCADE;`
- Ou modifiez le script de seed pour gérer les conflits

### Erreur : "permission denied"

➡️ L'utilisateur PostgreSQL n'a pas les droits suffisants. Accordez les droits :
```sql
GRANT ALL PRIVILEGES ON DATABASE <database_production> TO <user_production>;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO <user_production>;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO <user_production>;
```

### Les séquences ne fonctionnent pas

➡️ Réinitialisez manuellement les séquences :
```sql
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users) + 1);
SELECT setval('userassignments_id_seq', (SELECT MAX(id) FROM userAssignments) + 1);
SELECT setval('actions_id_seq', (SELECT MAX(id) FROM actions) + 1);
SELECT setval('historique_id_seq', (SELECT MAX(id) FROM historique) + 1);
```

---

## 📞 Support

Pour toute question ou problème lors du déploiement, consultez :
- `README.md` : documentation générale
- `INSTALL.md` : guide d'installation
- `DESIGN_*.md` : documentation technique

---

## 🔄 Rollback

En cas de problème majeur, pour revenir en arrière :

```sql
-- Supprimer toutes les données (ATTENTION!)
DROP TABLE IF EXISTS historique CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS userAssignments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

Puis réexécutez les scripts depuis le début.

---

**✅ Bonne mise en production !**

