/**
 * Middleware de validation des données d'action
 */
function validateAction(req, res, next) {
  const { intitule, programme, responsable, echeance } = req.body;

  const errors = [];

  if (!intitule || intitule.trim() === '') {
    errors.push('L\'intitulé est obligatoire');
  }

  if (!programme || programme.trim() === '') {
    errors.push('Le programme est obligatoire');
  }

  if (!responsable || responsable.trim() === '') {
    errors.push('Le responsable est obligatoire');
  }

  if (!echeance) {
    errors.push('L\'échéance est obligatoire');
  } else {
    // Vérifier le format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(echeance)) {
      errors.push('L\'échéance doit être au format YYYY-MM-DD');
    }
  }

  // Validation des taux
  if (req.body.tauxPhysique !== undefined) {
    const taux = parseFloat(req.body.tauxPhysique);
    if (isNaN(taux) || taux < 0 || taux > 100) {
      errors.push('Le taux physique doit être entre 0 et 100');
    }
  }

  if (req.body.tauxFinancier !== undefined) {
    const taux = parseFloat(req.body.tauxFinancier);
    if (isNaN(taux) || taux < 0 || taux > 100) {
      errors.push('Le taux financier doit être entre 0 et 100');
    }
  }

  // Validation du statut
  if (req.body.statut) {
    const statutsValides = ['À démarrer', 'En cours', 'En retard', 'Achevé'];
    if (!statutsValides.includes(req.body.statut)) {
      errors.push('Statut invalide');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
}

/**
 * Middleware de validation des données utilisateur
 */
function validateUser(req, res, next) {
  const { username, fullName, role } = req.body;

  const errors = [];

  if (!username || username.trim() === '') {
    errors.push('Le nom d\'utilisateur est obligatoire');
  }

  if (!fullName || fullName.trim() === '') {
    errors.push('Le nom complet est obligatoire');
  }

  if (!role) {
    errors.push('Le rôle est obligatoire');
  } else {
    const rolesValides = ['Ministre', 'Directeur de Cabinet', 'Directeur', 'Admin'];
    if (!rolesValides.includes(role)) {
      errors.push('Rôle invalide');
    }
  }

  // Si le rôle est Directeur, le programme est obligatoire
  if (role === 'Directeur' && (!req.body.programme || req.body.programme.trim() === '')) {
    errors.push('Le programme est obligatoire pour un Directeur');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
}

/**
 * Middleware de protection XSS - échappe les entrées utilisateur
 */
function sanitizeInputs(req, res, next) {
  const escapeHtml = (text) => {
    if (typeof text !== 'string') return text;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, (m) => map[m]);
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    // Gérer les tableaux
    if (Array.isArray(obj)) {
      return obj.map(item => {
        if (typeof item === 'string') {
          return escapeHtml(item);
        } else if (typeof item === 'object') {
          return sanitizeObject(item);
        }
        return item;
      });
    }
    
    // Gérer les objets
    const sanitized = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = escapeHtml(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}

module.exports = {
  validateAction,
  validateUser,
  sanitizeInputs
};

