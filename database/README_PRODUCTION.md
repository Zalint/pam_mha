# 🚀 Fichiers de Déploiement Production - MHA PAM 2026

## 📦 Fichiers disponibles

### 1. `production_schema.sql` ✅
**Schéma complet de la base de données**

Contient :
- 4 tables : `users`, `userAssignments`, `actions`, `historique`
- Tous les index de performance
- Les triggers et fonctions
- Les contraintes de données
- Un utilisateur admin par défaut (⚠️ à changer)

**Quand l'utiliser ?**
- Première fois que vous créez la base de données en production
- Pour recréer une base vierge

### 2. `production_seed.sql` ✅
**Données actuelles de votre environnement local**

Généré automatiquement et contient :
- ✅ **1 utilisateur** (Salmone)
- ✅ **1 assignation utilisateur**
- ✅ **32 actions** du PAM
- ✅ **0 entrées d'historique**

**Quand l'utiliser ?**
- Après avoir exécuté `production_schema.sql`
- Pour importer vos données locales en production

### 3. `export_seed.js` 🔄
**Script d'export des données locales**

Utilisez ce script pour :
- Regénérer `production_seed.sql` avec les données actuelles
- Mettre à jour le seed si vous ajoutez/modifiez des données localement

**Comment l'utiliser ?**
```bash
node database/export_seed.js
```

---

## 🎯 Processus de Déploiement Complet

### Étape 1 : Préparer les fichiers (LOCAL)

```bash
# Si vous voulez regénérer le seed avec les dernières données
node database/export_seed.js
```

✅ Résultat : fichier `production_seed.sql` mis à jour

### Étape 2 : Transférer les fichiers (LOCAL → SERVEUR)

Copiez ces 2 fichiers vers votre serveur de production :
- `production_schema.sql`
- `production_seed.sql`

```bash
# Exemple avec scp
scp database/production_schema.sql user@serveur:/path/to/sql/
scp database/production_seed.sql user@serveur:/path/to/sql/
```

### Étape 3 : Créer la base de données (SERVEUR)

```bash
# Se connecter à PostgreSQL
psql -h localhost -U postgres

# Créer la base de données
CREATE DATABASE mha_pam_production;

# Créer un utilisateur dédié
CREATE USER mha_user WITH PASSWORD 'mot_de_passe_fort';

# Donner les droits
GRANT ALL PRIVILEGES ON DATABASE mha_pam_production TO mha_user;

# Se déconnecter
\q

# Se reconnecter à la nouvelle base
psql -h localhost -U mha_user -d mha_pam_production
```

### Étape 4 : Exécuter le schéma (SERVEUR)

```bash
# Option A : Depuis psql
\i /path/to/sql/production_schema.sql

# Option B : Depuis le shell
psql -h localhost -U mha_user -d mha_pam_production -f /path/to/sql/production_schema.sql
```

✅ Vérification :
```sql
-- Lister les tables
\dt

-- Résultat attendu :
-- users
-- userassignments
-- actions
-- historique
```

### Étape 5 : Exécuter le seed (SERVEUR)

```bash
# Option A : Depuis psql
\i /path/to/sql/production_seed.sql

# Option B : Depuis le shell
psql -h localhost -U mha_user -d mha_pam_production -f /path/to/sql/production_seed.sql
```

✅ Vérification :
```sql
-- Compter les données
SELECT 
  (SELECT COUNT(*) FROM users) as nb_users,
  (SELECT COUNT(*) FROM userAssignments) as nb_assignments,
  (SELECT COUNT(*) FROM actions) as nb_actions,
  (SELECT COUNT(*) FROM historique) as nb_historique;

-- Résultat attendu :
-- nb_users: 2 (admin + Salmone)
-- nb_assignments: 1
-- nb_actions: 32
-- nb_historique: 0
```

### Étape 6 : Sécuriser (SERVEUR)

```bash
# Se connecter à l'application web et changer le mot de passe admin
# URL: https://votre-domaine.com/login
# User: admin
# Pass: admin123 (TEMPORAIRE!)
```

⚠️ **IMPORTANT** : Changez immédiatement le mot de passe admin !

---

## 🔐 Configuration de l'Application

### Fichier `.env` en production

Créez un fichier `.env` sur le serveur :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mha_pam_production
DB_USER=mha_user
DB_PASSWORD=votre_mot_de_passe_fort

# JWT
JWT_SECRET=un_secret_très_long_et_aléatoire_123456789
JWT_EXPIRATION=24h

# Serveur
NODE_ENV=production
PORT=3000
PUBLIC_URL=https://votre-domaine.com

# API externe (pour intégrations)
API_KEY=votre_api_key_externe_123456

# CORS
CORS_ALLOWED_ORIGINS=https://votre-domaine.com
```

### Démarrer l'application

```bash
# Installation des dépendances
npm install --production

# Démarrer avec PM2 (recommandé)
npm install -g pm2
pm2 start server.js --name mha-pam
pm2 save
pm2 startup

# Vérifier le statut
pm2 status
pm2 logs mha-pam
```

---

## ✅ Checklist de Validation

Avant de considérer le déploiement comme réussi :

### Base de données
- [ ] Les 4 tables sont créées
- [ ] Les index sont créés
- [ ] Les triggers fonctionnent
- [ ] L'utilisateur admin existe
- [ ] Les 32 actions sont importées
- [ ] L'utilisateur Salmone existe avec son assignation

### Application
- [ ] L'application démarre sans erreur
- [ ] La connexion à la base de données fonctionne
- [ ] Le login admin/admin123 fonctionne
- [ ] Le mot de passe admin a été changé
- [ ] La page principale affiche les 32 actions
- [ ] Les filtres fonctionnent
- [ ] La modification d'une action fonctionne
- [ ] L'historique se remplit correctement

### Sécurité
- [ ] HTTPS est activé (certificat SSL)
- [ ] Le mot de passe admin par défaut a été changé
- [ ] Les mots de passe sont stockés hashés
- [ ] JWT_SECRET est unique et fort
- [ ] API_KEY est unique et fort
- [ ] Les variables d'environnement ne sont pas committées
- [ ] Le firewall autorise uniquement les ports nécessaires

### Performance & Monitoring
- [ ] Les logs sont configurés
- [ ] Le monitoring est en place (PM2, New Relic, etc.)
- [ ] Les backups automatiques sont configurés
- [ ] Un plan de rollback existe

---

## 📊 Statistiques de votre déploiement

Votre base de données contient actuellement :

| Table | Nombre d'entrées |
|-------|------------------|
| **users** | 2 (admin + Salmone) |
| **userAssignments** | 1 (Salmone : accès total) |
| **actions** | 32 actions du PAM 2026 |
| **historique** | 0 (sera rempli automatiquement) |

### Répartition des actions par programme :

- **Programme d'Accès Sécurisé à l'Eau Multiusages (PASEM)** : 5 actions
- **Programme Intermédiaire AEP Dakar 2024-2026** : 6 actions
- **Programme d'Assainissement Stratégique** : ~21 actions

### Statuts des actions :

- **À démarrer** : ~25 actions
- **En cours** : ~7 actions
- **En retard** : 0 action
- **Achevé** : 0 action

---

## 🆘 En cas de problème

### Problème : Tables déjà existantes

```sql
-- Supprimer toutes les tables (⚠️ DANGER!)
DROP TABLE IF EXISTS historique CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS userAssignments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Puis réexécuter production_schema.sql
```

### Problème : Données dupliquées

```sql
-- Vider les tables (⚠️ DANGER!)
TRUNCATE TABLE historique, actions, userAssignments, users RESTART IDENTITY CASCADE;

-- Puis réexécuter production_seed.sql
```

### Problème : Connexion impossible

Vérifiez :
1. PostgreSQL est démarré : `sudo systemctl status postgresql`
2. Le firewall autorise le port 5432 : `sudo ufw status`
3. Le fichier `pg_hba.conf` autorise la connexion
4. Les credentials dans `.env` sont corrects

### Problème : L'application ne démarre pas

```bash
# Vérifier les logs
pm2 logs mha-pam

# Vérifier le fichier .env
cat .env

# Tester la connexion DB
node test-db.js
```

---

## 📞 Support

Pour plus d'informations, consultez :
- **[DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md)** : guide détaillé étape par étape
- **[../README.md](../README.md)** : documentation générale
- **[../INSTALL.md](../INSTALL.md)** : guide d'installation

---

## 🎉 Félicitations !

Si tous les tests sont au vert, votre application MHA PAM 2026 est maintenant en production ! 🚀

**URLs importantes :**
- Application web : `https://votre-domaine.com`
- API interne : `https://votre-domaine.com/api`
- API externe : `https://votre-domaine.com/api/external`

**Prochaines étapes :**
1. Former les utilisateurs
2. Ajouter d'autres utilisateurs (Ministre, Directeurs)
3. Mettre à jour les actions selon l'avancement réel
4. Configurer les backups réguliers
5. Mettre en place un monitoring

**Bonne utilisation !** 🎯

