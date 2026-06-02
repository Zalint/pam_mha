# 🔄 Migration de la Base de Production Existante

## Situation

Vous avez déjà exécuté l'ancien schéma en production, mais il manque la table `userassignments` nécessaire pour le nouveau système de gestion des utilisateurs.

## Solution : Migration Simple

### Étape 1 : Exécuter la Migration

Sur votre serveur de production, exécutez le script de migration :

```bash
psql -U postgres -d mha_pam_production -f database/migration_add_userassignments.sql
```

**Ou avec PowerShell :**

```powershell
psql -U postgres -d mha_pam_production -f database/migration_add_userassignments.sql
```

### Étape 2 : Vérifier que la Table est Créée

```sql
-- Se connecter à la base
psql -U postgres -d mha_pam_production

-- Lister les tables
\dt

-- Résultat attendu :
-- actions
-- historique
-- userassignments  ← Nouvelle table
-- users

-- Vérifier la structure
\d userassignments

-- Quitter
\q
```

### Étape 3 : Importer les Données du Seed

Maintenant que la table existe, vous pouvez importer les données :

```bash
psql -U postgres -d mha_pam_production -f database/production_seed.sql
```

**Ou avec PowerShell :**

```powershell
psql -U postgres -d mha_pam_production -f database/production_seed.sql
```

### Étape 4 : Vérifier les Données

```sql
-- Se connecter
psql -U postgres -d mha_pam_production

-- Compter les données
SELECT 
  (SELECT COUNT(*) FROM users) as nb_users,
  (SELECT COUNT(*) FROM userassignments) as nb_assignments,
  (SELECT COUNT(*) FROM actions) as nb_actions,
  (SELECT COUNT(*) FROM historique) as nb_historique;

-- Résultat attendu :
-- nb_users: 2 (admin + Salmone)
-- nb_assignments: 1
-- nb_actions: 32
-- nb_historique: 0

\q
```

## ✅ C'est Tout !

Votre base de production est maintenant à jour et compatible avec le nouveau système.

## 🔧 Script Complet Automatisé

Si vous préférez tout faire en une seule commande :

**Linux/Mac :**
```bash
#!/bin/bash
DB_NAME="mha_pam_production"
DB_USER="postgres"

echo "📦 Migration de la base $DB_NAME"
psql -U $DB_USER -d $DB_NAME -f database/migration_add_userassignments.sql
echo "📊 Import des données"
psql -U $DB_USER -d $DB_NAME -f database/production_seed.sql
echo "✅ Terminé!"
```

**Windows PowerShell :**
```powershell
$DB_NAME = "mha_pam_production"
$DB_USER = "postgres"

Write-Host "📦 Migration de la base $DB_NAME" -ForegroundColor Cyan
psql -U $DB_USER -d $DB_NAME -f database/migration_add_userassignments.sql
Write-Host "📊 Import des données" -ForegroundColor Cyan
psql -U $DB_USER -d $DB_NAME -f database/production_seed.sql
Write-Host "✅ Terminé!" -ForegroundColor Green
```

## 🆕 Migration 2026 : Import/Export xlsx + Versioning

Cette migration ajoute le support de l'import/export du fichier `Plan d'actions MHA 2026.xlsx`
et le versioning (snapshot) des actions.

```powershell
psql -U postgres -d mha_pam_production -f database/migration_2026_xlsx_versioning.sql
```

Elle est **idempotente** (`IF NOT EXISTS`) et réalise :

- Ajout des colonnes `echeancelibelle`, `budgetprevisionnellibelle`,
  `indicateursresultatsvaleur`, `sortindex` sur `actions` (fidélité « libellé brut + valeur dérivée »).
- Levée des contraintes `NOT NULL` sur `actions.echeance` et `actions.responsable`
  (le xlsx ne fournit pas toujours ces champs).
- Création des tables `actionversions` et `actionversionrows` (snapshot complet en JSONB).

Vérification :

```sql
\d actions          -- doit contenir les 4 nouvelles colonnes
\dt                 -- doit lister actionversions et actionversionrows
```

> Sur une base **neuve**, le `production_schema.sql` inclut déjà ces changements : la
> migration n'est utile que pour une base de production **déjà existante**.

## ⚠️ Note Importante

PostgreSQL convertit automatiquement tous les noms de colonnes et tables en **minuscules** sauf s'ils sont entre guillemets doubles. C'est pourquoi :

- `userAssignments` devient `userassignments`
- `passwordHash` devient `passwordhash`
- `createdAt` devient `createdat`

Ceci est **normal** et **attendu** ! Votre application fonctionne déjà avec ces noms en minuscules.

