# 🎨 Design Conceptuel - Tableau de Suivi PAM Complet

## Vue d'ensemble

Design d'une table complète affichant toutes les colonnes du document PDF "MHA Matrice SE-EXECUTION-PAM 2026", exactement comme sur la capture d'écran fournie.

---

## 📊 Structure de la Table

### Colonnes principales (de gauche à droite)

1. **Programmes** (colonne fixe)
   - Largeur : 200px
   - Fusion verticale des cellules pour les actions du même programme
   - Fond : Vert institutionnel (#2d8b6d) avec texte blanc
   - Police : Gras, 12px

2. **Actions** (colonne fixe)
   - Largeur : 180px
   - Fusion verticale des cellules pour les activités de la même action
   - Fond : Turquoise doux (#4db8a8) avec texte blanc
   - Police : Gras, 11px

3. **Activités**
   - Largeur : 250px
   - Texte : Gris foncé (#2b3e50)
   - Police : 11px, normal

4. **Résultats attendus**
   - Largeur : 300px
   - Texte : Gris foncé (#2b3e50)
   - Police : 11px, normal
   - Retour à la ligne automatique

5. **Indicateurs** (groupe de 2 colonnes)
   - **Cibles** (sous-colonne)
     - Largeur : 200px
     - Texte : Gris foncé (#2b3e50)
   - **Résultats %** (sous-colonne)
     - Largeur : 120px
     - Texte : Gris foncé (#2b3e50)
     - Alignement : Centre

6. **Budget prévisionnel (LFI 2026)**
   - Largeur : 150px
   - Format : Nombre avec séparateurs (ex: 27,396,932,737)
   - Alignement : Droite
   - Police : Monospace, 11px

7. **Échéance**
   - Largeur : 120px
   - Format : DD/MM/YYYY
   - Alignement : Centre

8. **État d'exécution** (groupe de 2 colonnes)
   - **Physique (%)** (sous-colonne)
     - Largeur : 100px
     - Alignement : Centre
     - Badge coloré selon le pourcentage
   - **Financière (%)** (sous-colonne)
     - Largeur : 100px
     - Alignement : Centre
     - Badge coloré selon le pourcentage

9. **Commentaires**
   - Largeur : 250px
   - Texte : Gris clair (#6c757d)
   - Police : 10px, italique
   - Retour à la ligne automatique

10. **Plan d'engagement** (groupe de 4 colonnes)
    - **Trimestre 1** (sous-colonne)
      - Largeur : 120px
      - Format : Nombre avec séparateurs
      - Alignement : Droite
    - **Trimestre 2** (sous-colonne)
      - Largeur : 120px
      - Format : Nombre avec séparateurs
      - Alignement : Droite
    - **Trimestre 3** (sous-colonne)
      - Largeur : 120px
      - Format : Nombre avec séparateurs
      - Alignement : Droite
    - **Trimestre 4** (sous-colonne)
      - Largeur : 120px
      - Format : Nombre avec séparateurs
      - Alignement : Droite

11. **Actions** (colonne fixe à droite)
    - Largeur : 100px
    - Bouton "Modifier" / "Voir"
    - Alignement : Centre

---

## 🎨 Design Visuel

### En-têtes de colonnes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROGRAMMES  │  ACTIONS  │  ACTIVITÉS  │  RÉSULTATS ATTENDUS  │  INDICATEURS│
│              │           │             │                      │  Cibles│Rés%│
├──────────────┼───────────┼─────────────┼──────────────────────┼─────────────┤
│              │           │             │                      │             │
```

### Style des en-têtes

- **Fond** : Vert institutionnel (#2d8b6d)
- **Texte** : Blanc (#ffffff)
- **Police** : Gras, 12px
- **Hauteur** : 50px (pour les en-têtes groupés)
- **Bordure** : 1px solid #1e6b50

### Style des cellules

- **Fond alterné** : 
  - Lignes paires : Blanc (#ffffff)
  - Lignes impaires : Blanc cassé (#f8f9fa)
- **Bordure** : 1px solid #dee2e6
- **Padding** : 8px vertical, 12px horizontal
- **Hover** : Fond gris clair (#e9ecef)

### Fusion de cellules

- Les cellules "Programmes" fusionnent verticalement pour toutes les actions d'un même programme
- Les cellules "Actions" fusionnent verticalement pour toutes les activités d'une même action
- Utilisation de `rowspan` en HTML

---

## 📱 Responsive Design

### Desktop (> 1200px)
- Table complète avec toutes les colonnes
- Scroll horizontal si nécessaire
- Colonnes fixes (Programmes, Actions) à gauche

### Tablet (768px - 1200px)
- Table scrollable horizontalement
- Colonnes fixes réduites (150px)
- Masquer certaines colonnes moins importantes

### Mobile (< 768px)
- Vue en cartes (cards) au lieu de table
- Affichage par groupe (Programme > Action > Activité)
- Bouton "Voir détails" pour afficher toutes les informations

---

## 🔧 Fonctionnalités Interactives

### 1. Tri des colonnes
- Clic sur l'en-tête pour trier
- Indicateur visuel (flèche ↑↓)
- Tri multi-colonnes avec Shift+clic

### 2. Filtres
- Filtre par Programme (dropdown)
- Filtre par Action (dropdown)
- Filtre par Statut d'exécution
- Recherche textuelle dans toutes les colonnes

### 3. Export
- Bouton "Exporter en Excel"
- Bouton "Exporter en PDF"
- Format identique au document source

### 4. Édition inline
- Double-clic sur une cellule pour éditer
- Sauvegarde automatique
- Historique des modifications

### 5. Vue détaillée
- Clic sur une ligne pour voir tous les détails
- Modal avec formulaire complet
- Historique des modifications

---

## 🎨 Palette de Couleurs

### Couleurs principales
- **Vert institutionnel** : #2d8b6d (en-têtes Programmes)
- **Turquoise doux** : #4db8a8 (en-têtes Actions)
- **Blanc cassé** : #f8f9fa (fond alterné)
- **Gris clair** : #e9ecef (hover)
- **Gris foncé** : #2b3e50 (texte)
- **Anthracite** : #2b3e50 (texte principal)

### Badges de pourcentage
- **0-25%** : Rouge clair (#ffe0e0) avec texte rouge (#d32f2f)
- **26-50%** : Jaune sable (#fff4e0) avec texte orange (#d4a76a)
- **51-75%** : Turquoise clair (#d4edff) avec texte bleu (#0066cc)
- **76-100%** : Vert clair (#d4f4dd) avec texte vert (#1e7e34)

---

## 📐 Dimensions Totales

### Largeur totale estimée
- Colonnes fixes : 380px (Programmes + Actions)
- Colonnes scrollables : ~2400px
- **Total** : ~2780px

### Hauteur
- En-tête : 50px
- Ligne de données : 60-80px (selon contenu)
- Footer (totaux) : 40px

---

## 🔄 États et Interactions

### État par défaut
- Table chargée avec toutes les données
- Colonnes triées par Programme puis Action
- Filtres vides (tout affiché)

### État de chargement
- Skeleton loader avec 10 lignes
- Animation de shimmer
- Texte "Chargement des données..."

### État vide
- Message centré : "Aucune action trouvée"
- Bouton "Créer une nouvelle action"

### État d'édition
- Ligne surlignée en vert clair (#d4f4dd)
- Bouton "Sauvegarder" visible
- Bouton "Annuler" visible

---

## 📋 Exemple de Rendu

```
┌────────────────────────────────────────────────────────────────────────────┐
│ PROGRAMMES          │ ACTIONS │ ACTIVITÉS │ RÉSULTATS │ INDICATEURS       │
│                     │         │           │           │ Cibles │ Rés%    │
├─────────────────────┼─────────┼───────────┼───────────┼────────┼─────────┤
│ Programme d'Accès   │ DASE    │ PROJET... │ Les       │ Taux   │         │
│ Sécurisé à l'Eau    │         │           │ travaux...│ = 99%  │         │
│ (PASEM)             │         │           │           │        │         │
│                     │         │           │ Les       │ Taux   │         │
│                     │         │           │ travaux...│ = 85%  │         │
└─────────────────────┴─────────┴───────────┴───────────┴────────┴─────────┘
```

---

## 🚀 Implémentation Technique

### Technologies
- HTML5 : Table avec `rowspan` pour fusion
- CSS3 : Grid/Flexbox pour layout responsive
- JavaScript : Tri, filtres, édition inline
- Scroll horizontal : `overflow-x: auto`

### Performance
- Virtual scrolling pour grandes listes (> 100 lignes)
- Lazy loading des données
- Cache des filtres et tris

---

## ✅ Checklist d'Implémentation

- [ ] Mettre à jour le schéma de base de données avec tous les champs
- [ ] Créer la structure HTML de la table avec fusion de cellules
- [ ] Styliser les en-têtes groupés
- [ ] Implémenter le scroll horizontal
- [ ] Ajouter les colonnes fixes (Programmes, Actions)
- [ ] Créer les badges de pourcentage colorés
- [ ] Implémenter le tri des colonnes
- [ ] Ajouter les filtres avancés
- [ ] Créer la vue mobile (cartes)
- [ ] Ajouter l'export Excel/PDF
- [ ] Implémenter l'édition inline
- [ ] Tester la responsivité

---

## 📝 Notes

- La table doit être identique au document PDF source
- Respecter strictement la charte graphique institutionnelle
- Prioriser la lisibilité sur mobile
- Performance optimale même avec 100+ lignes

