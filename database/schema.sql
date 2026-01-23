-- Schéma de base de données pour le suivi des PAM
-- Convention: camelCase pour tables et colonnes

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  fullName VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Ministre', 'Directeur de Cabinet', 'Directeur', 'Admin')),
  programme VARCHAR(255), -- Pour les Directeurs: leur périmètre de responsabilité
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des actions du PAM
CREATE TABLE IF NOT EXISTS actions (
  id SERIAL PRIMARY KEY,
  programme VARCHAR(255) NOT NULL,
  sousDirection VARCHAR(255),
  intitule TEXT NOT NULL,
  responsable VARCHAR(255) NOT NULL,
  echeance DATE NOT NULL,
  tauxPhysique DECIMAL(5,2) DEFAULT 0 CHECK (tauxPhysique >= 0 AND tauxPhysique <= 100),
  tauxFinancier DECIMAL(5,2) DEFAULT 0 CHECK (tauxFinancier >= 0 AND tauxFinancier <= 100),
  statut VARCHAR(50) NOT NULL DEFAULT 'À démarrer' CHECK (statut IN ('À démarrer', 'En cours', 'En retard', 'Achevé')),
  budgetTotal DECIMAL(15,2),
  budgetT1 DECIMAL(15,2),
  budgetT2 DECIMAL(15,2),
  budgetT3 DECIMAL(15,2),
  budgetT4 DECIMAL(15,2),
  commentaire TEXT,
  lastModifiedBy INTEGER REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de l'historique des modifications
CREATE TABLE IF NOT EXISTS historique (
  id SERIAL PRIMARY KEY,
  actionId INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  userId INTEGER NOT NULL REFERENCES users(id),
  champModifie VARCHAR(100) NOT NULL,
  ancienneValeur TEXT,
  nouvelleValeur TEXT,
  commentaire TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_actions_programme ON actions(programme);
CREATE INDEX IF NOT EXISTS idx_actions_statut ON actions(statut);
CREATE INDEX IF NOT EXISTS idx_actions_responsable ON actions(responsable);
CREATE INDEX IF NOT EXISTS idx_actions_echeance ON actions(echeance);
CREATE INDEX IF NOT EXISTS idx_historique_action ON historique(actionId);
CREATE INDEX IF NOT EXISTS idx_historique_user ON historique(userId);

-- Fonction pour mettre à jour automatiquement updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données initiales: utilisateur admin par défaut
-- Mot de passe: admin123 (à changer en production)
INSERT INTO users (username, passwordHash, fullName, role) 
VALUES ('admin', '$2b$10$rBV2KJ9k3HhXQVxDfZQf5.6kxJZ4pKGqmJ3XRgQl5KGMqxqFZqYqK', 'Administrateur', 'Admin')
ON CONFLICT (username) DO NOTHING;

