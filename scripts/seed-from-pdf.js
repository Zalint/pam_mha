/**
 * Script d'import des données du PAM depuis le PDF
 * Source: MHA Matrice SE-EXECUTION-PAM 2026-MHA 2026.pdf
 * 
 * Usage: node scripts/seed-from-pdf.js
 */

require('dotenv').config();
const pool = require('../config/database');

// Données extraites du PDF "MHA Matrice SE-EXECUTION-PAM 2026-MHA 2026.pdf"
const actionsFromPDF = [
  // Programme d'Accès Sécurisé à l'Eau Multiusages (PASEM)
  {
    programme: 'Programme d\'Accès Sécurisé à l\'Eau Multiusages (PASEM)',
    sousDirection: 'Dessalement / Accès Sécurisé à l\'Eau (DASE)',
    intitule: 'Projet de Réalisation d\'une Unité de Dessalement d\'Eau de Mer - Travaux de conception-construction',
    responsable: 'Direction de l\'Exploitation',
    echeance: '2026-12-31',
    tauxPhysique: 50.0,
    tauxFinancier: 0.0,
    statut: 'En cours',
    budgetTotal: 2189000000,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Les travaux de conception-construction de l\'usine de dessalement sont en cours avec un taux d\'avancement physique global de 50%'
  },
  {
    programme: 'Programme d\'Accès Sécurisé à l\'Eau Multiusages (PASEM)',
    sousDirection: 'Dessalement / Accès Sécurisé à l\'Eau (DASE)',
    intitule: 'Renouvellement de 310 km de canalisations du réseau de distribution de Dakar',
    responsable: 'Direction de l\'Exploitation',
    echeance: '2026-12-31',
    tauxPhysique: 80.0,
    tauxFinancier: 0.0,
    statut: 'En cours',
    budgetTotal: null,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Les travaux de renouvellement avancent avec un taux d\'avancement physique global de 80%'
  },
  {
    programme: 'Programme d\'Accès Sécurisé à l\'Eau Multiusages (PASEM)',
    sousDirection: 'Dessalement / Accès Sécurisé à l\'Eau (DASE)',
    intitule: 'Réalisation de 33.000 branchements',
    responsable: 'Direction de l\'Exploitation',
    echeance: '2026-12-31',
    tauxPhysique: 30.0,
    tauxFinancier: 60.0,
    statut: 'En cours',
    budgetTotal: 1115128900,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Les travaux de réalisation de branchements avancent avec un taux d\'avancement physique global de 30%'
  },
  {
    programme: 'Programme d\'Accès Sécurisé à l\'Eau Multiusages (PASEM)',
    sousDirection: 'Dessalement / Accès Sécurisé à l\'Eau (DASE)',
    intitule: 'Réception provisoire des travaux de reconnaissance de l\'usine de canal',
    responsable: 'Direction de l\'Exploitation',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: null,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Réception provisoire prononcée'
  },
  {
    programme: 'Programme d\'Accès Sécurisé à l\'Eau Multiusages (PASEM)',
    sousDirection: 'Dessalement / Accès Sécurisé à l\'Eau (DASE)',
    intitule: 'Distribution de l\'usine à gages',
    responsable: 'Direction de l\'Exploitation',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: null,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Gaine de gages mise en service'
  },
  
  // Programme Intermédiaire AEP Dakar 2024-2026
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
    sousDirection: 'Projet d\'Approvisionnement en Eau en Milieu Rural 2 (PAEMIR2)',
    intitule: 'Réalisation de Châteaux d\'eau',
    responsable: 'Direction de l\'Hydraulique Rurale',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 2744400000,
    budgetT1: 748980000,
    budgetT2: 561800000,
    budgetT3: 1497780000,
    budgetT4: 836100000,
    commentaire: 'Nombre de châteaux d\'eau prévus : 23'
  },
  {
    programme: 'Programme Intermédiaire AEP Dakar 2024-2026',
    sousDirection: 'Projet d\'Approvisionnement en Eau en Milieu Rural 3 (PAEMIR3)',
    intitule: 'Réalisation de réseaux d\'AEP',
    responsable: 'Direction de l\'Hydraulique Rurale',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 1987900000,
    budgetT1: 397580000,
    budgetT2: 296185000,
    budgetT3: 795160000,
    budgetT4: 496975000,
    commentaire: 'Nombre de réseaux AEP prévus : 183'
  },
  {
    programme: 'Programme Intermédiaire AEP Dakar 2024-2026',
    sousDirection: 'Projet d\'Approvisionnement en Eau en Milieu Rural 3 (PAEMIR3)',
    intitule: 'Réalisation d\'abreuvoirs',
    responsable: 'Direction de l\'Hydraulique Rurale',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 120000000,
    budgetT1: 20000000,
    budgetT2: 30000000,
    budgetT3: 48000000,
    budgetT4: 30000000,
    commentaire: 'Nombre d\'abreuvoirs prévus : 30'
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
    commentaire: 'Nombre de branchements particuliers prévus : 1 600'
  },
  {
    programme: 'Programme Intermédiaire AEP Dakar 2024-2026',
    sousDirection: 'Projet d\'Approvisionnement en Eau en Milieu Rural 3 (PAEMIR3)',
    intitule: 'Réalisation de bornes fontaines',
    responsable: 'Direction de l\'Hydraulique Rurale',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 23800000,
    budgetT1: 4760000,
    budgetT2: 3870000,
    budgetT3: 9620000,
    budgetT4: 5860000,
    commentaire: 'Nombre de bornes fontaines prévues : 50'
  },
  {
    programme: 'Programme Intermédiaire AEP Dakar 2024-2026',
    sousDirection: 'Projet d\'Approvisionnement en Eau en Milieu Rural 3 (PAEMIR3)',
    intitule: 'Réalisation d\'UPT (Unités de Production et de Traitement)',
    responsable: 'Direction de l\'Hydraulique Rurale',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 518962000,
    budgetT1: 103398060,
    budgetT2: 77548820,
    budgetT3: 208787120,
    budgetT4: 120248200,
    commentaire: 'Nombre d\'UPT prévus : 1'
  },
  {
    programme: 'Programme Intermédiaire AEP Dakar 2024-2026',
    sousDirection: 'Projet d\'Approvisionnement en Eau en Milieu Rural 3 (PAEMIR3)',
    intitule: 'Réalisation d\'unités de production',
    responsable: 'Direction de l\'Hydraulique Rurale',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 1247203224,
    budgetT1: 249488645,
    budgetT2: 187099884,
    budgetT3: 498003280,
    budgetT4: 311833300,
    commentaire: 'Nombre d\'unités de production prévues : 2'
  },
  {
    programme: 'Programme Intermédiaire AEP Dakar 2024-2026',
    sousDirection: 'Projet d\'Approvisionnement en Eau en Milieu Rural 3 (PAEMIR3)',
    intitule: 'Réalisation de forages',
    responsable: 'Direction de l\'Hydraulique Rurale',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 750175584,
    budgetT1: 146038111,
    budgetT2: 106526336,
    budgetT3: 282075234,
    budgetT4: 182543806,
    commentaire: 'Nombre de forages prévus : 4'
  },
  
  // Programme de Renforcement des Systèmes d'Alimentation en Eau Potable
  {
    programme: 'Programme de Renforcement des Systèmes d\'Alimentation en Eau Potable de Trois Villes : Saint Louis, Kaolack et Kolda',
    sousDirection: 'PISEA SONES',
    intitule: 'Réalisation de 16.000 branchements sociaux',
    responsable: 'Direction de l\'Hydraulique Urbaine',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 1115128900,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Nombre de branchements sociaux réalisés dans le cadre de ce projet = 16.000'
  },
  {
    programme: 'Programme de Renforcement des Systèmes d\'Alimentation en Eau Potable de Trois Villes : Saint Louis, Kaolack et Kolda',
    sousDirection: 'PISEA SONES',
    intitule: 'Travaux d\'extension de réseaux et de branchements à l\'eau potable',
    responsable: 'Direction de l\'Hydraulique Urbaine',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 1452000000,
    budgetT1: 338000000,
    budgetT2: 338000000,
    budgetT3: 338000000,
    budgetT4: 438000000,
    commentaire: 'Extension de réseau et nombre de branchements réalisés'
  },
  {
    programme: 'Programme Intermédiaire AEP Dakar 2024-2026',
    sousDirection: null,
    intitule: 'Réalisation d\'ouvrages de production et de stockage',
    responsable: 'Direction de l\'Hydraulique Urbaine',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 3301000000,
    budgetT1: 110000000,
    budgetT2: 73000000,
    budgetT3: 2009000000,
    budgetT4: 1109000000,
    commentaire: 'Ouvrages de production et de stockage'
  },
  
  // Gestion des Ressources en Eau et Lutte contre les Inondations
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
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Réhabilitation de 5 km de digue dans le réservoir du Diama - Trimestre 2'
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
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Dégagement des refuges aquatiques sur le chenal Yaal Yaaro - Trimestre 2'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Travaux de construction d\'une digue de protection',
    responsable: 'DGPRE',
    echeance: '2026-06-30',
    tauxPhysique: 60.0,
    tauxFinancier: 0.0,
    statut: 'En cours',
    budgetTotal: 367000000,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Construction de 1,4 km de digue dans le village de Keur - Trimestre 2 - La production de marché est en cours'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Aménagement de la mare de Belanga à Richard Toll',
    responsable: 'DGPRE',
    echeance: '2026-03-31',
    tauxPhysique: 59.0,
    tauxFinancier: 59.0,
    statut: 'En cours',
    budgetTotal: 77000000,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Aménagement de la mare pour l\'alimentation d\'eau de plus de 6000 têtes de bétail - Trimestre 1'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Construction de 5 km de digue de protection de la ville contre les crues du Fleuve Sénégal',
    responsable: 'DGPRE',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 365000000,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: '4ème trimestre - Le marché est en approbation'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Construction d\'un mini barrage de retenue à Lambéka à Richard Toll',
    responsable: 'DGPRE',
    echeance: '2026-06-30',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 124000000,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: '2ème trimestre - Dossier d\'exécution en cours'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Réhabilitation de la digue - 1ère partie',
    responsable: 'DGPRE',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 148000000,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: '4ème trimestre - Le marché est en approbation'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Travaux de faucardage et de désenvasement du bras de l\'eau dans le Saloum',
    responsable: 'DGPRE',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 100000000,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Dégagement des refuges aquatiques sur le Saloum - 4ème trimestre - La production de passation de marché n\'a pas encore démarré'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Travaux de faucardage et de désenvasement au droit de l\'ouvrage de Touba Bana dans le Djoloff',
    responsable: 'DGPRE',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 100000000,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Dégagement des refuges aquatiques sur le Djoloff - 4ème trimestre - La production de passation de marché n\'a pas encore démarré'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Réhabilitation de la digue de Fakh : 120 - Boukhou Babi',
    responsable: 'DGPRE',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 3200000000,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Réhabilitation de la digue de Fakh - 4ème trimestre - La production de marché est en cours'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Préélimination de 30 barres de l\'ouvrage de Ndembo pour améliorer l\'hydraulicité',
    responsable: 'DGPRE',
    echeance: '2026-06-30',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: 3800000000,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Aménagement du bassin versant du Barrage-Babou - 2ème trimestre - La production de marché est en cours'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Lentiers d\'eau et modifications',
    responsable: 'DGPRE',
    echeance: '2026-12-31',
    tauxPhysique: 12.5,
    tauxFinancier: 25.0,
    statut: 'En cours',
    budgetTotal: 26000000000,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Barrage d\'eau de la Gobe et barrage entre la zone de Maraghaul et l\'ouvrage anti-est de Sam Kafod Mabou - 4ème trimestre'
  },
  
  // Autres actions
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Réhabilitation de digues de protection',
    responsable: 'DGPRE',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: null,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Nombre de barrages de retenue réalisés / Réhabilités : 12'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Réhabilitation d\'ouvrages de retenue',
    responsable: 'DGPRE',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: null,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Nombre de barrages anti-sel réalisés et réhabilités : 2'
  },
  {
    programme: 'Gestion des Ressources en Eau et Lutte contre les Inondations',
    sousDirection: 'Direction de la Gestion et de la Planification des Ressources en Eau (DGPRE)',
    intitule: 'Aménagement d\'ouvrages de décharges d\'eau pluviales',
    responsable: 'DGPRE',
    echeance: '2026-12-31',
    tauxPhysique: 0.0,
    tauxFinancier: 0.0,
    statut: 'À démarrer',
    budgetTotal: null,
    budgetT1: null,
    budgetT2: null,
    budgetT3: null,
    budgetT4: null,
    commentaire: 'Nombre d\'ouvrages de franchissement créés : 10'
  }
];

async function importActions() {
  console.log('🚀 Import des données du PAM depuis le PDF...\n');
  console.log(`📊 Nombre d'actions à importer : ${actionsFromPDF.length}\n`);

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const action of actionsFromPDF) {
      try {
        const result = await pool.query(
          `INSERT INTO actions 
           (programme, sousdirection, intitule, responsable, echeance, 
            tauxphysique, tauxfinancier, statut, budgettotal, 
            budgett1, budgett2, budgett3, budgett4, commentaire) 
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

        console.log(`✅ [${result.rows[0].id}] ${action.intitule.substring(0, 60)}...`);
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

