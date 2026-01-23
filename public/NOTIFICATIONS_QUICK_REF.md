# 🚀 Référence Rapide - Notifications

## Import (dans le HTML)

```html
<link rel="stylesheet" href="/notifications.css">
<script src="/notifications.js"></script>
```

## Toasts (Notifications rapides)

```javascript
// ✅ Succès (vert institutionnel)
showSuccess('Action réussie !');

// ❌ Erreur (rouge sobre)
showError('Une erreur est survenue');

// ⚠️ Attention (jaune sable)
showWarning('Attention aux données');

// ℹ️ Information (turquoise)
showInfo('Nouvelle mise à jour');
```

## Modals (Dialogues)

```javascript
// Information simple
await showAlert('Message', 'Titre', 'info');

// Confirmation
if (await confirmAction('Continuer ?', 'Confirmation')) {
    // Confirmé
}

// Suppression
if (await confirmDelete('Supprimer cet élément ?')) {
    // Confirmé
}
```

## Options avancées

```javascript
// Titre personnalisé + durée
showSuccess('Message', 'Mon Titre', 3000);

// Toast permanent (durée = 0)
showToast('Important', 'warning', 0, 'Urgent');

// Modal personnalisé
await showModal({
    title: 'Titre',
    message: 'Message long...',
    type: 'warning',
    confirmText: 'Oui',
    cancelText: 'Non',
    isDangerous: true
});
```

## Couleurs

- 🟢 **Succès** : #2d8b6d (vert institutionnel)
- 🔴 **Erreur** : #c53030 (rouge sobre)
- 🟡 **Attention** : #d69e2e (jaune sable)
- 🔵 **Info** : #4db8a8 (turquoise)

## Démo

👉 Ouvrir `/notifications-demo.html` pour voir tous les exemples

