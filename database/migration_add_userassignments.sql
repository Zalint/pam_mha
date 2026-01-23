-- ============================================================================
-- MIGRATION : Ajout de la table userAssignments pour la production
-- ============================================================================

-- Créer la table userassignments (PostgreSQL convertit automatiquement en minuscules)
CREATE TABLE IF NOT EXISTS userassignments (
  id SERIAL PRIMARY KEY,
  userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignmenttype VARCHAR(20) NOT NULL CHECK (assignmenttype IN ('all', 'programme', 'action')),
  assignmentvalue TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdby INTEGER REFERENCES users(id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_assignments_user ON userassignments(userid);
CREATE INDEX IF NOT EXISTS idx_user_assignments_type ON userassignments(assignmenttype);
CREATE INDEX IF NOT EXISTS idx_user_assignments_value ON userassignments(assignmentvalue);

-- Ajouter les colonnes manquantes à la table actions si elles n'existent pas
DO $$ 
BEGIN
  -- action
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='actions' AND column_name='action') THEN
    ALTER TABLE actions ADD COLUMN action VARCHAR(255);
  END IF;
  
  -- activite
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='actions' AND column_name='activite') THEN
    ALTER TABLE actions ADD COLUMN activite TEXT;
  END IF;
  
  -- resultatsattendus
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='actions' AND column_name='resultatsattendus') THEN
    ALTER TABLE actions ADD COLUMN resultatsattendus TEXT;
  END IF;
  
  -- indicateurscibles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='actions' AND column_name='indicateurscibles') THEN
    ALTER TABLE actions ADD COLUMN indicateurscibles TEXT;
  END IF;
  
  -- indicateursresultats
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='actions' AND column_name='indicateursresultats') THEN
    ALTER TABLE actions ADD COLUMN indicateursresultats DECIMAL(5,2);
  END IF;
  
  -- budgetprevisionnel
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='actions' AND column_name='budgetprevisionnel') THEN
    ALTER TABLE actions ADD COLUMN budgetprevisionnel DECIMAL(15,2);
  END IF;
END $$;

-- Commentaire
COMMENT ON TABLE userassignments IS 'Assignations des utilisateurs aux programmes ou actions';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

SELECT 'Migration terminée avec succès!' AS message;

