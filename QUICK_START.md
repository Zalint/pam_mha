# 🚀 Guide de démarrage rapide

## Démarrage en 1 commande

Ouvrez PowerShell dans le dossier du projet et exécutez :

```powershell
.\script_start.ps1
```

Le script va automatiquement :
- ✅ Créer le fichier `.env` avec votre configuration
- ✅ Vérifier Node.js
- ✅ Installer les dépendances npm si nécessaire
- ✅ Vérifier PostgreSQL et créer la base de données
- ✅ Créer les tables automatiquement
- ✅ Libérer le port 3000 si occupé
- ✅ Démarrer l'application

## Arrêt de l'application

```powershell
.\script_stop.ps1
```

Ou simplement `Ctrl+C` dans le terminal où le serveur tourne.

## Accès à l'application

Une fois démarré :

- **URL principale** : http://localhost:3000
- **Page de login** : http://localhost:3000/login.html

### Identifiants par défaut

```
Username: admin
Password: admin123
```

⚠️ **Changez ce mot de passe dès la première connexion !**

## En cas de problème

### Le script ne s'exécute pas

Si vous obtenez une erreur de politique d'exécution :

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Puis relancez `.\script_start.ps1`

### PostgreSQL non trouvé

Le script cherche PostgreSQL dans les emplacements standards. Si non trouvé :

1. Vérifiez que PostgreSQL est installé
2. Créez manuellement la base :

```powershell
psql -U postgres
CREATE DATABASE suivi_pam_mha;
\q

psql -U postgres -d suivi_pam_mha -f database\schema.sql
```

### Port 3000 occupé

Le script propose automatiquement d'arrêter les processus existants.

Ou manuellement :
```powershell
.\script_stop.ps1
```

### Erreur de connexion à la base

Vérifiez le mot de passe PostgreSQL dans `script_start.ps1` ligne 20 :
```powershell
DB_PASSWORD=bonea
```

Modifiez-le si nécessaire.

## Commandes utiles

### Redémarrage complet

```powershell
.\script_stop.ps1
.\script_start.ps1
```

### Voir les logs en temps réel

Les logs s'affichent automatiquement dans le terminal après le démarrage.

### Créer un nouvel utilisateur

```powershell
node scripts/create-user.js
```

### Importer les données du PAM

1. Éditez `scripts/import-from-pdf.js` avec vos données
2. Exécutez :

```powershell
node scripts/import-from-pdf.js
```

## Structure rapide

```
c:\ASBB\MHA\POC\SUIVI\
├── script_start.ps1    ← Script de démarrage
├── script_stop.ps1     ← Script d'arrêt
├── .env               ← Configuration (créé automatiquement)
├── server.js          ← Serveur principal
├── database/          ← Schéma SQL
├── public/            ← Interface web
└── scripts/           ← Utilitaires
```

## Prochaines étapes

1. ✅ Démarrer l'application avec `script_start.ps1`
2. ✅ Se connecter avec admin/admin123
3. ✅ Changer le mot de passe admin
4. ✅ Créer les comptes utilisateurs
5. ✅ Importer les actions du PAM
6. ✅ Commencer le suivi !

## Support

- Documentation complète : `README.md`
- Installation détaillée : `INSTALL.md`
- Déploiement production : `DEPLOY.md`

