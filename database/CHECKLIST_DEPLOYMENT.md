# ✅ Checklist de Déploiement en Production
## MHA PAM 2026

---

## 📦 Avant le Déploiement (LOCAL)

### Préparation des fichiers
- [ ] Vérifier que PostgreSQL local est démarré
- [ ] Vérifier que toutes les données locales sont à jour
- [ ] Exécuter `node database/export_seed.js` (ou `powershell database/generate-production-files.ps1`)
- [ ] Vérifier que `production_schema.sql` existe
- [ ] Vérifier que `production_seed.sql` est généré
- [ ] Ouvrir et valider le contenu de `production_seed.sql`

### Vérification des données
- [ ] Nombre d'utilisateurs correct dans le seed
- [ ] Nombre d'actions correct (actuellement 32)
- [ ] Pas de données de test non désirées
- [ ] Tous les mots de passe sont hashés (pas en clair)

### Préparation de la configuration
- [ ] Préparer le fichier `.env` de production (voir modèle ci-dessous)
- [ ] Générer un `JWT_SECRET` fort et aléatoire
- [ ] Générer une `API_KEY` forte et aléatoire
- [ ] Noter les credentials de la base de données de production

---

## 🚀 Déploiement sur le Serveur (PRODUCTION)

### Étape 1 : Accès au serveur
- [ ] Se connecter au serveur de production (SSH ou RDP)
- [ ] Vérifier que PostgreSQL est installé et démarré
- [ ] Vérifier que Node.js est installé (version 14+)
- [ ] Vérifier l'espace disque disponible

### Étape 2 : Préparation de la base de données
- [ ] Se connecter à PostgreSQL
- [ ] Créer la base de données : `CREATE DATABASE mha_pam_production;`
- [ ] Créer un utilisateur dédié avec mot de passe fort
- [ ] Accorder les droits sur la base de données
- [ ] Tester la connexion avec le nouvel utilisateur

### Étape 3 : Import du schéma
- [ ] Copier `production_schema.sql` vers le serveur
- [ ] Exécuter le script : `psql -U user -d mha_pam_production -f production_schema.sql`
- [ ] Vérifier qu'il n'y a pas d'erreurs
- [ ] Lister les tables : `\dt` (doit montrer 4 tables)
- [ ] Vérifier les index : `\di`

### Étape 4 : Import des données
- [ ] Copier `production_seed.sql` vers le serveur
- [ ] Exécuter le script : `psql -U user -d mha_pam_production -f production_seed.sql`
- [ ] Vérifier qu'il n'y a pas d'erreurs
- [ ] Compter les lignes dans chaque table
- [ ] Vérifier quelques actions au hasard

---

## 🔧 Configuration de l'Application (PRODUCTION)

### Déploiement du code
- [ ] Copier le code source vers le serveur
- [ ] Installer les dépendances : `npm install --production`
- [ ] Créer le fichier `.env` (voir modèle ci-dessous)
- [ ] Vérifier les permissions des fichiers
- [ ] Vérifier que le dossier `public/` est accessible

### Configuration du serveur web
- [ ] Installer Nginx ou Apache (si nécessaire)
- [ ] Configurer le reverse proxy vers Node.js (port 3000)
- [ ] Configurer le certificat SSL (Let's Encrypt recommandé)
- [ ] Configurer les logs
- [ ] Tester la configuration : `nginx -t`

### Démarrage de l'application
- [ ] Installer PM2 : `npm install -g pm2`
- [ ] Démarrer l'app : `pm2 start server.js --name mha-pam`
- [ ] Configurer PM2 au démarrage : `pm2 startup`
- [ ] Sauvegarder la config PM2 : `pm2 save`
- [ ] Vérifier les logs : `pm2 logs mha-pam`
- [ ] Vérifier le statut : `pm2 status`

---

## 🔐 Sécurité (PRODUCTION)

### Sécurisation de la base de données
- [ ] Le mot de passe PostgreSQL est fort
- [ ] PostgreSQL n'écoute que sur localhost (ou IP privée)
- [ ] Le fichier `pg_hba.conf` est correctement configuré
- [ ] Les backups automatiques sont configurés

### Sécurisation de l'application
- [ ] Changer le mot de passe admin par défaut (**CRITIQUE**)
- [ ] JWT_SECRET est unique et fort (32+ caractères)
- [ ] API_KEY est unique et forte (32+ caractères)
- [ ] Le fichier `.env` n'est pas accessible publiquement
- [ ] Les logs ne contiennent pas de secrets
- [ ] CORS est correctement configuré
- [ ] HTTPS est forcé (redirection HTTP → HTTPS)

### Firewall et réseau
- [ ] Firewall activé sur le serveur
- [ ] Port 22 (SSH) : accès limité par IP si possible
- [ ] Port 80 (HTTP) : ouvert pour redirection vers HTTPS
- [ ] Port 443 (HTTPS) : ouvert
- [ ] Port 5432 (PostgreSQL) : fermé au public
- [ ] Port 3000 (Node.js) : accessible uniquement en local

---

## ✅ Tests de Validation (PRODUCTION)

### Tests de la base de données
- [ ] Test de connexion : `psql -U user -d mha_pam_production`
- [ ] Compter les utilisateurs : `SELECT COUNT(*) FROM users;`
- [ ] Compter les actions : `SELECT COUNT(*) FROM actions;`
- [ ] Tester une requête complexe (avec jointure)
- [ ] Vérifier les triggers (modifier une action et voir `updatedAt`)

### Tests de l'application
- [ ] L'application démarre sans erreur
- [ ] La page d'accueil se charge : `https://votre-domaine.com`
- [ ] Le login fonctionne : `admin` / `admin123`
- [ ] La page principale affiche les actions
- [ ] Les filtres fonctionnent
- [ ] Modifier une action fonctionne
- [ ] L'historique se remplit correctement
- [ ] Se déconnecter fonctionne
- [ ] PWA installable (manifest.json)

### Tests de l'API
- [ ] Test login API : `POST /api/auth/login`
- [ ] Test récupération actions : `GET /api/actions`
- [ ] Test modification action : `PUT /api/actions/:id`
- [ ] Test historique : `GET /api/actions/:id/historique`
- [ ] Test API externe : `GET /api/external/actions` (avec x-api-key)

### Tests de sécurité
- [ ] Le mot de passe admin a été changé
- [ ] Impossible d'accéder à l'API sans JWT
- [ ] Impossible d'accéser à l'API externe sans x-api-key
- [ ] Les tokens JWT expirent correctement
- [ ] Les mots de passe sont hashés en base
- [ ] XSS : tester avec `<script>alert('XSS')</script>` dans un champ
- [ ] SQL Injection : tester avec `' OR '1'='1` dans un champ

---

## 📊 Monitoring et Maintenance (POST-DÉPLOIEMENT)

### Configuration du monitoring
- [ ] PM2 monitoring activé : `pm2 monitor`
- [ ] Logs centralisés configurés
- [ ] Alertes configurées (email/SMS)
- [ ] Monitoring des ressources (CPU, RAM, disque)
- [ ] Monitoring de la base de données

### Backups
- [ ] Backup quotidien de la base de données configuré
- [ ] Test de restauration d'un backup
- [ ] Backup du code source
- [ ] Backup du fichier `.env`
- [ ] Plan de reprise d'activité (PRA) documenté

### Documentation
- [ ] Documenter les URLs de production
- [ ] Documenter les credentials (dans un gestionnaire sécurisé)
- [ ] Documenter la procédure de backup/restore
- [ ] Documenter la procédure de rollback
- [ ] Former les administrateurs

---

## 👥 Formation des Utilisateurs

### Création des comptes utilisateurs
- [ ] Créer le compte "Ministre"
- [ ] Créer les comptes "Directeur" (un par programme)
- [ ] Assigner les programmes aux Directeurs
- [ ] Tester la connexion de chaque utilisateur
- [ ] Vérifier les droits de chaque utilisateur

### Formation
- [ ] Former les utilisateurs à la connexion
- [ ] Former à la consultation des actions
- [ ] Former à la modification des actions
- [ ] Former aux filtres avancés
- [ ] Former à la gestion des utilisateurs (Admin)
- [ ] Distribuer la documentation utilisateur

---

## 🎯 Modèle de fichier `.env` de production

```env
# ============================================================================
# CONFIGURATION PRODUCTION - MHA PAM 2026
# ============================================================================

# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mha_pam_production
DB_USER=mha_user
DB_PASSWORD=MOT_DE_PASSE_FORT_ICI_123456

# JWT (générer avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=GENERER_UN_SECRET_ALEATOIRE_DE_32_CARACTERES_MINIMUM
JWT_EXPIRATION=24h

# Serveur
NODE_ENV=production
PORT=3000
PUBLIC_URL=https://votre-domaine.com

# API externe (générer avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
API_KEY=GENERER_UNE_API_KEY_ALEATOIRE_DE_32_CARACTERES_MINIMUM

# CORS
CORS_ALLOWED_ORIGINS=https://votre-domaine.com

# Logs (optionnel)
LOG_LEVEL=info
LOG_FILE=/var/log/mha-pam/app.log
```

---

## 🆘 Contacts d'Urgence

En cas de problème critique :

- **Administrateur système** : _____________________________
- **DBA PostgreSQL** : _____________________________
- **Développeur** : _____________________________
- **Responsable IT** : _____________________________

---

## 📅 Post-Déploiement

### Dans les 24 heures
- [ ] Surveiller les logs
- [ ] Vérifier les performances
- [ ] Tester tous les cas d'usage principaux
- [ ] Collecter les retours utilisateurs

### Dans la semaine
- [ ] Vérifier que les backups fonctionnent
- [ ] Analyser les métriques de performance
- [ ] Ajuster la configuration si nécessaire
- [ ] Planifier une réunion de retour d'expérience

### Dans le mois
- [ ] Mettre à jour la documentation
- [ ] Former les utilisateurs avancés
- [ ] Planifier les évolutions futures
- [ ] Optimiser les performances si nécessaire

---

## ✅ Validation Finale

**Date du déploiement** : _____ / _____ / _____

**Validé par** :
- [ ] Administrateur système : _____________________________
- [ ] Responsable technique : _____________________________
- [ ] Responsable métier : _____________________________

**Notes** :
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**🎉 Félicitations ! Votre application est maintenant en production !**

