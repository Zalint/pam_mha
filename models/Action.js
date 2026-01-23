const pool = require('../config/database');

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
      'indicateursResultats', 'budgetPrevisionnel'
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
}

module.exports = Action;

