const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const config = require('./config/config');

// Import des routes
const authRoutes = require('./routes/auth');
const actionsRoutes = require('./routes/actions');
const statisticsRoutes = require('./routes/statistics');
const usersRoutes = require('./routes/users');
const externalRoutes = require('./routes/external');

const app = express();

// ===== Middlewares globaux =====

// CORS
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true
}));

// Parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== Routes API =====

// API interne (JWT)
app.use('/api/auth', authRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/users', usersRoutes);

// API externe (x-api-key)
app.use('/api/external', externalRoutes);

// ===== Servir le frontend (PWA) =====

app.use(express.static(path.join(__dirname, 'public')));

// Route catch-all pour le SPA
app.get('*', (req, res) => {
  // Ne pas intercepter les routes API
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Route API non trouvée' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== Gestion des erreurs =====

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// ===== Démarrage du serveur =====

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   Serveur de Suivi PAM - MHA                          ║
║   Environnement: ${config.server.environment.padEnd(40)}║
║   Port: ${PORT.toString().padEnd(46)}║
║   URL: ${config.server.publicUrl.padEnd(47)}║
╚════════════════════════════════════════════════════════╝
  `);
  console.log('✓ Serveur démarré avec succès');
  console.log('✓ Routes API configurées');
  console.log('✓ Frontend PWA disponible\n');
});

// Gestion de l'arrêt propre
process.on('SIGTERM', () => {
  console.log('\nArrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nArrêt du serveur...');
  process.exit(0);
});

module.exports = app;

