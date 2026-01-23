# Plateforme de Suivi des Plans d'Actions Ministériels (PAM) - MHA

Application web de suivi de l'exécution des Plans d'Actions Ministériels pour le Ministère de l'Hydraulique et de l'Assainissement (MHA) du Sénégal.

## 🎯 Fonctionnalités

- **Dashboard en temps réel** : Suivi des indicateurs clés (actions totales, en retard, achevées, taux d'avancement)
- **Gestion des actions** : Création, modification et suivi des actions du PAM
- **Filtres avancés** : Par programme, statut, responsable
- **Historique des modifications** : Traçabilité complète des changements
- **Authentification sécurisée** : JWT pour le frontend, API key pour les intégrations externes
- **PWA** : Application installable, fonctionnant hors-ligne

## 👥 Rôles et permissions

### Ministre
- Accès en lecture à toutes les actions
- Visualisation du dashboard synthétique
- Modification des statuts et ajout de commentaires

### Directeur de Cabinet
- Accès en lecture et écriture complet
- Validation et modification des statuts
- Ajout de commentaires officiels

### Directeur
- Accès limité à leur périmètre (programme)
- Mise à jour des statuts et commentaires
- Consultation de leur équipe

### Admin
- Gestion complète des utilisateurs
- Accès à toutes les fonctionnalités
- Configuration du système

## 🏗️ Architecture

### Backend
- **Node.js** + **Express**
- **PostgreSQL** (base de données)
- **JWT** (authentification interne)
- **API key** (authentification externe)

### Frontend
- **JavaScript** vanilla (pas de framework)
- **PWA** (Progressive Web App)
- **Service Worker** (cache et hors-ligne)

### Convention de nommage
- **camelCase** partout (tables, colonnes, variables)
- **Format de date** : YYYY-MM-DD

## 📦 Installation

### Prérequis
- Node.js (v16+)
- PostgreSQL (v13+)

### Étapes

1. **Cloner le projet**
```bash
cd c:\ASBB\MHA\POC\SUIVI
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer la base de données**

Créer une base PostgreSQL :
```sql
CREATE DATABASE suivi_pam_mha;
```

Exécuter le schéma :
```bash
psql -U postgres -d suivi_pam_mha -f database/schema.sql
```

4. **Configurer les variables d'environnement**

Copier `.env.example` vers `.env` et ajuster les valeurs :
```bash
copy .env.example .env
```

Modifier `.env` avec vos paramètres :
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=suivi_pam_mha
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
JWT_SECRET=votre_secret_jwt_aleatoire
EXTERNAL_API_KEY=votre_cle_api_externe
```

5. **Démarrer le serveur**
```bash
npm start
```

Ou en mode développement avec auto-reload :
```bash
npm run dev
```

6. **Accéder à l'application**

Ouvrir votre navigateur : http://localhost:3000

**Identifiants par défaut :**
- Username: `admin`
- Mot de passe: `admin123`

⚠️ **Changez immédiatement le mot de passe en production !**

## 📱 Installation PWA

Sur mobile ou tablette :
1. Ouvrir l'application dans le navigateur
2. Cliquer sur "Ajouter à l'écran d'accueil"
3. L'application s'installe comme une app native

## 🔌 API Externe

### Authentification
Toutes les requêtes externes doivent inclure l'en-tête :
```
x-api-key: votre_cle_api
```

### Endpoints disponibles

**GET** `/api/external/actions` - Liste des actions
**GET** `/api/external/actions/:id` - Détail d'une action
**POST** `/api/external/actions` - Créer une action
**PUT** `/api/external/actions/:id` - Mettre à jour une action
**GET** `/api/external/statistics` - Statistiques
**GET** `/api/external/programmes` - Liste des programmes

### Exemple d'appel
```bash
curl -H "x-api-key: votre_cle_api" http://localhost:3000/api/external/actions
```

## 🎨 Charte graphique

Palette de couleurs institutionnelle sénégalaise :
- **Principale** : Vert institutionnel (#2d8b6d)
- **Secondaire** : Turquoise doux (#4db8a8)
- **Accent** : Jaune sable (#d4a76a)
- **Fond** : Blanc cassé (#f8f9fa)
- **Texte** : Anthracite (#2b3e50)

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- JWT avec expiration configurable
- Protection XSS sur toutes les entrées
- Requêtes SQL paramétrées (protection SQL injection)
- CORS configuré
- Secrets dans `.env` (jamais commités)

## 📊 Structure du projet

```
c:\ASBB\MHA\POC\SUIVI\
├── config/
│   ├── config.js          # Configuration globale
│   └── database.js        # Connexion PostgreSQL
├── database/
│   └── schema.sql         # Schéma de la base
├── middleware/
│   ├── auth.js            # Authentification JWT + API key
│   └── validation.js      # Validation des données
├── models/
│   ├── User.js            # Modèle utilisateur
│   ├── Action.js          # Modèle action
│   └── Historique.js      # Modèle historique
├── routes/
│   ├── auth.js            # Routes authentification
│   ├── actions.js         # Routes actions (internes)
│   ├── statistics.js      # Routes statistiques
│   ├── users.js           # Routes utilisateurs
│   └── external.js        # Routes API externe
├── public/
│   ├── index.html         # Page principale
│   ├── login.html         # Page de connexion
│   ├── styles.css         # Styles
│   ├── app.js             # Application frontend
│   ├── api.js             # Module API
│   ├── manifest.json      # Manifest PWA
│   └── sw.js              # Service Worker
├── server.js              # Point d'entrée serveur
├── package.json
└── .env                   # Variables d'environnement
```

## 🚀 Déploiement en production

1. Configurer les variables d'environnement de production
2. Générer un JWT secret fort : `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
3. Utiliser HTTPS
4. Configurer un reverse proxy (nginx)
5. Utiliser PM2 pour la gestion des processus :

```bash
npm install -g pm2
pm2 start server.js --name suivi-pam-mha
pm2 save
pm2 startup
```

## 🛠️ Maintenance

### Sauvegarde de la base
```bash
pg_dump -U postgres suivi_pam_mha > backup_$(date +%Y%m%d).sql
```

### Restauration
```bash
psql -U postgres suivi_pam_mha < backup_20260123.sql
```

## 📞 Support

Pour toute question ou problème, contacter l'équipe technique du MHA.

## 📄 Licence

© 2026 Ministère de l'Hydraulique et de l'Assainissement - République du Sénégal

