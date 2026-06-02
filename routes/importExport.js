/**
 * Routes Import / Export xlsx + Versioning des actions.
 * Montées sous /api/actions (AVANT le routeur actions générique pour que /import,
 * /export et /versions ne soient pas capturés par GET /:id).
 *
 * - POST   /api/actions/import                (Admin) corps brut xlsx -> remplace tout
 * - GET    /api/actions/export                (auth)  télécharge le xlsx courant
 * - GET    /api/actions/versions              (Admin) liste des snapshots
 * - GET    /api/actions/versions/:id/export   (Admin) exporte un snapshot
 * - POST   /api/actions/versions/:id/restore  (Admin) restaure un snapshot
 */

const express = require('express');
const pool = require('../config/database');
const Action = require('../models/Action');
const ActionVersion = require('../models/ActionVersion');
const UserAssignment = require('../models/UserAssignment');
const xlsxMapper = require('../services/xlsxMapper');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function nowLabel() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Limite la liste d'actions au périmètre d'un Directeur. */
async function scopeForUser(user, actions) {
  if (!user || user.role !== 'Directeur') return actions;
  const assignments = await UserAssignment.findByUserId(user.id);
  if (assignments.some((a) => a.assignmenttype === 'all')) return actions;
  const progs = assignments.filter((a) => a.assignmenttype === 'programme').map((a) => a.assignmentvalue);
  const ids = assignments.filter((a) => a.assignmenttype === 'action').map((a) => parseInt(a.assignmentvalue, 10));
  return actions.filter((a) => progs.includes(a.programme) || ids.includes(a.id));
}

// ---------------------------------------------------------------------------
// POST /import — remplace toutes les actions par le contenu du xlsx
// ---------------------------------------------------------------------------
router.post(
  '/import',
  authenticateJWT,
  requireRole('Admin'),
  express.raw({ type: () => true, limit: '25mb' }),
  async (req, res) => {
    const buffer = req.body;
    if (!buffer || !buffer.length) {
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }

    let parsed;
    try {
      parsed = await xlsxMapper.parseWorkbook(buffer);
    } catch (err) {
      console.error('Erreur lecture xlsx:', err);
      return res.status(400).json({ error: 'Fichier xlsx illisible : ' + err.message });
    }
    if (!parsed.actions.length) {
      return res.status(400).json({ error: 'Aucune ligne exploitable dans le fichier' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const version = await ActionVersion.snapshotCurrent(client, {
        label: `Avant import ${nowLabel()}`,
        reason: `Import xlsx (${parsed.actions.length} lignes)`,
        source: 'pre-import',
        userId: req.user.id,
      });
      await Action.deleteAll(client);
      const importedCount = await Action.bulkInsert(client, parsed.actions, req.user.id);
      await client.query('COMMIT');

      res.json({
        importedCount,
        snapshotVersionId: version.id,
        snapshotCount: version.actioncount,
        sheetName: parsed.sheetName,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erreur import:', err);
      res.status(500).json({ error: 'Erreur lors de l\'import : ' + err.message });
    } finally {
      client.release();
    }
  }
);

// ---------------------------------------------------------------------------
// GET /export — télécharge l'état courant au format xlsx
// ---------------------------------------------------------------------------
router.get('/export', authenticateJWT, async (req, res) => {
  try {
    let actions = await Action.findAll();
    actions = await scopeForUser(req.user, actions);

    // Filtres optionnels : permet d'exporter la vue filtrée de la page Actions
    const { programme, statut, search } = req.query;
    if (programme) actions = actions.filter((a) => a.programme === programme);
    if (statut) actions = actions.filter((a) => a.statut === statut);
    if (search) {
      const q = String(search).toLowerCase();
      actions = actions.filter((a) =>
        (a.intitule || '').toLowerCase().includes(q) ||
        (a.responsable || '').toLowerCase().includes(q) ||
        (a.programme || '').toLowerCase().includes(q) ||
        (a.activite || '').toLowerCase().includes(q));
    }

    const buffer = await xlsxMapper.buildWorkbook(actions);
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="Plan d\'actions MHA 2026 - export.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error('Erreur export:', err);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

// ---------------------------------------------------------------------------
// GET /versions — liste des snapshots
// ---------------------------------------------------------------------------
router.get('/versions', authenticateJWT, requireRole('Admin'), async (req, res) => {
  try {
    res.json(await ActionVersion.findAll());
  } catch (err) {
    console.error('Erreur liste versions:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// GET /versions/:id/export — exporte un snapshot au format xlsx
// ---------------------------------------------------------------------------
router.get('/versions/:id/export', authenticateJWT, requireRole('Admin'), async (req, res) => {
  try {
    const version = await ActionVersion.findById(req.params.id);
    if (!version) return res.status(404).json({ error: 'Version introuvable' });
    const rows = await ActionVersion.findRows(req.params.id);
    const buffer = await xlsxMapper.buildWorkbook(rows);
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', `attachment; filename="Plan d'actions - version ${version.id}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    console.error('Erreur export version:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST /versions/:id/restore — restaure un snapshot (avec snapshot de sécurité)
// ---------------------------------------------------------------------------
router.post('/versions/:id/restore', authenticateJWT, requireRole('Admin'), async (req, res) => {
  const versionId = req.params.id;
  const client = await pool.connect();
  try {
    const version = await ActionVersion.findById(versionId);
    if (!version) {
      client.release();
      return res.status(404).json({ error: 'Version introuvable' });
    }

    await client.query('BEGIN');
    const safety = await ActionVersion.snapshotCurrent(client, {
      label: `Avant restauration ${nowLabel()}`,
      reason: `Restauration de la version #${versionId}`,
      source: 'pre-restore',
      userId: req.user.id,
    });
    const restoredCount = await ActionVersion.restore(client, versionId);
    await client.query('COMMIT');

    res.json({ restoredCount, safetyVersionId: safety.id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur restauration:', err);
    res.status(500).json({ error: 'Erreur lors de la restauration : ' + err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
