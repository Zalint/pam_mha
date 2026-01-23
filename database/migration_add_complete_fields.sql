-- Migration : Ajout des champs manquants pour correspondre au document PDF complet
-- Source : MHA Matrice SE-EXECUTION-PAM 2026-MHA 2026.pdf

-- Ajouter les nouvelles colonnes à la table actions
ALTER TABLE actions 
ADD COLUMN IF NOT EXISTS action VARCHAR(255),
ADD COLUMN IF NOT EXISTS activite TEXT,
ADD COLUMN IF NOT EXISTS resultatsAttendus TEXT,
ADD COLUMN IF NOT EXISTS indicateursCibles TEXT,
ADD COLUMN IF NOT EXISTS indicateursResultats DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS budgetPrevisionnel DECIMAL(15,2);

-- Commentaires pour documentation
COMMENT ON COLUMN actions.action IS 'Colonne Actions du document PDF';
COMMENT ON COLUMN actions.activite IS 'Colonne Activités du document PDF';
COMMENT ON COLUMN actions.resultatsAttendus IS 'Résultats attendus de l''action';
COMMENT ON COLUMN actions.indicateursCibles IS 'Indicateurs - Cibles (ex: Taux d''avancement = 99%)';
COMMENT ON COLUMN actions.indicateursResultats IS 'Indicateurs - Résultats en pourcentage';
COMMENT ON COLUMN actions.budgetPrevisionnel IS 'Budget prévisionnel LFI 2026';

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_actions_action ON actions(action);
CREATE INDEX IF NOT EXISTS idx_actions_activite ON actions(activite);

-- Note : Les colonnes existantes sont conservées :
-- - programme (Programmes)
-- - sousDirection (Actions - correspond à la colonne Actions du PDF)
-- - intitule (peut être utilisé pour Activités si activite est vide)
-- - budgetTotal (peut être utilisé si budgetPrevisionnel est vide)
-- - budgetT1, budgetT2, budgetT3, budgetT4 (Plan d'engagement trimestriel)
-- - tauxPhysique (État d'exécution - Physique %)
-- - tauxFinancier (État d'exécution - Financière %)
-- - echeance (Échéance)
-- - commentaire (Commentaires)

