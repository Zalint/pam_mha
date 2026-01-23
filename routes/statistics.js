const express = require('express');
const Action = require('../models/Action');
const { authenticateJWT } = require('../middleware/auth');
const UserAssignment = require('../models/UserAssignment');

const router = express.Router();

/**
 * GET /api/statistics
 * Récupère les statistiques globales (dashboard)
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    let programme = null;

    // Les Directeurs ne voient que leurs programmes assignés
    if (req.user.role === 'Directeur') {
      const assignments = await UserAssignment.findByUserId(req.user.id);
      const hasFullAccess = assignments.some(a => a.assignmenttype === 'all');
      
      // Si pas d'accès total et un programme spécifique est demandé
      if (!hasFullAccess && req.query.programme) {
        programme = req.query.programme;
      }
    } else if (req.query.programme) {
      programme = req.query.programme;
    }

    const stats = await Action.getStatistics(programme);

    // Formater les statistiques par statut
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
    console.error('Erreur récupération statistiques:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/statistics/programmes
 * Récupère la liste des programmes (filtrés selon les droits de l'utilisateur)
 */
router.get('/programmes', authenticateJWT, async (req, res) => {
  try {
    // Récupérer tous les programmes
    const programmes = await Action.getProgrammes();
    
    // Filtrer selon le rôle
    if (req.user.role === 'Admin' || req.user.role === 'Ministre') {
      // Accès total
      return res.json(programmes);
    }
    
    if (req.user.role === 'Directeur') {
      const assignments = await UserAssignment.findByUserId(req.user.id);
      const hasFullAccess = assignments.some(a => a.assignmenttype === 'all');
      
      if (hasFullAccess) {
        return res.json(programmes);
      }
      
      // Filtrer uniquement les programmes assignés
      const assignedProgrammes = assignments
        .filter(a => a.assignmenttype === 'programme')
        .map(a => a.assignmentvalue);
      
      const filteredProgrammes = programmes.filter(p => 
        assignedProgrammes.includes(p.programme)
      );
      
      return res.json(filteredProgrammes);
    }
    
    res.json(programmes);
  } catch (err) {
    console.error('Erreur récupération programmes:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

