/**
 * Middleware de vérification d'accès aux ressources
 */

const UserAssignment = require('../models/UserAssignment');
const Action = require('../models/Action');

/**
 * Vérifie si l'utilisateur a accès à une action spécifique
 */
async function checkAccessToAction(req, res, next) {
  const { id: actionId } = req.params;
  const user = req.user;
  
  // Admin : accès complet
  if (user.role === 'Admin') {
    return next();
  }
  
  // Ministre : accès en lecture seule (vérifié par d'autres middlewares)
  if (user.role === 'Ministre') {
    return next();
  }
  
  // Directeur : vérifier les assignations
  if (user.role === 'Directeur') {
    try {
      const hasAccess = await UserAssignment.hasAccessToAction(user.id, actionId);
      
      if (hasAccess) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Accès refusé : vous n\'avez pas les permissions nécessaires pour cette action' 
      });
    } catch (error) {
      console.error('Erreur vérification accès:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }
  
  return res.status(403).json({ error: 'Accès refusé' });
}

/**
 * Vérifie si l'utilisateur peut modifier une ressource
 */
async function checkWriteAccess(req, res, next) {
  const user = req.user;
  
  // Admin et Directeur peuvent modifier
  if (user.role === 'Admin' || user.role === 'Directeur') {
    return next();
  }
  
  // Ministre : lecture seule
  if (user.role === 'Ministre') {
    return res.status(403).json({ 
      error: 'Accès refusé : vous avez un accès en lecture seule' 
    });
  }
  
  return res.status(403).json({ error: 'Accès refusé' });
}

/**
 * Vérifie si l'utilisateur est Admin
 */
function checkAdminAccess(req, res, next) {
  if (req.user.role === 'Admin') {
    return next();
  }
  
  return res.status(403).json({ 
    error: 'Accès refusé : action réservée aux administrateurs' 
  });
}

/**
 * Filtre les actions selon les permissions de l'utilisateur
 */
async function filterActionsByAccess(req, res, next) {
  const user = req.user;
  
  // Admin et Ministre : voir toutes les actions
  if (user.role === 'Admin' || user.role === 'Ministre') {
    return next();
  }
  
  // Directeur : filtrer selon les assignations
  if (user.role === 'Directeur') {
    try {
      const accessibleActionIds = await UserAssignment.getAccessibleActions(user.id);
      req.accessibleActionIds = accessibleActionIds;
      return next();
    } catch (error) {
      console.error('Erreur filtrage actions:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }
  
  return res.status(403).json({ error: 'Accès refusé' });
}

module.exports = {
  checkAccessToAction,
  checkWriteAccess,
  checkAdminAccess,
  filterActionsByAccess
};

