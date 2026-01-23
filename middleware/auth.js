const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

/**
 * Middleware d'authentification JWT (pour le frontend/PWA)
 */
async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth] Token manquant');
    return res.status(401).json({ error: 'Token d\'authentification manquant' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    console.log('[Auth] Token décodé:', { id: decoded.id, username: decoded.username, role: decoded.role });
    
    // Récupérer les informations complètes de l'utilisateur
    const user = await User.findById(decoded.id);
    console.log('[Auth] Utilisateur trouvé:', user ? { id: user.id, username: user.username, role: user.role, isActive: user.isactive } : 'NULL');
    
    if (!user) {
      console.log('[Auth] Utilisateur non trouvé en DB');
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    if (!user.isactive) {
      console.log('[Auth] Utilisateur désactivé');
      return res.status(401).json({ error: 'Utilisateur désactivé' });
    }

    // Attacher l'utilisateur à la requête
    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullname,
      role: user.role
    };

    console.log('[Auth] Authentification réussie pour', user.username);
    next();
  } catch (err) {
    console.error('[Auth] Erreur:', err.message, err.name);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    return res.status(403).json({ error: 'Token invalide' });
  }
}

/**
 * Middleware d'authentification par API key (pour les API externes)
 */
function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key manquante' });
  }

  if (apiKey !== config.api.externalKey) {
    return res.status(403).json({ error: 'API key invalide' });
  }

  // Pour les API externes, on peut créer un utilisateur virtuel
  req.user = {
    id: 0,
    username: 'external_api',
    fullName: 'API Externe',
    role: 'External'
  };

  next();
}

/**
 * Middleware de vérification des rôles (RBAC)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé pour votre rôle' });
    }

    next();
  };
}

/**
 * Middleware de vérification de périmètre (pour les Directeurs)
 */
function checkProgrammeAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  // Ministre, Directeur de Cabinet et Admin ont accès à tout
  if (['Ministre', 'Directeur de Cabinet', 'Admin'].includes(req.user.role)) {
    return next();
  }

  // Les Directeurs ne peuvent accéder qu'à leur programme
  if (req.user.role === 'Directeur') {
    const requestedProgramme = req.body.programme || req.query.programme;
    
    if (requestedProgramme && req.user.programme !== requestedProgramme) {
      return res.status(403).json({ error: 'Accès non autorisé à ce programme' });
    }
  }

  next();
}

module.exports = {
  authenticateJWT,
  authenticateAPIKey,
  requireRole,
  checkProgrammeAccess
};

