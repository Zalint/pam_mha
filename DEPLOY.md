# Guide de déploiement en production

## 🚀 Préparation

### 1. Sécurité

**Générer des secrets forts** :
```powershell
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# API Key externe
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Configurer `.env` de production** :
```env
NODE_ENV=production
PORT=3000
PUBLIC_URL=https://pam.mha.sn

DB_HOST=localhost
DB_PORT=5432
DB_NAME=suivi_pam_mha
DB_USER=mha_app
DB_PASSWORD=mot_de_passe_tres_fort

JWT_SECRET=votre_secret_jwt_genere
JWT_EXPIRATION=8h

EXTERNAL_API_KEY=votre_cle_api_generee

CORS_ALLOWED_ORIGINS=https://pam.mha.sn
```

### 2. Base de données PostgreSQL

**Créer un utilisateur dédié** :
```sql
-- Se connecter en tant que postgres
CREATE USER mha_app WITH PASSWORD 'mot_de_passe_tres_fort';
CREATE DATABASE suivi_pam_mha OWNER mha_app;
GRANT ALL PRIVILEGES ON DATABASE suivi_pam_mha TO mha_app;
```

**Exécuter le schéma** :
```powershell
psql -U mha_app -d suivi_pam_mha -f database\schema.sql
```

**Changer le mot de passe admin** :
```sql
-- Générer un nouveau hash avec bcrypt (coût 10)
-- Utiliser le script create-user.js ou mettre à jour manuellement
UPDATE users 
SET "passwordHash" = '$2b$10$...' 
WHERE username = 'admin';
```

## 🔧 Installation sur serveur Windows

### 1. Installer les dépendances système

- Node.js 18 LTS ou supérieur
- PostgreSQL 15 ou supérieur
- PM2 (gestionnaire de processus)

```powershell
npm install -g pm2
```

### 2. Déployer l'application

```powershell
# Cloner ou copier les fichiers vers le serveur
cd C:\inetpub\wwwroot\suivi-pam

# Installer les dépendances
npm install --production

# Configurer l'environnement
copy .env.example .env
# Éditer .env avec les valeurs de production
```

### 3. Démarrer avec PM2

```powershell
# Démarrer l'application
pm2 start server.js --name suivi-pam-mha

# Sauvegarder la configuration PM2
pm2 save

# Configurer le démarrage automatique
pm2 startup

# Vérifier le statut
pm2 status
pm2 logs suivi-pam-mha
```

**Commandes PM2 utiles** :
```powershell
pm2 restart suivi-pam-mha    # Redémarrer
pm2 stop suivi-pam-mha        # Arrêter
pm2 delete suivi-pam-mha      # Supprimer
pm2 monit                     # Monitorer
```

## 🌐 Configuration IIS (Reverse Proxy)

### 1. Installer les modules IIS

- URL Rewrite Module
- Application Request Routing (ARR)

Téléchargeable depuis : https://www.iis.net/downloads

### 2. Configurer ARR

1. Ouvrir IIS Manager
2. Sélectionner le serveur
3. Double-cliquer sur "Application Request Routing Cache"
4. Cliquer sur "Server Proxy Settings"
5. Cocher "Enable proxy"
6. Appliquer

### 3. Créer le site IIS

**web.config** :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <httpErrors errorMode="Detailed" />
    </system.webServer>
</configuration>
```

### 4. Configurer HTTPS

1. Obtenir un certificat SSL (Let's Encrypt ou certificat officiel)
2. Installer le certificat dans IIS
3. Configurer la liaison HTTPS sur le port 443
4. Forcer HTTPS dans web.config

## 🔒 Sécurité supplémentaire

### 1. Pare-feu Windows

```powershell
# Autoriser uniquement IIS à accéder à l'application Node.js
New-NetFirewallRule -DisplayName "Suivi PAM - Local Only" `
  -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow `
  -RemoteAddress LocalSubnet
```

### 2. Sauvegardes automatiques

**Script PowerShell** (à planifier) :
```powershell
# backup-database.ps1
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "C:\Backups\suivi-pam\db_$date.sql"

& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" `
  -U mha_app -d suivi_pam_mha -f $backupPath

# Conserver seulement les 30 derniers backups
Get-ChildItem "C:\Backups\suivi-pam" -Filter "db_*.sql" | 
  Sort-Object LastWriteTime -Descending | 
  Select-Object -Skip 30 | 
  Remove-Item
```

**Planifier avec Task Scheduler** :
- Fréquence : Quotidienne à 2h du matin
- Script : `powershell.exe -File C:\Scripts\backup-database.ps1`

### 3. Logs

**Configurer PM2 pour la rotation des logs** :
```powershell
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 📊 Monitoring

### 1. PM2 Monitoring

```powershell
# Monitorer en temps réel
pm2 monit

# Voir les logs
pm2 logs suivi-pam-mha --lines 100

# Informations système
pm2 info suivi-pam-mha
```

### 2. Vérifications de santé

**Script de vérification** :
```powershell
# health-check.ps1
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/statistics" `
  -Method GET -UseBasicParsing

if ($response.StatusCode -eq 200) {
    Write-Host "✅ Application en bonne santé"
} else {
    Write-Host "❌ Problème détecté"
    # Envoyer une alerte (email, SMS, etc.)
}
```

## 🔄 Mise à jour de l'application

```powershell
# 1. Sauvegarder la base de données
pg_dump -U mha_app suivi_pam_mha > backup_avant_maj.sql

# 2. Arrêter l'application
pm2 stop suivi-pam-mha

# 3. Mettre à jour le code
# (copier les nouveaux fichiers ou git pull)

# 4. Mettre à jour les dépendances
npm install --production

# 5. Exécuter les migrations de base de données si nécessaire
# psql -U mha_app -d suivi_pam_mha -f migrations\xxx.sql

# 6. Redémarrer
pm2 restart suivi-pam-mha

# 7. Vérifier
pm2 logs suivi-pam-mha
```

## 📱 Vérifications post-déploiement

- [ ] L'application démarre sans erreur
- [ ] La page de login s'affiche correctement
- [ ] La connexion fonctionne
- [ ] Le dashboard affiche les données
- [ ] HTTPS est configuré et fonctionne
- [ ] Le certificat SSL est valide
- [ ] Les backups automatiques sont configurés
- [ ] PM2 est configuré pour le démarrage automatique
- [ ] Les logs sont accessibles
- [ ] L'API externe fonctionne avec la clé configurée
- [ ] La PWA peut être installée depuis un mobile

## 🆘 Dépannage en production

### Application ne démarre pas

```powershell
# Vérifier les logs
pm2 logs suivi-pam-mha --err

# Vérifier la configuration
node -e "require('dotenv').config(); console.log(process.env.PORT)"

# Tester la connexion DB
node -e "const pool = require('./config/database'); pool.query('SELECT NOW()', (e,r) => console.log(e||r.rows))"
```

### Problèmes de performance

```powershell
# Vérifier l'utilisation des ressources
pm2 monit

# Analyser les requêtes lentes PostgreSQL
# Activer log_min_duration_statement dans postgresql.conf
```

### Base de données corrompue

```powershell
# Restaurer depuis un backup
psql -U mha_app -d suivi_pam_mha < backup_20260123.sql
```

## 📞 Support

Documenter les contacts pour le support technique :
- Administrateur système
- Administrateur base de données
- Développeur

Créer un guide d'escalade des incidents.

