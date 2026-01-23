/**
 * Script d'aide pour importer les données du PDF vers la base de données
 * 
 * Ce script fournit un template pour importer les données de la matrice PAM.
 * Adaptez les données ci-dessous selon votre fichier PDF/Excel.
 * 
 * Usage : node scripts/import-from-pdf.js
 */

require('dotenv').config();
const pool = require('../config/database');

// Exemple de données extraites du PDF
const actionsFromPDF = [
  {
    programme: 'Programme d\'Accès Sécurisé à l\'Eau Multiusages (PASEM)',
    sousDirection: 'Dessalement / Accès Sécurisé à l\'Eau (DASE)',
    intitule: 'Projet de Réalisation d\'une Unité de Dessalement d\'Eau de Mer - Travaux de conception-construction',
    responsable: 'Direction de l\'Exploitation',
    echeance: '2026-12-31',
    tauxPhysique: 50.0,
    tauxFinancier: 45.0,
    statut: 'En cours',
    budgetTotal: 2189000000,
    commentaire: 'Les travaux de conception-construction de l\'usine de dessalement sont en cours'
  },
  {
    programme: 'Programme d\'Accès Sécurisé à l\'Eau Multiusages (PASEM)',
    sousDirection: 'Dessalement / Accès Sécurisé à l\'Eau (DASE)',
    intitule: 'Renouvellement de 310 km de canalisations du réseau de distribution de Dakar',
    responsable: 'Direction de l\'Exploitation',
    echeance: '2026-12-31',
    tauxPhysique: 80.0,
    tauxFinancier: 75.0,
    statut: 'En cours',
    budgetTotal: 1115128900,
    commentaire: 'Les travaux de renouvellement avancent selon le calendrier'
  },
  {
    programme: 'Programme Intermédiaire AEP Dakar 2024-2026',
    sousDirection: 'Projet d\'Approvisionnement en Eau en Milieu Rural 2 (PAEMIR2)',
    intitule: 'Réalisation de nouveaux forages',
    responsable: 'Direction de l\'Hydraulique Rurale',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 3548400000,
    budgetT1: 409980000,
    budgetT2: 507260000,
    budgetT3: 818360000,
    budgetT4: 912100000,
    commentaire: 'Nombre de forages prévus : 24'
  },
  {
    programme: 'Programme Intermédiaire AEP Dakar 2024-2026',
    sousDirection: 'Projet d\'Approvisionnement en Eau en Milieu Rural 3 (PAEMIR3)',
    intitule: 'Réalisation de branchements particuliers',
    responsable: 'Direction de l\'Hydraulique Rurale',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 378200000,
    budgetT1: 75640000,
    budgetT2: 96890000,
    budgetT3: 151680000,
    budgetT4: 94800000,
    commentaire: 'Nombre de branchements prévus : 1 600'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Réhabilitation de la digue du Barrage du Diama',
    responsable: 'DGPRE',
    echeance: '2026-06-30',
    tauxPhysique: 60.0,
    tauxFinancier: 52.0,
    statut: 'En cours',
    budgetTotal: 367000000,
    commentaire: 'Réhabilitation de 5 km de digue dans le réservoir du Diama'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Travaux de curage du Yaal Yaaro depuis la jonction avec le Lac de Guiers',
    responsable: 'DGPRE',
    echeance: '2026-06-30',
    tauxPhysique: 60.0,
    tauxFinancier: 0.0,
    statut: 'En retard',
    budgetTotal: 274000000,
    commentaire: 'Dégagement des refuges aquatiques sur le chenal Yaal Yaaro'
  }
];

async function importActions() {
  console.log('🚀 Début de l\'importation des actions...\n');

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const action of actionsFromPDF) {
      try {
        const result = await pool.query(
          `INSERT INTO actions 
           (programme, "sousDirection", intitule, responsable, echeance, 
            "tauxPhysique", "tauxFinancier", statut, "budgetTotal", 
            "budgetT1", "budgetT2", "budgetT3", "budgetT4", commentaire) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
           RETURNING id`,
          [
            action.programme,
            action.sousDirection || null,
            action.intitule,
            action.responsable,
            action.echeance,
            action.tauxPhysique || 0,
            action.tauxFinancier || 0,
            action.statut,
            action.budgetTotal || null,
            action.budgetT1 || null,
            action.budgetT2 || null,
            action.budgetT3 || null,
            action.budgetT4 || null,
            action.commentaire || null
          ]
        );

        console.log(`✅ Action importée (ID: ${result.rows[0].id}) : ${action.intitule.substring(0, 60)}...`);
        successCount++;
      } catch (err) {
        console.error(`❌ Erreur pour : ${action.intitule.substring(0, 60)}...`);
        console.error(`   ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Résumé de l'importation :`);
    console.log(`   ✅ Succès : ${successCount}`);
    console.log(`   ❌ Erreurs : ${errorCount}`);
    console.log(`   📝 Total : ${actionsFromPDF.length}`);

  } catch (err) {
    console.error('❌ Erreur globale :', err);
  } finally {
    await pool.end();
  }
}

// Exécuter l'importation
importActions();

