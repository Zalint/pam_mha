const express = require('express');
const pool = require('../config/database');
const Action = require('../models/Action');
const ActionVersion = require('../models/ActionVersion');
const xlsxMapper = require('../services/xlsxMapper');
const { authenticateAPIKey } = require('../middleware/auth');
const { sanitizeInputs } = require('../middleware/validation');

const router = express.Router();

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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

/**
 * GET /api/external/actions/export
 * Exporte toutes les actions au format xlsx (équivalent externe de GET /api/actions/export)
 */
router.get('/actions/export', authenticateAPIKey, async (req, res) => {
  try {
    const actions = await Action.findAll();
    const buffer = await xlsxMapper.buildWorkbook(actions);
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="Plan d\'actions MHA 2026 - export.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error('Erreur export (externe):', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/external/actions/import
 * Remplace toutes les actions par le contenu d'un xlsx (corps brut).
 */
router.post('/actions/import', authenticateAPIKey, express.raw({ type: () => true, limit: '25mb' }), async (req, res) => {
  const buffer = req.body;
  if (!buffer || !buffer.length) {
    return res.status(400).json({ error: 'Aucun fichier reçu' });
  }
  let parsed;
  try {
    parsed = await xlsxMapper.parseWorkbook(buffer);
  } catch (err) {
    return res.status(400).json({ error: 'Fichier xlsx illisible : ' + err.message });
  }
  if (!parsed.actions.length) {
    return res.status(400).json({ error: 'Aucune ligne exploitable dans le fichier' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const version = await ActionVersion.snapshotCurrent(client, {
      label: `Avant import API ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      reason: `Import xlsx via API externe (${parsed.actions.length} lignes)`,
      source: 'pre-import',
      userId: null,
    });
    await Action.deleteAll(client);
    const importedCount = await Action.bulkInsert(client, parsed.actions, null);
    await client.query('COMMIT');
    res.json({ importedCount, snapshotVersionId: version.id, snapshotCount: version.actioncount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur import (externe):', err);
    res.status(500).json({ error: 'Erreur lors de l\'import : ' + err.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/external/actions/versions
 * Liste des snapshots de versioning
 */
router.get('/actions/versions', authenticateAPIKey, async (req, res) => {
  try {
    res.json(await ActionVersion.findAll());
  } catch (err) {
    console.error('Erreur liste versions (externe):', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

