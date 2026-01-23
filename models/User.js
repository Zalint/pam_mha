const pool = require('../config/database');

class User {
  /**
   * Trouve un utilisateur par username
   */
  static async findByUsername(username) {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  /**
   * Trouve un utilisateur par ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT id, username, fullname, role, isactive, createdat, updatedat FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Récupère tous les utilisateurs (sans les mots de passe)
   */
  static async findAll() {
    const result = await pool.query(
      'SELECT id, username, fullname, role, isactive, createdat, updatedat FROM users ORDER BY fullname'
    );
    return result.rows;
  }

  /**
   * Crée un nouvel utilisateur
   */
  static async create({ username, passwordHash, fullName, role }) {
    const result = await pool.query(
      'INSERT INTO users (username, passwordhash, fullname, role) VALUES ($1, $2, $3, $4) RETURNING id, username, fullname, role, createdat',
      [username, passwordHash, fullName, role]
    );
    return result.rows[0];
  }

  /**
   * Met à jour un utilisateur
   */
  static async update(id, { fullName, role, isActive }) {
    const result = await pool.query(
      'UPDATE users SET fullname = $1, role = $2, isactive = $3 WHERE id = $4 RETURNING id, username, fullname, role, isactive, updatedat',
      [fullName, role, isActive, id]
    );
    return result.rows[0];
  }

  /**
   * Change le mot de passe d'un utilisateur
   */
  static async updatePassword(id, passwordHash) {
    await pool.query(
      'UPDATE users SET passwordhash = $1 WHERE id = $2',
      [passwordHash, id]
    );
  }

  /**
   * Supprime un utilisateur
   */
  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

module.exports = User;

