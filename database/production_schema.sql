-- ============================================================================
-- SCHÉMA COMPLET DE PRODUCTION - MHA PAM 2026
-- Convention: camelCase pour tables et colonnes
-- ============================================================================

-- ============================================================================
-- 1. TABLE DES UTILISATEURS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  passwordhash VARCHAR(255) NOT NULL,
  fullname VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Ministre', 'Directeur')),
  isactive BOOLEAN DEFAULT true,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. TABLE DES ASSIGNATIONS UTILISATEURS
-- ============================================================================
CREATE TABLE IF NOT EXISTS userassignments (
  id SERIAL PRIMARY KEY,
  userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignmenttype VARCHAR(20) NOT NULL CHECK (assignmenttype IN ('all', 'programme', 'action')),
  assignmentvalue TEXT, -- NULL si 'all', nom du programme si 'programme', ID de l'action si 'action'
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdby INTEGER REFERENCES users(id)
);

-- ============================================================================
-- 3. TABLE DES ACTIONS DU PAM
-- ============================================================================
CREATE TABLE IF NOT EXISTS actions (
  id SERIAL PRIMARY KEY,
  -- Informations de base
  programme VARCHAR(255) NOT NULL,
  sousdirection VARCHAR(255),
  action VARCHAR(255),
  activite TEXT,
  intitule TEXT NOT NULL,
  
  -- Résultats et indicateurs
  resultatsattendus TEXT,
  indicateurscibles TEXT,
  indicateursresultats DECIMAL(5,2),
  
  -- Responsabilité et échéance
  responsable VARCHAR(255) NOT NULL,
  echeance DATE NOT NULL,
  
  -- État d'exécution
  tauxphysique DECIMAL(5,2) DEFAULT 0 CHECK (tauxphysique >= 0 AND tauxphysique <= 100),
  tauxfinancier DECIMAL(5,2) DEFAULT 0 CHECK (tauxfinancier >= 0 AND tauxfinancier <= 100),
  statut VARCHAR(50) NOT NULL DEFAULT 'À démarrer' CHECK (statut IN ('À démarrer', 'En cours', 'En retard', 'Achevé')),
  
  -- Budget
  budgettotal DECIMAL(15,2),
  budgetprevisionnel DECIMAL(15,2),
  budgett1 DECIMAL(15,2),
  budgett2 DECIMAL(15,2),
  budgett3 DECIMAL(15,2),
  budgett4 DECIMAL(15,2),
  
  -- Commentaires et audit
  commentaire TEXT,
  lastmodifiedby INTEGER REFERENCES users(id),
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. TABLE DE L'HISTORIQUE DES MODIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS historique (
  id SERIAL PRIMARY KEY,
  actionid INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  userid INTEGER NOT NULL REFERENCES users(id),
  champmodifie VARCHAR(100) NOT NULL,
  anciennevaleur TEXT,
  nouvellevaleur TEXT,
  commentaire TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. INDEX POUR AMÉLIORER LES PERFORMANCES
-- ============================================================================

-- Index sur la table users
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_isactive ON users(isactive);

-- Index sur la table userassignments
CREATE INDEX IF NOT EXISTS idx_user_assignments_user ON userassignments(userid);
CREATE INDEX IF NOT EXISTS idx_user_assignments_type ON userassignments(assignmenttype);
CREATE INDEX IF NOT EXISTS idx_user_assignments_value ON userassignments(assignmentvalue);

-- Index sur la table actions
CREATE INDEX IF NOT EXISTS idx_actions_programme ON actions(programme);
CREATE INDEX IF NOT EXISTS idx_actions_statut ON actions(statut);
CREATE INDEX IF NOT EXISTS idx_actions_responsable ON actions(responsable);
CREATE INDEX IF NOT EXISTS idx_actions_echeance ON actions(echeance);
CREATE INDEX IF NOT EXISTS idx_actions_action ON actions(action);

-- Index sur la table historique
CREATE INDEX IF NOT EXISTS idx_historique_action ON historique(actionid);
CREATE INDEX IF NOT EXISTS idx_historique_user ON historique(userid);
CREATE INDEX IF NOT EXISTS idx_historique_created_at ON historique(createdat);

-- ============================================================================
-- 6. FONCTIONS ET TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour automatiquement updatedat
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers pour updatedAt
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_actions_updated_at ON actions;
CREATE TRIGGER update_actions_updated_at 
  BEFORE UPDATE ON actions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. COMMENTAIRES DE DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE users IS 'Utilisateurs du système (Admin, Ministre, Directeur)';
COMMENT ON TABLE userassignments IS 'Assignations des utilisateurs aux programmes ou actions';
COMMENT ON TABLE actions IS 'Actions du Plan d''Action du Ministère (PAM) 2026';
COMMENT ON TABLE historique IS 'Historique complet des modifications des actions';

COMMENT ON COLUMN actions.action IS 'Colonne Actions du document PDF';
COMMENT ON COLUMN actions.activite IS 'Colonne Activités du document PDF';
COMMENT ON COLUMN actions.resultatsattendus IS 'Résultats attendus de l''action';
COMMENT ON COLUMN actions.indicateurscibles IS 'Indicateurs - Cibles (ex: Taux d''avancement = 99%)';
COMMENT ON COLUMN actions.indicateursresultats IS 'Indicateurs - Résultats en pourcentage';
COMMENT ON COLUMN actions.budgetprevisionnel IS 'Budget prévisionnel LFI 2026';

-- ============================================================================
-- 8. UTILISATEUR ADMIN PAR DÉFAUT (TEMPORAIRE)
-- ============================================================================
-- NOTE: Ce compte admin est temporaire et DOIT être changé immédiatement en production
-- Username: admin
-- Password: admin123
-- ⚠️ IMPORTANT: Changez ce mot de passe après le premier déploiement !

INSERT INTO users (username, passwordhash, fullname, role) 
VALUES ('admin', '$2b$10$rBV2KJ9k3HhXQVxDfZQf5.6kxJZ4pKGqmJ3XRgQl5KGMqxqFZqYqK', 'Administrateur Système', 'Admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- FIN DU SCHÉMA
-- ============================================================================

