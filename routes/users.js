/**
 * Routes pour la gestion des utilisateurs et des assignations
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const UserAssignment = require('../models/UserAssignment');
const { authenticateJWT } = require('../middleware/auth');
const { checkAdminAccess } = require('../middleware/checkAccess');
const { sanitizeInputs } = require('../middleware/validation');

/**
 * GET /api/users
 * Liste de tous les utilisateurs (Admin uniquement)
 */
router.get('/', authenticateJWT, checkAdminAccess, async (req, res) => {
  try {
    const users = await User.findAll();
    
    // Ajouter le résumé des assignations pour chaque utilisateur
    const usersWithSummary = await Promise.all(
      users.map(async (user) => {
        if (user.role === 'Directeur') {
          const summary = await UserAssignment.getSummary(user.id);
          return { ...user, assignmentSummary: summary };
        }
        return user;
      })
    );
    
    res.json(usersWithSummary);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/users/:id
 * Détails d'un utilisateur avec ses assignations
 */
router.get('/:id', authenticateJWT, checkAdminAccess, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Récupérer les assignations si c'est un Directeur
    let assignments = [];
    if (user.role === 'Directeur') {
      assignments = await UserAssignment.findByUserId(user.id);
    }
    
    res.json({ ...user, assignments });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/users
 * Créer un nouvel utilisateur
 */
router.post('/', authenticateJWT, checkAdminAccess, sanitizeInputs, async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;
    
    // Validation
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    
    // Vérifier si le username existe déjà
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur existe déjà' });
    }
    
    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Créer l'utilisateur
    const newUser = await User.create({
      username,
      passwordHash,
      fullName,
      role
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/users/:id
 * Modifier un utilisateur
 */
router.put('/:id', authenticateJWT, checkAdminAccess, sanitizeInputs, async (req, res) => {
  try {
    const { fullName, role, isActive } = req.body;
    
    // Vérifier que l'utilisateur existe
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Empêcher un admin de se désactiver lui-même
    if (user.id === req.user.id && isActive === false) {
      return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte' });
    }
    
    // Mettre à jour l'utilisateur
    const updatedUser = await User.update(req.params.id, {
      fullName: fullName || user.fullname,
      role: role || user.role,
      isActive: isActive !== undefined ? isActive : user.isactive
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Erreur modification utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/users/:id/password
 * Changer le mot de passe d'un utilisateur
 */
router.put('/:id/password', authenticateJWT, checkAdminAccess, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    await User.updatePassword(req.params.id, passwordHash);
    
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur modification mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur
 */
router.delete('/:id', authenticateJWT, checkAdminAccess, async (req, res) => {
  try {
    // Empêcher un admin de se supprimer lui-même
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    
    await User.delete(req.params.id);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/users/:id/assignments
 * Récupérer les assignations d'un utilisateur
 */
router.get('/:id/assignments', authenticateJWT, checkAdminAccess, async (req, res) => {
  try {
    const assignments = await UserAssignment.findByUserId(req.params.id);
    res.json(assignments);
  } catch (error) {
    console.error('Erreur récupération assignations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/users/:id/assignments
 * Définir les assignations d'un utilisateur (remplace toutes les assignations existantes)
 */
router.post('/:id/assignments', authenticateJWT, checkAdminAccess, sanitizeInputs, async (req, res) => {
  try {
    const { assignments } = req.body;
    
    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Format invalide : assignments doit être un tableau' });
    }
    
    // Valider les assignations
    for (const assignment of assignments) {
      if (!assignment.assignmentType || !['all', 'programme', 'action'].includes(assignment.assignmentType)) {
        return res.status(400).json({ error: 'Type d\'assignation invalide' });
      }
    }
    
    const newAssignments = await UserAssignment.setAssignments(
      req.params.id,
      assignments,
      req.user.id
    );
    
    res.json(newAssignments);
  } catch (error) {
    console.error('Erreur définition assignations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/users/:id/accessible-actions
 * Liste des IDs des actions accessibles par un utilisateur
 */
router.get('/:id/accessible-actions', authenticateJWT, checkAdminAccess, async (req, res) => {
  try {
    const actionIds = await UserAssignment.getAccessibleActions(req.params.id);
    res.json(actionIds);
  } catch (error) {
    console.error('Erreur récupération actions accessibles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/users/:id/accessible-programmes
 * Liste des programmes accessibles par un utilisateur
 */
router.get('/:id/accessible-programmes', authenticateJWT, checkAdminAccess, async (req, res) => {
  try {
    const programmes = await UserAssignment.getAccessibleProgrammes(req.params.id);
    res.json(programmes);
  } catch (error) {
    console.error('Erreur récupération programmes accessibles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

