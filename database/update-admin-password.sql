-- ============================================================================
-- Mise à jour du mot de passe administrateur
-- Nouveau mot de passe: Mha@2024@!!
-- ============================================================================

-- Mettre à jour le mot de passe de l'administrateur
UPDATE users 
SET passwordhash = '$2b$10$u.eVU2esDoSc1avpxJYiP.8w14CPCupMSCBhyOhwxLocottimdJMq' 
WHERE username = 'admin';

-- Vérifier la mise à jour
SELECT username, fullname, role, createdat 
FROM users 
WHERE username = 'admin';

-- ============================================================================
-- Message de confirmation
-- ============================================================================
SELECT '✅ Mot de passe admin mis à jour avec succès!' AS message;
SELECT 'Nouveau mot de passe: Mha@2024@!!' AS info;

