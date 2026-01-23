const express = require('express');
const Action = require('../models/Action');
const Historique = require('../models/Historique');
const UserAssignment = require('../models/UserAssignment');
const { authenticateJWT, checkProgrammeAccess } = require('../middleware/auth');
const { validateAction, sanitizeInputs } = require('../middleware/validation');

const router = express.Router();

/**
 * GET /api/actions
 * Récupère toutes les actions (avec filtres optionnels)
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const filters = {};

    // Appliquer les filtres de requête
    if (req.query.programme) {
      filters.programme = req.query.programme;
    }

    if (req.query.statut) {
      filters.statut = req.query.statut;
    }

    if (req.query.responsable) {
      filters.responsable = req.query.responsable;
    }

    // Récupérer toutes les actions avec filtres
    let actions = await Action.findAll(filters);

    // Les Directeurs ne voient que leurs actions assignées
    if (req.user.role === 'Directeur') {
      const assignments = await UserAssignment.findByUserId(req.user.id);
      const hasFullAccess = assignments.some(a => a.assignmenttype === 'all');
      
      if (!hasFullAccess) {
        const assignedProgrammes = assignments
          .filter(a => a.assignmenttype === 'programme')
          .map(a => a.assignmentvalue);
        
        const assignedActions = assignments
          .filter(a => a.assignmenttype === 'action')
          .map(a => parseInt(a.assignmentvalue));
        
        // Filtrer les actions
        actions = actions.filter(action => 
          assignedProgrammes.includes(action.programme) || 
          assignedActions.includes(action.id)
        );
      }
    }

    res.json(actions);
  } catch (err) {
    console.error('Erreur récupération actions:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/actions/:id
 * Récupère une action par ID
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const action = await Action.findById(req.params.id);

    if (!action) {
      return res.status(404).json({ error: 'Action non trouvée' });
    }

    // Vérifier le périmètre pour les Directeurs
    if (req.user.role === 'Directeur') {
      const assignments = await UserAssignment.findByUserId(req.user.id);
      const hasFullAccess = assignments.some(a => a.assignmenttype === 'all');
      
      if (!hasFullAccess) {
        const assignedProgrammes = assignments
          .filter(a => a.assignmenttype === 'programme')
          .map(a => a.assignmentvalue);
        
        const assignedActions = assignments
          .filter(a => a.assignmenttype === 'action')
          .map(a => parseInt(a.assignmentvalue));
        
        const hasAccess = assignedProgrammes.includes(action.programme) || 
                         assignedActions.includes(action.id);
        
        if (!hasAccess) {
          return res.status(403).json({ error: 'Accès non autorisé' });
        }
      }
    }

    res.json(action);
  } catch (err) {
    console.error('Erreur récupération action:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/actions
 * Crée une nouvelle action
 */
router.post('/', authenticateJWT, sanitizeInputs, validateAction, checkProgrammeAccess, async (req, res) => {
  try {
    const actionData = {
      ...req.body,
      lastModifiedBy: req.user.id
    };

    const newAction = await Action.create(actionData);

    // Enregistrer dans l'historique
    await Historique.create({
      actionId: newAction.id,
      userId: req.user.id,
      champModifie: 'création',
      ancienneValeur: '',
      nouvelleValeur: 'Action créée',
      commentaire: req.body.commentaire
    });

    res.status(201).json(newAction);
  } catch (err) {
    console.error('Erreur création action:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/actions/:id
 * Met à jour une action (Admin ou Directeur assigné)
 */
router.put('/:id', authenticateJWT, sanitizeInputs, checkProgrammeAccess, async (req, res) => {
  try {
    const actionId = req.params.id;
    
    // Récupérer l'action existante
    const oldAction = await Action.findById(actionId);

    if (!oldAction) {
      return res.status(404).json({ error: 'Action non trouvée' });
    }

    // Vérifier le périmètre pour les Directeurs
    if (req.user.role === 'Directeur') {
      const assignments = await UserAssignment.findByUserId(req.user.id);
      const hasFullAccess = assignments.some(a => a.assignmenttype === 'all');
      
      if (!hasFullAccess) {
        const assignedProgrammes = assignments
          .filter(a => a.assignmenttype === 'programme')
          .map(a => a.assignmentvalue);
        
        const assignedActions = assignments
          .filter(a => a.assignmenttype === 'action')
          .map(a => parseInt(a.assignmentvalue));
        
        const hasAccess = assignedProgrammes.includes(oldAction.programme) || 
                         assignedActions.includes(parseInt(actionId));
        
        if (!hasAccess) {
          return res.status(403).json({ error: 'Accès non autorisé : cette action n\'est pas assignée à votre compte' });
        }
      }
    }

    // Mettre à jour l'action
    const updatedAction = await Action.update(actionId, req.body, req.user.id);

    // Enregistrer les changements dans l'historique
    await Historique.logChanges(actionId, req.user.id, oldAction, req.body, req.body.commentaire);

    res.json(updatedAction);
  } catch (err) {
    console.error('Erreur mise à jour action:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/actions/:id
 * Supprime une action (Admin ou Directeur assigné)
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const actionId = req.params.id;
    const action = await Action.findById(actionId);

    if (!action) {
      return res.status(404).json({ error: 'Action non trouvée' });
    }

    // Vérifier les permissions
    if (req.user.role === 'Directeur') {
      const assignments = await UserAssignment.findByUserId(req.user.id);
      const hasFullAccess = assignments.some(a => a.assignmenttype === 'all');
      
      if (!hasFullAccess) {
        const assignedProgrammes = assignments
          .filter(a => a.assignmenttype === 'programme')
          .map(a => a.assignmentvalue);
        
        const assignedActions = assignments
          .filter(a => a.assignmenttype === 'action')
          .map(a => parseInt(a.assignmentvalue));
        
        const hasAccess = assignedProgrammes.includes(action.programme) || 
                         assignedActions.includes(parseInt(actionId));
        
        if (!hasAccess) {
          return res.status(403).json({ error: 'Accès non autorisé : cette action n\'est pas assignée à votre compte' });
        }
      }
    } else if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Accès refusé : vous n\'avez pas les permissions pour supprimer des actions' });
    }

    // Supprimer l'action
    await Action.delete(actionId);
    
    res.json({ message: 'Action supprimée avec succès' });
  } catch (err) {
    console.error('Erreur suppression action:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/actions/:id/historique
 * Récupère l'historique d'une action
 */
router.get('/:id/historique', authenticateJWT, async (req, res) => {
  try {
    const action = await Action.findById(req.params.id);

    if (!action) {
      return res.status(404).json({ error: 'Action non trouvée' });
    }

    // Vérifier le périmètre pour les Directeurs
    if (req.user.role === 'Directeur' && req.user.programme !== action.programme) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const historique = await Historique.findByActionId(req.params.id);
    res.json(historique);
  } catch (err) {
    console.error('Erreur récupération historique:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

