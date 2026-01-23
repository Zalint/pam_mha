# 📂 Index des Fichiers de Production
## MHA PAM 2026

---

## 🎯 Vue d'Ensemble

Vous avez maintenant **TOUT** ce qu'il faut pour déployer en production !

```
database/
├── 📄 production_schema.sql       ⭐ FICHIER SQL #1 - Schéma complet
├── 📄 production_seed.sql         ⭐ FICHIER SQL #2 - Vos données actuelles
├── 🔧 export_seed.js              🔄 Script pour regénérer le seed
├── 🔧 generate-production-files.ps1 🪟 Script PowerShell Windows
├── 📖 README_PRODUCTION.md        📚 Vue d'ensemble complète
├── 📖 DEPLOY_PRODUCTION.md        📚 Guide détaillé étape par étape
├── 📖 CHECKLIST_DEPLOYMENT.md     ✅ Checklist de déploiement
└── 📖 INDEX_PRODUCTION.md         📋 Ce fichier
```

---

## 🚀 Démarrage Rapide (Quick Start)

### Option 1 : Utilisateur Windows (Recommandé)

```powershell
# Depuis le dossier racine du projet
powershell database/generate-production-files.ps1
```

Ce script va :
- ✅ Vérifier votre environnement
- ✅ Générer `production_seed.sql` avec vos données actuelles
- ✅ Afficher un résumé
- ✅ Vous guider vers les prochaines étapes

### Option 2 : Ligne de commande classique

```bash
# Générer le seed
node database/export_seed.js

# Les fichiers sont maintenant prêts dans database/
```

---

## 📄 Description des Fichiers

### 1️⃣ Fichiers SQL (À exécuter sur le serveur)

#### `production_schema.sql` ⭐
**Ce que c'est** : Le schéma complet de la base de données

**Contenu** :
- 4 tables : `users`, `userAssignments`, `actions`, `historique`
- Index de performance
- Triggers pour `updatedAt`
- Fonctions PostgreSQL
- Contraintes de données
- 1 utilisateur admin par défaut (⚠️ à changer)

**Quand l'utiliser** :
- Première création de la base en production
- Réinitialisation complète de la base

**Comment** :
```sql
psql -U postgres -d mha_pam_production -f production_schema.sql
```

---

#### `production_seed.sql` ⭐
**Ce que c'est** : Vos données actuelles exportées depuis local

**Contenu** (état actuel) :
- ✅ 1 utilisateur : Salmone (Directeur)
- ✅ 1 assignation : Salmone a accès à tout
- ✅ 32 actions du PAM 2026
- ✅ 0 entrée d'historique

**Quand l'utiliser** :
- Après avoir exécuté `production_schema.sql`
- Pour importer vos données en production

**Comment** :
```sql
psql -U postgres -d mha_pam_production -f production_seed.sql
```

**Note** : Ce fichier est généré automatiquement et change à chaque export !

---

### 2️⃣ Scripts d'Export (Outils)

#### `export_seed.js` 🔄
**Ce que c'est** : Script Node.js pour exporter vos données locales

**Ce qu'il fait** :
1. Se connecte à votre base locale
2. Extrait toutes les données (users, actions, etc.)
3. Génère le fichier `production_seed.sql`

**Quand l'utiliser** :
- Avant chaque déploiement
- Quand vous avez ajouté/modifié des données localement
- Pour mettre à jour le seed

**Comment** :
```bash
node database/export_seed.js
```

**Prérequis** :
- PostgreSQL local démarré
- Fichier `.env` configuré
- Base de données locale avec des données

---

#### `generate-production-files.ps1` 🪟
**Ce que c'est** : Script PowerShell convivial pour Windows

**Ce qu'il fait** :
1. Vérifie votre environnement (Node.js, PostgreSQL)
2. Exécute `export_seed.js`
3. Affiche un résumé coloré
4. Vous guide vers les prochaines étapes
5. Peut ouvrir le dossier dans l'explorateur

**Quand l'utiliser** :
- Si vous êtes sur Windows
- Si vous voulez un processus guidé
- Pour une première utilisation

**Comment** :
```powershell
powershell database/generate-production-files.ps1
```

---

### 3️⃣ Documentation (Guides)

#### `README_PRODUCTION.md` 📚
**Ce que c'est** : Vue d'ensemble complète et accessible

**Contenu** :
- Description de tous les fichiers
- Processus complet en 6 étapes
- Configuration de l'application
- Checklist de validation
- Statistiques de votre déploiement
- Dépannage courant

**Pour qui** :
- Première lecture recommandée
- Vue d'ensemble rapide
- Référence générale

**Durée de lecture** : 10-15 minutes

---

#### `DEPLOY_PRODUCTION.md` 📚
**Ce que c'est** : Guide détaillé étape par étape

**Contenu** :
- 6 étapes détaillées du déploiement
- Commandes SQL complètes
- Tests de validation
- Sécurité post-déploiement
- Dépannage avancé

**Pour qui** :
- Lors du déploiement réel
- Administrateurs système
- Guide de référence technique

**Durée de lecture** : 20-30 minutes

---

#### `CHECKLIST_DEPLOYMENT.md` ✅
**Ce que c'est** : Checklist exhaustive à cocher

**Contenu** :
- Checklist avant déploiement
- Checklist pendant déploiement
- Checklist après déploiement
- Tests de validation
- Modèle de fichier `.env`
- Contacts d'urgence

**Pour qui** :
- À utiliser pendant le déploiement
- Pour ne rien oublier
- Pour validation finale

**Format** : Checklist interactive (cases à cocher)

---

#### `INDEX_PRODUCTION.md` 📋
**Ce que c'est** : Ce fichier ! Index de navigation

**Contenu** :
- Vue d'ensemble de tous les fichiers
- Guide de navigation
- Workflows recommandés

**Pour qui** :
- Point de départ
- Navigation dans la documentation

---

## 🗺️ Workflows Recommandés

### 📋 Workflow 1 : Premier Déploiement

```
1. Lire README_PRODUCTION.md (10 min)
   └─> Comprendre l'ensemble du processus

2. Exécuter generate-production-files.ps1 (1 min)
   └─> Générer production_seed.sql

3. Suivre DEPLOY_PRODUCTION.md (30-60 min)
   └─> Déployer sur le serveur

4. Utiliser CHECKLIST_DEPLOYMENT.md (15 min)
   └─> Valider le déploiement

5. ✅ Production opérationnelle !
```

**Temps total estimé** : 1-2 heures

---

### 🔄 Workflow 2 : Mise à Jour des Données

```
1. Modifier vos données en local
   └─> Ajouter actions, utilisateurs, etc.

2. Exécuter export_seed.js (30 sec)
   └─> Regénérer production_seed.sql

3. Transférer production_seed.sql vers serveur
   └─> SCP, FTP, etc.

4. Exécuter sur le serveur (1 min)
   └─> psql -f production_seed.sql

5. ✅ Données mises à jour !
```

**Temps total estimé** : 5-10 minutes

---

### 🆘 Workflow 3 : Dépannage

```
1. Identifier le problème
   └─> Erreur de connexion ? Données manquantes ?

2. Consulter DEPLOY_PRODUCTION.md section "Dépannage"
   └─> Solutions aux problèmes courants

3. Si nécessaire, consulter README_PRODUCTION.md section "Support"
   └─> Références supplémentaires

4. En dernier recours : rollback
   └─> Procédure dans DEPLOY_PRODUCTION.md
```

---

## 📊 État Actuel de Vos Données

Dernière génération : **23 janvier 2026**

| Ressource | Quantité | Statut |
|-----------|----------|--------|
| **Utilisateurs** | 2 | ✅ (admin + Salmone) |
| **Assignations** | 1 | ✅ (Salmone : accès total) |
| **Actions PAM** | 32 | ✅ |
| **Historique** | 0 | ℹ️ (normal, sera rempli automatiquement) |

### Répartition des actions :

| Statut | Nombre |
|--------|--------|
| À démarrer | ~25 |
| En cours | ~7 |
| En retard | 0 |
| Achevé | 0 |

---

## 🎯 Prochaines Étapes Recommandées

### Immédiat (maintenant)
1. [ ] Lire `README_PRODUCTION.md`
2. [ ] Exécuter `generate-production-files.ps1`
3. [ ] Vérifier que `production_seed.sql` est correct

### Avant le déploiement (préparer)
1. [ ] Préparer l'accès au serveur de production
2. [ ] Préparer les credentials PostgreSQL
3. [ ] Générer JWT_SECRET et API_KEY forts
4. [ ] Préparer le fichier `.env` de production

### Pendant le déploiement (1-2h)
1. [ ] Suivre `DEPLOY_PRODUCTION.md` étape par étape
2. [ ] Utiliser `CHECKLIST_DEPLOYMENT.md` pour ne rien oublier
3. [ ] Tester après chaque étape

### Après le déploiement (validation)
1. [ ] Changer le mot de passe admin ⚠️
2. [ ] Tester tous les cas d'usage
3. [ ] Créer les utilisateurs métier
4. [ ] Former les utilisateurs

---

## 💡 Conseils Pro

### ✅ À FAIRE
- Lire la documentation avant de commencer
- Tester sur un environnement de staging d'abord
- Faire des backups avant toute opération
- Changer le mot de passe admin immédiatement
- Documenter toute modification

### ❌ À ÉVITER
- Ne pas exécuter les scripts sans les comprendre
- Ne pas sauter les étapes de validation
- Ne pas oublier de changer le mot de passe admin
- Ne pas committer le fichier `.env`
- Ne pas faire de modification directe en base sans backup

---

## 📞 Besoin d'Aide ?

### Documentation disponible
1. **README_PRODUCTION.md** : Vue d'ensemble
2. **DEPLOY_PRODUCTION.md** : Guide détaillé
3. **CHECKLIST_DEPLOYMENT.md** : Validation
4. **INDEX_PRODUCTION.md** : Navigation (ce fichier)

### Documentation générale du projet
- `../README.md` : Documentation générale
- `../INSTALL.md` : Installation locale
- `../DESIGN_*.md` : Documentation technique

### En cas de problème
1. Consultez la section "Dépannage" de `DEPLOY_PRODUCTION.md`
2. Vérifiez les logs : `pm2 logs mha-pam`
3. Testez la connexion DB : `node test-db.js`

---

## 🎉 Prêt à Déployer !

Vous avez maintenant tous les outils nécessaires :

- ✅ Schéma SQL complet
- ✅ Données exportées et prêtes
- ✅ Scripts d'automatisation
- ✅ Documentation complète
- ✅ Checklist de validation

**👉 Commencez par lire `README_PRODUCTION.md` !**

---

_Dernière mise à jour : 23 janvier 2026_
_Version : 1.0_

