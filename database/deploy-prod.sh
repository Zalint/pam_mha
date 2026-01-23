#!/bin/bash
# ============================================================================
# Script de déploiement en production - MHA PAM 2026
# ============================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement de la base de données de production"
echo ""

# Configuration (modifiez selon votre environnement)
DB_NAME="${DB_NAME:-mha_pam_production}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "📦 Configuration:"
echo "   - Base de données : $DB_NAME"
echo "   - Utilisateur     : $DB_USER"
echo "   - Hôte            : $DB_HOST"
echo "   - Port            : $DB_PORT"
echo ""

# Vérifier que PostgreSQL est accessible
echo "🔍 Vérification de PostgreSQL..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Erreur: Impossible de se connecter à PostgreSQL"
    echo "   Vérifiez que PostgreSQL est démarré et que les credentials sont corrects"
    exit 1
fi
echo "   ✅ PostgreSQL accessible"
echo ""

# Vérifier si la base existe déjà
echo "🔍 Vérification de l'existence de la base..."
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠️  La base $DB_NAME existe déjà!"
    read -p "   Voulez-vous la supprimer et la recréer? (oui/non): " RESPONSE
    if [ "$RESPONSE" = "oui" ]; then
        echo "🗑️  Suppression de la base existante..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE $DB_NAME;"
        echo "   ✅ Base supprimée"
    else
        echo "❌ Opération annulée"
        exit 0
    fi
fi

# Créer la base
echo "📦 Création de la base de données..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
echo "   ✅ Base créée"
echo ""

# Créer le schéma
echo "📋 Création du schéma (tables, index, triggers)..."
if [ ! -f "production_schema.sql" ]; then
    echo "❌ Erreur: Fichier production_schema.sql introuvable!"
    exit 1
fi
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f production_schema.sql > /dev/null
echo "   ✅ Schéma créé"
echo ""

# Importer les données
echo "📊 Import des données..."
if [ ! -f "production_seed.sql" ]; then
    echo "❌ Erreur: Fichier production_seed.sql introuvable!"
    exit 1
fi
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f production_seed.sql > /dev/null
echo "   ✅ Données importées"
echo ""

# Vérifier les données
echo "🔍 Vérification des données..."
COUNT_USERS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM users")
COUNT_ACTIONS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM actions")

echo "📊 Résumé:"
echo "   - $COUNT_USERS utilisateur(s)"
echo "   - $COUNT_ACTIONS action(s)"
echo ""

echo "✅ Déploiement terminé avec succès!"
echo ""
echo "⚠️  IMPORTANT: Changez le mot de passe admin immédiatement!"
echo "   Login: admin / admin123"
echo ""

