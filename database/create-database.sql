-- ============================================================================
-- Création de la base de données de production
-- ============================================================================

-- Créer la base de données (si elle n'existe pas)
-- Note: Vous devez être connecté à la base 'postgres' pour exécuter cette commande

CREATE DATABASE mha_pam_production;

-- ============================================================================
-- Optionnel : Créer un utilisateur dédié (recommandé en production)
-- ============================================================================

-- Décommentez les lignes ci-dessous si vous voulez créer un utilisateur dédié

-- CREATE USER mha_user WITH PASSWORD 'CHANGEZ_CE_MOT_DE_PASSE_123456';
-- GRANT ALL PRIVILEGES ON DATABASE mha_pam_production TO mha_user;
-- ALTER DATABASE mha_pam_production OWNER TO mha_user;

-- ============================================================================
-- Instructions
-- ============================================================================

-- 1. Exécutez ce fichier en étant connecté à la base 'postgres' :
--    psql -U postgres -f create-database.sql

-- 2. Puis exécutez le schéma sur la nouvelle base :
--    psql -U postgres -d mha_pam_production -f production_schema.sql

-- 3. Enfin, importez les données :
--    psql -U postgres -d mha_pam_production -f production_seed.sql

-- ============================================================================

