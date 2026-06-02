/**
 * Modèle ActionVersion — versioning (snapshot) complet de la table actions.
 *
 * Avant un import « remplacer tout » ou une restauration, on archive l'état courant
 * des actions dans actionVersions (métadonnées) + actionVersionRows (copie JSONB de
 * chaque ligne). Une version peut ensuite être restaurée ou ré-exportée.
 */

const pool = require('../config/database');
const Action = require('./Action');

const SNAPSHOT_SELECT = 'SELECT * FROM actions ORDER BY sortIndex NULLS LAST, id';

const ActionVersion = {
  /**
   * Crée un snapshot complet des actions courantes.
   * @param {object} db  client transactionnel (pool.connect()) ou le pool lui-même
   */
  async snapshotCurrent(db, { label, reason = null, source = 'manual', userId = null }) {
    const rows = (await db.query(SNAPSHOT_SELECT)).rows;

    const version = (await db.query(
      `INSERT INTO actionVersions (label, reason, source, actionCount, createdBy)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [label, reason, source, rows.length, userId]
    )).rows[0];

    for (const row of rows) {
      await db.query(
        `INSERT INTO actionVersionRows (versionId, data) VALUES ($1, $2)`,
        [version.id, row] // node-pg sérialise l'objet en JSONB
      );
    }

    return version;
  },

  /** Liste des versions (sans les lignes), plus récentes d'abord. */
  async findAll() {
    const result = await pool.query(
      `SELECT v.*, u.fullName AS createdByName
       FROM actionVersions v
       LEFT JOIN users u ON v.createdBy = u.id
       ORDER BY v.createdAt DESC`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM actionVersions WHERE id = $1', [id]);
    return result.rows[0];
  },

  /** Lignes d'actions d'une version (objets JSONB). */
  async findRows(versionId) {
    const result = await pool.query(
      'SELECT data FROM actionVersionRows WHERE versionId = $1 ORDER BY id',
      [versionId]
    );
    return result.rows.map((r) => r.data);
  },

  /**
   * Restaure une version : remplace toutes les actions par celles du snapshot.
   * @param {object} db  client transactionnel
   * @returns {number} nombre d'actions restaurées
   */
  async restore(db, versionId) {
    const rows = (await db.query(
      'SELECT data FROM actionVersionRows WHERE versionId = $1 ORDER BY id',
      [versionId]
    )).rows.map((r) => r.data);

    await Action.deleteAll(db);
    let count = 0;
    for (const data of rows) {
      await Action.insertFromObject(db, data, { lastModifiedBy: data.lastmodifiedby || null });
      count++;
    }
    return count;
  },
};

module.exports = ActionVersion;
