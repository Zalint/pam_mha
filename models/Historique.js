const pool = require('../config/database');

class Historique {
  /**
   * Crée une entrée d'historique
   */
  static async create({ actionId, userId, champModifie, ancienneValeur, nouvelleValeur, commentaire = null }) {
    const result = await pool.query(
      `INSERT INTO historique (actionId, userId, champModifie, ancienneValeur, nouvelleValeur, commentaire) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [actionId, userId, champModifie, ancienneValeur, nouvelleValeur, commentaire]
    );
    return result.rows[0];
  }

  /**
   * Récupère l'historique d'une action
   */
  static async findByActionId(actionId, limit = 50) {
    const result = await pool.query(
      `SELECT h.*, u.fullName as userName 
       FROM historique h 
       JOIN users u ON h.userId = u.id 
       WHERE h.actionId = $1 
       ORDER BY h.createdAt DESC 
       LIMIT $2`,
      [actionId, limit]
    );
    return result.rows;
  }

  /**
   * Récupère l'historique récent (toutes actions confondues)
   */
  static async getRecent(limit = 100) {
    const result = await pool.query(
      `SELECT h.*, u.fullName as userName, a.intitule as actionIntitule 
       FROM historique h 
       JOIN users u ON h.userId = u.id 
       JOIN actions a ON h.actionId = a.id 
       ORDER BY h.createdAt DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Enregistre les modifications multiples lors d'une mise à jour d'action
   */
  static async logChanges(actionId, userId, oldData, newData, commentaire = null) {
    const changes = [];
    
    const fieldsToTrack = [
      'programme', 'intitule', 'responsable', 'echeance', 'tauxPhysique', 
      'tauxFinancier', 'statut', 'budgetTotal', 'commentaire'
    ];

    for (const field of fieldsToTrack) {
      if (newData[field] !== undefined && String(oldData[field]) !== String(newData[field])) {
        changes.push({
          actionId,
          userId,
          champModifie: field,
          ancienneValeur: String(oldData[field] || ''),
          nouvelleValeur: String(newData[field] || ''),
          commentaire
        });
      }
    }

    // Enregistrer tous les changements
    for (const change of changes) {
      await this.create(change);
    }

    return changes.length;
  }
}

module.exports = Historique;

