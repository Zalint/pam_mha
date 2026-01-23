-- Migration : Système d'assignation des utilisateurs
-- Remplace le système de 'programme' par un système d'assignation hiérarchique

-- 1. Créer la nouvelle table userAssignments
CREATE TABLE IF NOT EXISTS userAssignments (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignmentType VARCHAR(20) NOT NULL CHECK (assignmentType IN ('all', 'programme', 'action')),
  assignmentValue TEXT, -- NULL si 'all', nom du programme si 'programme', ID de l'action si 'action'
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_assignments_user ON userAssignments(userId);
CREATE INDEX IF NOT EXISTS idx_user_assignments_type ON userAssignments(assignmentType);
CREATE INDEX IF NOT EXISTS idx_user_assignments_value ON userAssignments(assignmentValue);

-- 2. Migrer les données existantes (si colonne programme existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'programme'
  ) THEN
    -- Migrer les Directeurs avec programme assigné
    INSERT INTO userAssignments (userId, assignmentType, assignmentValue)
    SELECT id, 'programme', programme
    FROM users
    WHERE role = 'Directeur' AND programme IS NOT NULL AND programme != '';
    
    -- Supprimer l'ancienne colonne programme
    ALTER TABLE users DROP COLUMN IF EXISTS programme;
  END IF;
END $$;

-- 3. Mettre à jour le constraint sur role (supprimer "Directeur de Cabinet")
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('Admin', 'Ministre', 'Directeur'));

-- 4. Migrer les anciens "Directeur de Cabinet" en "Directeur" avec assignmentType = 'all'
UPDATE users SET role = 'Directeur' WHERE role = 'Directeur de Cabinet';

INSERT INTO userAssignments (userId, assignmentType, assignmentValue)
SELECT id, 'all', NULL
FROM users
WHERE role = 'Directeur' 
  AND id NOT IN (SELECT userId FROM userAssignments WHERE userId = users.id);

-- 5. Créer un trigger pour mettre à jour updatedAt
CREATE OR REPLACE FUNCTION update_user_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: userAssignments n'a pas de colonne updatedAt pour le moment
-- Si besoin, décommenter ci-dessous:
-- ALTER TABLE userAssignments ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- CREATE TRIGGER trigger_user_assignments_updated_at
--   BEFORE UPDATE ON userAssignments
--   FOR EACH ROW
--   EXECUTE FUNCTION update_user_assignments_updated_at();

