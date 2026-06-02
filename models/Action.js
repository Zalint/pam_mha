const pool = require('../config/database');

// Helpers internes ---------------------------------------------------------
function firstNonEmpty(...vals) {
  for (const v of vals) if (v !== null && v !== undefined && String(v).trim() !== '') return v;
  return null;
}
function numOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}
function clampPct(v) {
  const n = Number(v);
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

class Action {
  /**
   * Récupère toutes les actions avec filtres optionnels
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT a.*, u.fullName as lastModifiedByName 
      FROM actions a 
      LEFT JOIN users u ON a.lastModifiedBy = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.programme) {
      query += ` AND a.programme = $${paramIndex}`;
      params.push(filters.programme);
      paramIndex++;
    }

    if (filters.statut) {
      query += ` AND a.statut = $${paramIndex}`;
      params.push(filters.statut);
      paramIndex++;
    }

    if (filters.responsable) {
      query += ` AND a.responsable ILIKE $${paramIndex}`;
      params.push(`%${filters.responsable}%`);
      paramIndex++;
    }

    query += ' ORDER BY a.echeance, a.programme, a.intitule';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Récupère une action par ID
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT a.*, u.fullName as lastModifiedByName 
       FROM actions a 
       LEFT JOIN users u ON a.lastModifiedBy = u.id 
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Crée une nouvelle action
   */
  static async create(actionData) {
    const {
      programme,
      sousDirection,
      intitule,
      responsable,
      echeance,
      tauxPhysique = 0,
      tauxFinancier = 0,
      statut = 'À démarrer',
      budgetTotal,
      budgetT1,
      budgetT2,
      budgetT3,
      budgetT4,
      commentaire,
      action,
      activite,
      resultatsAttendus,
      indicateursCibles,
      indicateursResultats,
      budgetPrevisionnel,
      lastModifiedBy
    } = actionData;

    const result = await pool.query(
      `INSERT INTO actions 
       (programme, sousDirection, intitule, responsable, echeance, tauxPhysique, tauxFinancier, 
        statut, budgetTotal, budgetT1, budgetT2, budgetT3, budgetT4, commentaire,
        action, activite, resultatsAttendus, indicateursCibles, indicateursResultats, budgetPrevisionnel,
        lastModifiedBy) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) 
       RETURNING *`,
      [programme, sousDirection, intitule, responsable, echeance, tauxPhysique, tauxFinancier,
       statut, budgetTotal, budgetT1, budgetT2, budgetT3, budgetT4, commentaire,
       action || null, activite || null, resultatsAttendus || null, indicateursCibles || null,
       indicateursResultats || null, budgetPrevisionnel || null, lastModifiedBy]
    );
    return result.rows[0];
  }

  /**
   * Met à jour une action
   */
  static async update(id, actionData, userId) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    // Construction dynamique de la requête UPDATE
    const updateableFields = [
      'programme', 'sousDirection', 'intitule', 'responsable', 'echeance',
      'tauxPhysique', 'tauxFinancier', 'statut', 'budgetTotal', 'budgetT1',
      'budgetT2', 'budgetT3', 'budgetT4', 'commentaire',
      'action', 'activite', 'resultatsAttendus', 'indicateursCibles',
      'indicateursResultats', 'budgetPrevisionnel',
      'echeanceLibelle', 'budgetPrevisionnelLibelle', 'indicateursResultatsValeur', 'sortIndex'
    ];

    for (const field of updateableFields) {
      if (actionData[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        params.push(actionData[field]);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('Aucun champ à mettre à jour');
    }

    // Toujours mettre à jour lastModifiedBy
    fields.push(`lastModifiedBy = $${paramIndex}`);
    params.push(userId);
    paramIndex++;

    // Ajouter l'ID à la fin
    params.push(id);

    const query = `UPDATE actions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Supprime une action
   */
  static async delete(id) {
    await pool.query('DELETE FROM actions WHERE id = $1', [id]);
  }

  /**
   * Récupère les statistiques globales
   */
  static async getStatistics(programme = null) {
    let query = 'SELECT COUNT(*) as total, statut FROM actions';
    const params = [];
    
    if (programme) {
      query += ' WHERE programme = $1';
      params.push(programme);
    }
    
    query += ' GROUP BY statut';

    const statutResult = await pool.query(query, params);

    // Calcul des moyennes
    let avgQuery = 'SELECT AVG(tauxPhysique) as avgPhysique, AVG(tauxFinancier) as avgFinancier FROM actions';
    if (programme) {
      avgQuery += ' WHERE programme = $1';
    }

    const avgResult = await pool.query(avgQuery, params);

    return {
      parStatut: statutResult.rows,
      moyennes: avgResult.rows[0]
    };
  }

  /**
   * Récupère les programmes distincts
   */
  static async getProgrammes() {
    const result = await pool.query(
      'SELECT DISTINCT programme FROM actions ORDER BY programme'
    );
    return result.rows.map(row => row.programme);
  }

  /**
   * Supprime toutes les actions (utilisé par l'import « remplacer tout » et la restauration).
   * @param {object} db client transactionnel (pool.connect()) ou pool
   */
  static async deleteAll(db) {
    await (db || pool).query('DELETE FROM actions');
  }

  /**
   * Insère une action à partir d'un objet à clés minuscules (sortie du mapper xlsx
   * ou ligne de snapshot). Garantit les champs NOT NULL (programme, intitule, statut).
   * @param {object} db client transactionnel ou pool
   */
  static async insertFromObject(db, obj, { lastModifiedBy = null } = {}) {
    const executor = db || pool;
    const intitule = firstNonEmpty(
      obj.intitule, obj.resultatsattendus, obj.activite, obj.action, obj.programme
    ) || '(sans intitulé)';

    const cols = [
      'programme', 'sousdirection', 'action', 'activite', 'intitule',
      'resultatsattendus', 'indicateurscibles', 'indicateursresultats', 'indicateursresultatsvaleur',
      'responsable', 'echeance', 'echeancelibelle',
      'tauxphysique', 'tauxfinancier', 'statut',
      'budgettotal', 'budgetprevisionnel', 'budgetprevisionnellibelle',
      'budgett1', 'budgett2', 'budgett3', 'budgett4',
      'commentaire', 'sortindex', 'lastmodifiedby',
    ];
    const vals = [
      firstNonEmpty(obj.programme) || '(sans programme)',
      obj.sousdirection ?? null,
      obj.action ?? null,
      obj.activite ?? null,
      String(intitule),
      obj.resultatsattendus ?? null,
      obj.indicateurscibles ?? null,
      numOrNull(obj.indicateursresultats),
      obj.indicateursresultatsvaleur ?? null,
      obj.responsable ?? null,
      obj.echeance ?? null,
      obj.echeancelibelle ?? null,
      clampPct(obj.tauxphysique),
      clampPct(obj.tauxfinancier),
      obj.statut || 'À démarrer',
      numOrNull(obj.budgettotal),
      numOrNull(obj.budgetprevisionnel),
      obj.budgetprevisionnellibelle ?? null,
      numOrNull(obj.budgett1),
      numOrNull(obj.budgett2),
      numOrNull(obj.budgett3),
      numOrNull(obj.budgett4),
      obj.commentaire ?? null,
      numOrNull(obj.sortindex),
      lastModifiedBy,
    ];
    const placeholders = cols.map((_, i) => '$' + (i + 1)).join(', ');
    const result = await executor.query(
      `INSERT INTO actions (${cols.join(', ')}) VALUES (${placeholders}) RETURNING id`,
      vals
    );
    return result.rows[0];
  }

  /**
   * Insère en masse une liste d'actions (objets à clés minuscules) dans une transaction.
   * @param {object} db client transactionnel
   * @returns {number} nombre de lignes insérées
   */
  static async bulkInsert(db, actions, userId = null) {
    let count = 0;
    for (const a of actions) {
      await this.insertFromObject(db, a, { lastModifiedBy: userId });
      count++;
    }
    return count;
  }
}

module.exports = Action;

