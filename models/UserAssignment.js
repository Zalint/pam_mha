/**
 * Modèle UserAssignment
 * Gestion des assignations de permissions pour les Directeurs
 */

const pool = require('../config/database');

const UserAssignment = {
  /**
   * Récupérer toutes les assignations d'un utilisateur
   */
  async findByUserId(userId) {
    const result = await pool.query(
      `SELECT * FROM userAssignments WHERE userId = $1 ORDER BY assignmentType, assignmentValue`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Créer une assignation
   */
  async create(assignmentData) {
    const { userId, assignmentType, assignmentValue, createdBy } = assignmentData;
    
    const result = await pool.query(
      `INSERT INTO userAssignments (userId, assignmentType, assignmentValue, createdBy)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, assignmentType, assignmentValue || null, createdBy || null]
    );
    
    return result.rows[0];
  },

  /**
   * Supprimer toutes les assignations d'un utilisateur
   */
  async deleteByUserId(userId) {
    await pool.query(
      `DELETE FROM userAssignments WHERE userId = $1`,
      [userId]
    );
  },

  /**
   * Supprimer une assignation spécifique
   */
  async deleteById(id) {
    await pool.query(
      `DELETE FROM userAssignments WHERE id = $1`,
      [id]
    );
  },

  /**
   * Définir les assignations d'un utilisateur (remplace toutes les assignations existantes)
   */
  async setAssignments(userId, assignments, createdBy) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Supprimer les anciennes assignations
      await client.query('DELETE FROM userAssignments WHERE userId = $1', [userId]);
      
      // Insérer les nouvelles assignations
      for (const assignment of assignments) {
        await client.query(
          `INSERT INTO userAssignments (userId, assignmentType, assignmentValue, createdBy)
           VALUES ($1, $2, $3, $4)`,
          [userId, assignment.assignmentType, assignment.assignmentValue || null, createdBy]
        );
      }
      
      await client.query('COMMIT');
      
      // Retourner les nouvelles assignations
      return await this.findByUserId(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Vérifier si un utilisateur a accès à une action
   */
  async hasAccessToAction(userId, actionId) {
    const assignments = await this.findByUserId(userId);
    
    // Vérifier "Tous"
    if (assignments.some(a => a.assignmenttype === 'all')) {
      return true;
    }
    
    // Vérifier l'action spécifique
    if (assignments.some(a => a.assignmenttype === 'action' && a.assignmentvalue === actionId.toString())) {
      return true;
    }
    
    // Vérifier le programme de l'action
    const actionResult = await pool.query(
      `SELECT programme FROM actions WHERE id = $1`,
      [actionId]
    );
    
    if (actionResult.rows.length === 0) {
      return false;
    }
    
    const programme = actionResult.rows[0].programme;
    if (assignments.some(a => a.assignmenttype === 'programme' && a.assignmentvalue === programme)) {
      return true;
    }
    
    return false;
  },

  /**
   * Récupérer toutes les actions accessibles par un utilisateur
   */
  async getAccessibleActions(userId) {
    const assignments = await this.findByUserId(userId);
    
    // Si "Tous", retourner toutes les actions
    if (assignments.some(a => a.assignmenttype === 'all')) {
      const result = await pool.query(`SELECT id FROM actions ORDER BY id`);
      return result.rows.map(r => r.id);
    }
    
    const actionIds = new Set();
    
    // Ajouter les actions assignées directement
    assignments
      .filter(a => a.assignmenttype === 'action')
      .forEach(a => actionIds.add(parseInt(a.assignmentvalue)));
    
    // Ajouter les actions des programmes assignés
    const programmes = assignments
      .filter(a => a.assignmenttype === 'programme')
      .map(a => a.assignmentvalue);
    
    if (programmes.length > 0) {
      const result = await pool.query(
        `SELECT id FROM actions WHERE programme = ANY($1)`,
        [programmes]
      );
      result.rows.forEach(r => actionIds.add(r.id));
    }
    
    return Array.from(actionIds).sort((a, b) => a - b);
  },

  /**
   * Récupérer tous les programmes accessibles par un utilisateur
   */
  async getAccessibleProgrammes(userId) {
    const assignments = await this.findByUserId(userId);
    
    // Si "Tous", retourner tous les programmes
    if (assignments.some(a => a.assignmenttype === 'all')) {
      const result = await pool.query(
        `SELECT DISTINCT programme FROM actions WHERE programme IS NOT NULL ORDER BY programme`
      );
      return result.rows.map(r => r.programme);
    }
    
    const programmes = new Set();
    
    // Ajouter les programmes assignés directement
    assignments
      .filter(a => a.assignmenttype === 'programme')
      .forEach(a => programmes.add(a.assignmentvalue));
    
    // Ajouter les programmes des actions assignées
    const actionIds = assignments
      .filter(a => a.assignmenttype === 'action')
      .map(a => parseInt(a.assignmentvalue));
    
    if (actionIds.length > 0) {
      const result = await pool.query(
        `SELECT DISTINCT programme FROM actions WHERE id = ANY($1) AND programme IS NOT NULL`,
        [actionIds]
      );
      result.rows.forEach(r => programmes.add(r.programme));
    }
    
    return Array.from(programmes).sort();
  },

  /**
   * Résumé des assignations (pour affichage)
   */
  async getSummary(userId) {
    const assignments = await this.findByUserId(userId);
    
    if (assignments.length === 0) {
      return { type: 'none', count: 0 };
    }
    
    // Vérifier "Tous"
    if (assignments.some(a => a.assignmenttype === 'all')) {
      return { type: 'all', count: 'all' };
    }
    
    // Compter les programmes et actions
    const programmes = assignments.filter(a => a.assignmenttype === 'programme').length;
    const actions = assignments.filter(a => a.assignmenttype === 'action').length;
    
    return {
      type: 'partial',
      programmes,
      actions,
      total: programmes + actions
    };
  }
};

module.exports = UserAssignment;

