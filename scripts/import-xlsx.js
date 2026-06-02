/**
 * Chargement initial des données depuis "Plan d'actions MHA 2026.xlsx".
 *
 * Versionne (snapshot) les actions existantes, puis les remplace intégralement par
 * le contenu du fichier xlsx — la même logique que la route POST /api/actions/import,
 * exécutable en ligne de commande.
 *
 * Usage :
 *   node scripts/import-xlsx.js ["chemin/vers/fichier.xlsx"]
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const xlsxMapper = require('../services/xlsxMapper');
const Action = require('../models/Action');
const ActionVersion = require('../models/ActionVersion');

function nowLabel() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function main() {
  const file = process.argv[2] || path.join(__dirname, '..', "Plan d'actions MHA 2026.xlsx");
  if (!fs.existsSync(file)) {
    console.error('Fichier introuvable :', file);
    process.exit(1);
  }

  console.log('Lecture du fichier :', file);
  const buffer = fs.readFileSync(file);
  const { sheetName, actions } = await xlsxMapper.parseWorkbook(buffer);
  console.log(`Feuille "${sheetName}" : ${actions.length} lignes exploitables.`);
  if (!actions.length) {
    console.error('Aucune ligne à importer. Abandon.');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const before = (await client.query('SELECT COUNT(*)::int AS n FROM actions')).rows[0].n;
    const version = await ActionVersion.snapshotCurrent(client, {
      label: `Avant import ${nowLabel()}`,
      reason: `Import initial xlsx (${actions.length} lignes)`,
      source: 'pre-import',
      userId: null,
    });
    console.log(`Snapshot version #${version.id} créé (${before} actions archivées).`);

    await Action.deleteAll(client);
    const imported = await Action.bulkInsert(client, actions, null);

    await client.query('COMMIT');
    console.log(`✔ Import terminé : ${imported} actions chargées (snapshot #${version.id} pour rollback).`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Echec de l\'import, rollback effectue :', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
