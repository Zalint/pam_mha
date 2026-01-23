# Design Conceptuel - Gestion des Utilisateurs et Permissions

## Vue d'ensemble

Système de gestion des utilisateurs avec assignation hiérarchique des permissions pour les Directeurs.

---

## 1. Modèle de données

### Table `users` (mise à jour)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  fullName VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Ministre', 'Directeur')),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Note** : Suppression de la colonne `programme` (remplacée par le système d'assignation)

### Nouvelle table `userAssignments`

```sql
CREATE TABLE userAssignments (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignmentType VARCHAR(20) NOT NULL CHECK (assignmentType IN ('all', 'programme', 'action')),
  assignmentValue TEXT, -- NULL si 'all', nom du programme si 'programme', ID de l'action si 'action'
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id)
);

CREATE INDEX idx_user_assignments_user ON userAssignments(userId);
CREATE INDEX idx_user_assignments_type ON userAssignments(assignmentType);
```

**Exemples** :
- Directeur avec accès total : `{userId: 5, assignmentType: 'all', assignmentValue: null}`
- Directeur sur PASEM : `{userId: 6, assignmentType: 'programme', assignmentValue: 'Programme d\'Accès Sécurisé à l\'Eau Multiusages (PASEM)'}`
- Directeur sur action #12 : `{userId: 7, assignmentType: 'action', assignmentValue: '12'}`

---

## 2. Écran de gestion des utilisateurs

### URL
`/users.html` (accessible uniquement aux Admins)

### Structure de l'écran

```
┌─────────────────────────────────────────────────────────────┐
│  Gestion des Utilisateurs                    [+ Nouvel utilisateur] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Recherche : [____________]  Filtre rôle : [Tous ▼] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Utilisateurs (12)                                    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                       │   │
│  │ 👤 Amadou DIOP                          [Modifier]  │   │
│  │    admin • Admin • Actif                             │   │
│  │    Créé le 15/01/2026                                │   │
│  │                                                       │   │
│  │ 👤 Fatou NDIAYE                         [Modifier]  │   │
│  │    fatou.ndiaye • Ministre • Actif                   │   │
│  │    Créé le 18/01/2026                                │   │
│  │                                                       │   │
│  │ 👤 Moussa SECK                          [Modifier]  │   │
│  │    moussa.seck • Directeur • Actif                   │   │
│  │    📋 Assignations : Tous                            │   │
│  │    Créé le 18/01/2026                                │   │
│  │                                                       │   │
│  │ 👤 Aïssatou FALL                        [Modifier]  │   │
│  │    aissatou.fall • Directeur • Actif                 │   │
│  │    📋 Assignations : 2 programmes, 3 actions         │   │
│  │    Créé le 20/01/2026                                │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Modal de modification d'utilisateur

### Pour un utilisateur de type "Directeur"

```
┌─────────────────────────────────────────────────────────────┐
│  Modifier l'utilisateur : Aïssatou FALL              [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Nom complet *                                               │
│  [Aïssatou FALL                                        ]    │
│                                                               │
│  Nom d'utilisateur *                                         │
│  [aissatou.fall                                        ]    │
│                                                               │
│  Rôle *                                                      │
│  [Directeur                                            ▼]    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Assignations (visible uniquement si rôle = Directeur)│   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                       │   │
│  │ ☐ Tous les programmes et actions                     │   │
│  │   (Accès complet - ancien "Directeur de Cabinet")    │   │
│  │                                                       │   │
│  │ Ou sélectionner par programme/action :                │   │
│  │                                                       │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ Rechercher un programme ou une action...      │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │ 📁 Programmes                                         │   │
│  │                                                       │   │
│  │ ☑ Gestion des Ressources en Eau (15 actions)        │   │
│  │   ├─ ☑ Aménagement de la mare de Belanga...         │   │
│  │   ├─ ☑ Construction d'un mini barrage...             │   │
│  │   ├─ ☑ Prélimination de 30 barres...                 │   │
│  │   └─ ... [Afficher toutes]                            │   │
│  │                                                       │   │
│  │ ☐ Programme d'Accès Sécurisé (5 actions)            │   │
│  │   ├─ ☐ Action 1...                                    │   │
│  │   └─ ... [Afficher toutes]                            │   │
│  │                                                       │   │
│  │ ☐ Programme de Renforcement (2 actions)             │   │
│  │                                                       │   │
│  │ 🔧 Actions individuelles (non assignées par prog.)   │   │
│  │                                                       │   │
│  │ ☑ Réhabilitation de la digue du Barrage du Diama    │   │
│  │   (Programme Intermédiaire AEP Dakar)                │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Statut                                                      │
│  ☑ Compte actif                                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Résumé des assignations :                            │   │
│  │ • 1 programme (Gestion des Ressources)               │   │
│  │ • 1 action individuelle                               │   │
│  │ Total : 16 actions accessibles                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│                          [Annuler]  [Enregistrer]           │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Logique d'assignation

### Hiérarchie

1. **"Tous"** : si coché, annule toutes les autres sélections
2. **Programme** : si un programme est coché, toutes ses actions sont automatiquement assignées
3. **Action individuelle** : actions assignées manuellement

### Comportement interactif

```javascript
// Pseudo-code
onCheckTous() {
  if (checked) {
    // Décocher tous les programmes et actions
    uncheckAll();
    // Masquer la liste
    hideList();
    // Sauvegarder : assignmentType = 'all'
  } else {
    // Afficher la liste
    showList();
  }
}

onCheckProgramme(programmeId) {
  if (checked) {
    // Décocher "Tous" si coché
    uncheckTous();
    // Cocher automatiquement toutes les actions du programme
    checkAllActionsOfProgramme(programmeId);
    // Sauvegarder : assignmentType = 'programme', assignmentValue = programmeName
  } else {
    // Décocher toutes les actions du programme
    uncheckAllActionsOfProgramme(programmeId);
    // Supprimer l'assignation du programme
  }
}

onCheckAction(actionId) {
  if (checked) {
    // Décocher "Tous" si coché
    uncheckTous();
    // Vérifier si toutes les actions du programme parent sont cochées
    if (allActionsOfProgrammeChecked(programmeId)) {
      // Transformer en assignation de programme
      checkProgramme(programmeId);
    } else {
      // Sauvegarder : assignmentType = 'action', assignmentValue = actionId
    }
  } else {
    // Si le programme parent est coché, le décocher
    if (programmeChecked) {
      uncheckProgramme(programmeId);
      // Cocher toutes les autres actions du programme
      checkOtherActionsOfProgramme(programmeId, actionId);
    }
    // Supprimer l'assignation de l'action
  }
}
```

---

## 5. Vérification des permissions (Backend)

### Middleware d'autorisation

```javascript
// middleware/checkAccess.js

async function checkAccessToAction(req, res, next) {
  const { actionId } = req.params;
  const user = req.user;
  
  // Admin et Ministre : accès total (Admin en écriture, Ministre en lecture)
  if (user.role === 'Admin' || user.role === 'Ministre') {
    return next();
  }
  
  // Directeur : vérifier les assignations
  if (user.role === 'Directeur') {
    const assignments = await UserAssignment.findByUserId(user.id);
    
    // Vérifier si "Tous"
    const hasAllAccess = assignments.some(a => a.assignmentType === 'all');
    if (hasAllAccess) {
      return next();
    }
    
    // Récupérer l'action pour vérifier le programme
    const action = await Action.findById(actionId);
    
    // Vérifier si le programme est assigné
    const hasProgrammeAccess = assignments.some(
      a => a.assignmentType === 'programme' && a.assignmentValue === action.programme
    );
    if (hasProgrammeAccess) {
      return next();
    }
    
    // Vérifier si l'action spécifique est assignée
    const hasActionAccess = assignments.some(
      a => a.assignmentType === 'action' && a.assignmentValue === actionId.toString()
    );
    if (hasActionAccess) {
      return next();
    }
    
    // Aucun accès
    return res.status(403).json({ error: 'Accès refusé' });
  }
  
  return res.status(403).json({ error: 'Accès refusé' });
}

module.exports = { checkAccessToAction };
```

---

## 6. API Endpoints

### Gestion des utilisateurs

```
GET    /api/users                    # Liste des utilisateurs (Admin uniquement)
GET    /api/users/:id                # Détails d'un utilisateur
POST   /api/users                    # Créer un utilisateur
PUT    /api/users/:id                # Modifier un utilisateur
DELETE /api/users/:id                # Supprimer un utilisateur (soft delete)
```

### Gestion des assignations

```
GET    /api/users/:id/assignments    # Récupérer les assignations d'un utilisateur
POST   /api/users/:id/assignments    # Définir les assignations (remplace tout)
DELETE /api/users/:id/assignments/:assignmentId  # Supprimer une assignation
```

### Vérification des accès

```
GET    /api/users/:id/accessible-actions  # Liste des actions accessibles par l'utilisateur
GET    /api/users/:id/accessible-programmes  # Liste des programmes accessibles
```

---

## 7. Flux utilisateur

### Scénario 1 : Admin crée un Directeur avec accès complet

1. Admin clique sur "+ Nouvel utilisateur"
2. Remplit le formulaire (nom, username, mot de passe)
3. Sélectionne rôle "Directeur"
4. Coche "Tous les programmes et actions"
5. Enregistre
6. Backend crée l'utilisateur et l'assignation : `{assignmentType: 'all'}`

### Scénario 2 : Admin assigne un programme à un Directeur

1. Admin clique sur "Modifier" sur un Directeur existant
2. Décoche "Tous" (si coché)
3. Coche le programme "PASEM"
4. Toutes les actions de PASEM sont automatiquement cochées
5. Enregistre
6. Backend crée l'assignation : `{assignmentType: 'programme', assignmentValue: 'PASEM'}`

### Scénario 3 : Admin assigne des actions spécifiques

1. Admin clique sur "Modifier" sur un Directeur
2. Décoche "Tous"
3. Coche individuellement 3 actions de programmes différents
4. Enregistre
5. Backend crée 3 assignations : `{assignmentType: 'action', assignmentValue: 'actionId'}`

### Scénario 4 : Directeur se connecte

1. Directeur se connecte
2. Frontend charge les assignations
3. Filtre automatiquement les actions accessibles
4. Affiche uniquement les programmes/actions autorisés

---

## 8. Migration de la base de données

### Script de migration

```sql
-- 1. Créer la nouvelle table
CREATE TABLE userAssignments (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignmentType VARCHAR(20) NOT NULL CHECK (assignmentType IN ('all', 'programme', 'action')),
  assignmentValue TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdBy INTEGER REFERENCES users(id)
);

CREATE INDEX idx_user_assignments_user ON userAssignments(userId);
CREATE INDEX idx_user_assignments_type ON userAssignments(assignmentType);

-- 2. Migrer les données existantes
-- Tous les Directeurs de Cabinet deviennent Directeurs avec accès "Tous"
INSERT INTO userAssignments (userId, assignmentType, assignmentValue)
SELECT id, 'all', NULL
FROM users
WHERE role = 'Directeur de Cabinet';

UPDATE users
SET role = 'Directeur'
WHERE role = 'Directeur de Cabinet';

-- 3. Migrer les Directeurs avec programme assigné
INSERT INTO userAssignments (userId, assignmentType, assignmentValue)
SELECT id, 'programme', programme
FROM users
WHERE role = 'Directeur' AND programme IS NOT NULL;

-- 4. Supprimer l'ancienne colonne programme
ALTER TABLE users DROP COLUMN programme;

-- 5. Mettre à jour le CHECK constraint sur role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('Admin', 'Ministre', 'Directeur'));
```

---

## 9. Interface utilisateur

### Palette de couleurs (conformité avec la charte)

- **Vert principal** : `#2d8b6d` (boutons, accents)
- **Turquoise** : `#4db8a8` (badges)
- **Gris clair** : `#f8f9fa` (fond)
- **Gris foncé** : `#2b3e50` (texte)
- **Jaune sable** : `#d4a76a` (warning)

### Composants

- **Carte utilisateur** : fond blanc, ombre légère, hover effect
- **Checkbox hiérarchique** : indentation pour les actions sous les programmes
- **Badge de rôle** : couleur selon le rôle
  - Admin : vert foncé
  - Ministre : turquoise
  - Directeur : gris

---

## 10. Sécurité

### Contrôles

1. **Authentification** : seuls les Admins peuvent accéder à `/users.html`
2. **Validation** : vérifier que les assignations existent (programmes, actions)
3. **Audit** : logger toutes les modifications d'assignations
4. **Protection** : empêcher un Admin de se supprimer lui-même
5. **Historique** : garder une trace des changements de permissions

---

## 11. Améliorations futures

- Export de la liste des utilisateurs en Excel
- Import en masse d'utilisateurs
- Notifications par email lors de changement de permissions
- Dashboard des accès par utilisateur
- Logs d'audit détaillés

