# Système de Notifications Modernes

## Vue d'ensemble

Ce système remplace les `alert()` et `confirm()` natifs du navigateur par des notifications modernes conformes à la charte institutionnelle sénégalaise.

## Fichiers

- **notifications.css** : Styles des toasts et modals
- **notifications.js** : Logique JavaScript
- **notifications-demo.html** : Page de démonstration

## Intégration

### 1. Ajouter les fichiers dans le HTML

```html
<link rel="stylesheet" href="/notifications.css">
<script src="/notifications.js"></script>
```

### 2. Utiliser les fonctions

#### Toasts (notifications légères)

```javascript
// Succès
showSuccess('Action effectuée avec succès !');

// Erreur
showError('Une erreur est survenue.');

// Attention
showWarning('Attention : données manquantes.');

// Information
showInfo('Mise à jour disponible.');

// Avec titre personnalisé et durée
showSuccess('Message', 'Titre personnalisé', 5000);

// Toast permanent (durée = 0)
showToast('Message permanent', 'info', 0, 'Titre');
```

#### Modals (dialogues)

```javascript
// Alerte simple
await showAlert('Message', 'Titre', 'info');

// Confirmation
const result = await confirmAction('Voulez-vous continuer ?', 'Confirmation');
if (result) {
    // L'utilisateur a confirmé
}

// Confirmation de suppression (bouton rouge)
const result = await confirmDelete('Supprimer cet élément ?');
if (result) {
    // L'utilisateur a confirmé la suppression
}

// Modal personnalisé
const result = await showModal({
    title: 'Titre',
    message: 'Message',
    type: 'warning', // 'success', 'error', 'warning', 'info', 'confirm'
    confirmText: 'OK',
    cancelText: 'Annuler', // null pour masquer
    isDangerous: false // true pour bouton rouge
});
```

## Types de notifications

### Toasts

- **success** : Vert institutionnel (#2d8b6d)
- **error** : Rouge sobre (#c53030)
- **warning** : Jaune sable (#d69e2e)
- **info** : Turquoise (#4db8a8)

### Modals

- **success** : Validation réussie
- **error** : Erreur critique
- **warning** : Avertissement
- **info** : Information
- **confirm** : Confirmation d'action

## Caractéristiques

✅ **Animations fluides** : Entrées/sorties animées  
✅ **Auto-fermeture** : Configurable (défaut : 5-7s selon type)  
✅ **Fermeture manuelle** : Bouton X sur chaque toast  
✅ **Multilignes** : Support des `\n` dans les messages  
✅ **Responsive** : Adapté mobile et desktop  
✅ **Accessible** : Navigation clavier, ESC pour fermer  
✅ **Stack** : Plusieurs toasts peuvent coexister  
✅ **Charte conforme** : Palette institutionnelle sénégalaise  

## Exemples de migration

### Avant (alert natif)

```javascript
alert('Utilisateur créé avec succès');
alert('Erreur : ' + message);
if (confirm('Supprimer ?')) {
    // action
}
```

### Après (système moderne)

```javascript
showSuccess('Utilisateur créé avec succès');
showError(message);
if (await confirmDelete('Supprimer ?')) {
    // action
}
```

## Palette de couleurs

- **Vert institutionnel** (#2d8b6d) : Actions principales, succès
- **Turquoise** (#4db8a8) : Information, actions secondaires
- **Jaune sable** (#d69e2e) : Attention, avertissements
- **Rouge sobre** (#c53030) : Erreur, actions destructives
- **Gris anthracite** (#2d3748) : Texte principal
- **Blanc cassé** : Arrière-plans

## Démo

Ouvrir `/notifications-demo.html` pour voir tous les exemples en action.

## Support

- Chrome/Edge : ✅
- Firefox : ✅
- Safari : ✅
- Mobile : ✅

