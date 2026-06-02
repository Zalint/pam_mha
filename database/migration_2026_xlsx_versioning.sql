-- Migration 2026 : Import / Export xlsx + Versioning des données
-- Source du format : "Plan d'actions MHA 2026.xlsx"
-- Convention : identifiants camelCase non quotés (PostgreSQL les replie en minuscules,
-- comme le reste du schéma). Migration idempotente (IF NOT EXISTS).

-- 1) Nouvelles colonnes "fidèles + dérivées" sur la table actions
ALTER TABLE actions
  ADD COLUMN IF NOT EXISTS echeanceLibelle TEXT,              -- libellé brut de l'échéance (ex : "4ème trimestre")
  ADD COLUMN IF NOT EXISTS budgetPrevisionnelLibelle TEXT,    -- budget prévisionnel brut (ex : "39 850 000 FCFA")
  ADD COLUMN IF NOT EXISTS indicateursResultatsValeur TEXT,   -- colonne "Résultats" des indicateurs (valeur brute)
  ADD COLUMN IF NOT EXISTS sortIndex INTEGER;                 -- ordre d'origine des lignes du xlsx

-- 2) Le xlsx ne fournit pas toujours d'échéance datée ni de responsable -> on lève les NOT NULL
ALTER TABLE actions ALTER COLUMN echeance DROP NOT NULL;
ALTER TABLE actions ALTER COLUMN responsable DROP NOT NULL;

-- 3) Tables de versioning (snapshot complet des actions avant un import / une restauration)
CREATE TABLE IF NOT EXISTS actionVersions (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  reason TEXT,
  source VARCHAR(50) NOT NULL DEFAULT 'manual',  -- 'pre-import' | 'pre-restore' | 'manual'
  actionCount INTEGER NOT NULL DEFAULT 0,
  createdBy INTEGER REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS actionVersionRows (
  id SERIAL PRIMARY KEY,
  versionId INTEGER NOT NULL REFERENCES actionVersions(id) ON DELETE CASCADE,
  data JSONB NOT NULL,                            -- copie complète de la ligne action au moment du snapshot
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4) Index
CREATE INDEX IF NOT EXISTS idx_actionversionrows_version ON actionVersionRows(versionId);
CREATE INDEX IF NOT EXISTS idx_actions_sortindex ON actions(sortIndex);

-- Documentation des colonnes
COMMENT ON COLUMN actions.echeanceLibelle IS 'Libellé brut de l''échéance (xlsx col I) pour un export fidèle';
COMMENT ON COLUMN actions.budgetPrevisionnelLibelle IS 'Budget prévisionnel brut (xlsx col H) pour un export fidèle';
COMMENT ON COLUMN actions.indicateursResultatsValeur IS 'Indicateurs - colonne Résultats (xlsx col F)';
COMMENT ON COLUMN actions.sortIndex IS 'Ordre d''origine des lignes du fichier xlsx importé';
