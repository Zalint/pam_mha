/* ===== Système de notifications modernes ===== */
/* Conforme à la charte institutionnelle sénégalaise */

// ===== Toast Notifications =====

/**
 * Affiche une notification toast
 * @param {string} message - Message à afficher
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Durée en ms (0 = infini)
 * @param {string} title - Titre optionnel
 */
function showToast(message, type = 'info', duration = 5000, title = null) {
  // Créer le container s'il n'existe pas
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Créer le toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Déterminer l'icône selon le type
  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i'
  };

  // Déterminer le titre par défaut selon le type
  const defaultTitles = {
    success: 'Succès',
    error: 'Erreur',
    warning: 'Attention',
    info: 'Information'
  };

  const toastTitle = title || defaultTitles[type] || 'Notification';
  const icon = icons[type] || 'i';

  // Construire le contenu
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(toastTitle)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="Fermer">✕</button>
  `;

  // Ajouter au container
  container.appendChild(toast);

  // Gérer la fermeture
  const closeBtn = toast.querySelector('.toast-close');
  const closeToast = () => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      // Supprimer le container s'il est vide
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300);
  };

  closeBtn.addEventListener('click', closeToast);

  // Auto-fermeture après la durée spécifiée
  if (duration > 0) {
    setTimeout(closeToast, duration);
  }

  return toast;
}

/**
 * Raccourcis pour les différents types de toasts
 */
function showSuccess(message, title = null, duration = 5000) {
  return showToast(message, 'success', duration, title);
}

function showError(message, title = null, duration = 7000) {
  return showToast(message, 'error', duration, title);
}

function showWarning(message, title = null, duration = 6000) {
  return showToast(message, 'warning', duration, title);
}

function showInfo(message, title = null, duration = 5000) {
  return showToast(message, 'info', duration, title);
}

// ===== Modal =====

/**
 * Affiche un modal
 * @param {Object} options - Configuration du modal
 * @returns {Promise} - Résolu avec la valeur du bouton cliqué
 */
function showModal(options) {
  return new Promise((resolve) => {
    const {
      title = 'Confirmation',
      message = '',
      type = 'info', // 'success', 'error', 'warning', 'info', 'confirm'
      confirmText = 'OK',
      cancelText = null,
      isDangerous = false // Pour les actions destructives
    } = options;

    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Déterminer l'icône selon le type
    const icons = {
      success: '✓',
      error: '✕',
      warning: '!',
      info: 'i',
      confirm: '?'
    };

    const icon = icons[type] || 'i';

    // Construire le modal
    const modalHtml = `
      <div class="modal-container modal-${type}">
        <div class="modal-header">
          <div class="modal-icon">${icon}</div>
          <div class="modal-header-content">
            <h3 class="modal-title">${escapeHtml(title)}</h3>
          </div>
        </div>
        <div class="modal-body">${escapeHtml(message)}</div>
        <div class="modal-footer">
          ${cancelText ? `<button class="modal-btn modal-btn-secondary" data-action="cancel">${escapeHtml(cancelText)}</button>` : ''}
          <button class="modal-btn ${isDangerous ? 'modal-btn-danger' : 'modal-btn-primary'}" data-action="confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    overlay.innerHTML = modalHtml;
    document.body.appendChild(overlay);

    // Gérer les clics sur les boutons
    const handleAction = (action) => {
      overlay.classList.add('modal-exit');
      setTimeout(() => {
        overlay.remove();
        resolve(action);
      }, 200);
    };

    // Boutons
    const confirmBtn = overlay.querySelector('[data-action="confirm"]');
    const cancelBtn = overlay.querySelector('[data-action="cancel"]');

    confirmBtn.addEventListener('click', () => handleAction(true));
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => handleAction(false));
    }

    // Fermer avec ESC
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleAction(false);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Clic sur l'overlay (en dehors du modal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        handleAction(false);
      }
    });

    // Focus sur le bouton principal
    setTimeout(() => confirmBtn.focus(), 100);
  });
}

/**
 * Raccourcis pour les modals courants
 */
async function confirmAction(message, title = 'Confirmation') {
  return await showModal({
    title,
    message,
    type: 'confirm',
    confirmText: 'Confirmer',
    cancelText: 'Annuler'
  });
}

async function confirmDelete(message = 'Êtes-vous sûr de vouloir supprimer cet élément ?') {
  return await showModal({
    title: 'Confirmer la suppression',
    message,
    type: 'warning',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    isDangerous: true
  });
}

async function showAlert(message, title = 'Information', type = 'info') {
  return await showModal({
    title,
    message,
    type,
    confirmText: 'OK',
    cancelText: null
  });
}

// ===== Utilitaires =====

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== Export global =====
window.notifications = {
  showToast,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showModal,
  confirmAction,
  confirmDelete,
  showAlert
};

