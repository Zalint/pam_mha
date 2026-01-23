const express = require('express');
const Action = require('../models/Action');
const { authenticateAPIKey } = require('../middleware/auth');
const { sanitizeInputs } = require('../middleware/validation');

const router = express.Router();

/**
 * API Externe - Routes identiques aux routes internes mais avec authentification par API key
 * Permet aux systèmes externes d'accéder aux données du PAM
 */

/**
 * GET /api/external/actions
 * Récupère toutes les actions
 */
router.get('/actions', authenticateAPIKey, async (req, res) => {
  try {
    const filters = {};

    if (req.query.programme) {
      filters.programme = req.query.programme;
    }

    if (req.query.statut) {
      filters.statut = req.query.statut;
    }

    if (req.query.responsable) {
      filters.responsable = req.query.responsable;
    }

    const actions = await Action.findAll(filters);
    res.json(actions);
  } catch (err) {
    console.error('Erreur récupération actions (externe):', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/external/actions/:id
 * Récupère une action par ID
 */
router.get('/actions/:id', authenticateAPIKey, async (req, res) => {
  try {
    const action = await Action.findById(req.params.id);

    if (!action) {
      return res.status(404).json({ error: 'Action non trouvée' });
    }

    res.json(action);
  } catch (err) {
    console.error('Erreur récupération action (externe):', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/external/actions
 * Crée une nouvelle action
 */
router.post('/actions', authenticateAPIKey, sanitizeInputs, async (req, res) => {
  try {
    // Validation simple
    if (!req.body.intitule || !req.body.programme || !req.body.responsable || !req.body.echeance) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const actionData = {
      ...req.body,
      lastModifiedBy: null // API externe
    };

    const newAction = await Action.create(actionData);
    res.status(201).json(newAction);
  } catch (err) {
    console.error('Erreur création action (externe):', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/external/actions/:id
 * Met à jour une action
 */
router.put('/actions/:id', authenticateAPIKey, sanitizeInputs, async (req, res) => {
  try {
    const actionId = req.params.id;
    
    const oldAction = await Action.findById(actionId);

    if (!oldAction) {
      return res.status(404).json({ error: 'Action non trouvée' });
    }

    const updatedAction = await Action.update(actionId, req.body, null);
    res.json(updatedAction);
  } catch (err) {
    console.error('Erreur mise à jour action (externe):', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/external/statistics
 * Récupère les statistiques
 */
router.get('/statistics', authenticateAPIKey, async (req, res) => {
  try {
    const programme = req.query.programme || null;
    const stats = await Action.getStatistics(programme);

    const statutMap = {
      'À démarrer': 0,
      'En cours': 0,
      'En retard': 0,
      'Achevé': 0
    };

    let total = 0;
    stats.parStatut.forEach(s => {
      statutMap[s.statut] = parseInt(s.total);
      total += parseInt(s.total);
    });

    res.json({
      total,
      parStatut: statutMap,
      enRetard: statutMap['En retard'],
      acheve: statutMap['Achevé'],
      tauxAvancementPhysique: parseFloat(stats.moyennes.avgphysique || 0).toFixed(2),
      tauxAvancementFinancier: parseFloat(stats.moyennes.avgfinancier || 0).toFixed(2)
    });
  } catch (err) {
    console.error('Erreur récupération statistiques (externe):', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/external/programmes
 * Récupère la liste des programmes
 */
router.get('/programmes', authenticateAPIKey, async (req, res) => {
  try {
    const programmes = await Action.getProgrammes();
    res.json(programmes);
  } catch (err) {
    console.error('Erreur récupération programmes (externe):', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

