/**
 * Application principale - Gestion du suivi des PAM
 * Design moderne avec navigation hiérarchique
 */

// État global de l'application
const AppState = {
  user: null,
  actions: [],
  programmes: [],
  currentProgramme: null,
  currentAction: null,
  filters: {
    programme: '',
    statut: '',
    search: '',
  },
  view: 'dashboard', // dashboard, actions, detail
};

// ===== Initialisation =====

document.addEventListener('DOMContentLoaded', async () => {
  // Récupérer l'utilisateur
  AppState.user = API.getUser();
  
  if (!AppState.user) {
    API.logout();
    return;
  }

  // Afficher les infos utilisateur
  document.getElementById('userName').textContent = AppState.user.fullName;
  document.getElementById('userRole').textContent = AppState.user.role;

  // Afficher le bouton de gestion des utilisateurs pour les admins
  if (AppState.user.role === 'Admin') {
    document.getElementById('usersManagementBtn').style.display = 'flex';
  }

  // Initialiser les événements
  initEventListeners();

  // Charger les données (d'abord les actions, puis les programmes pour calculer les stats)
  await loadActions();
  await loadStatistics();
  await loadProgrammes();
  
  // Afficher le dashboard par défaut
  showView('dashboard');
});

// ===== Événements =====

function initEventListeners() {
  // Gestion des utilisateurs (Admin uniquement)
  const usersManagementBtn = document.getElementById('usersManagementBtn');
  if (usersManagementBtn) {
    usersManagementBtn.addEventListener('click', () => {
      window.location.href = '/users.html';
    });
  }

  // Changer mon mot de passe
  document.getElementById('changePasswordBtn').addEventListener('click', async () => {
    const currentPassword = prompt('Mot de passe actuel :');
    if (!currentPassword) return;

    const newPassword = prompt('Nouveau mot de passe (minimum 6 caractères) :');
    if (!newPassword) return;

    if (newPassword.length < 6) {
      showError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const confirmPassword = prompt('Confirmez le nouveau mot de passe :');
    if (confirmPassword !== newPassword) {
      showError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await API.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      showSuccess('Mot de passe modifié avec succès !');
    } catch (error) {
      showError(error.message || 'Erreur lors du changement de mot de passe');
    }
  });

  // Déconnexion
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (await confirmAction('Voulez-vous vous déconnecter ?', 'Déconnexion')) {
      API.logout();
    }
  });

  // Filtres actions
  document.getElementById('filterStatut')?.addEventListener('change', (e) => {
    AppState.filters.statut = e.target.value;
    renderActionsList();
  });

  document.getElementById('filterSearch')?.addEventListener('input', (e) => {
    AppState.filters.search = e.target.value.toLowerCase();
    renderActionsList();
  });

  // Bouton nouvelle action
  document.getElementById('addActionBtn')?.addEventListener('click', () => {
    openActionModal();
  });

  // Bouton modifier dans détail
  document.getElementById('editActionBtn')?.addEventListener('click', () => {
    if (AppState.currentAction) {
      openActionModal(AppState.currentAction);
    }
  });

  // Bouton supprimer dans détail
  document.getElementById('deleteActionBtn')?.addEventListener('click', async () => {
    if (AppState.currentAction) {
      await deleteAction(AppState.currentAction.id);
    }
  });

  // Bouton retour aux actions
  document.getElementById('backToActionsBtn')?.addEventListener('click', () => {
    if (AppState.currentProgramme) {
      showView('actions', AppState.currentProgramme);
    } else {
      showView('dashboard');
    }
  });

  // Modal
  document.getElementById('closeModalBtn')?.addEventListener('click', closeActionModal);
  document.getElementById('cancelBtn')?.addEventListener('click', closeActionModal);
  document.getElementById('actionForm')?.addEventListener('submit', handleActionSubmit);

  // Fermer modal en cliquant à l'extérieur
  document.getElementById('actionModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'actionModal') {
      closeActionModal();
    }
  });
}

// ===== Navigation =====

function showView(view, param = null) {
  AppState.view = view;
  
  // Masquer toutes les vues
  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('actions-view').style.display = 'none';
  document.getElementById('detail-view').style.display = 'none';

  // Mettre à jour le breadcrumb
  const breadcrumb = document.getElementById('breadcrumb-current');
  const separator = document.getElementById('breadcrumb-separator');

  switch (view) {
    case 'dashboard':
      document.getElementById('dashboard-view').style.display = 'block';
      breadcrumb.textContent = 'Programmes';
      separator.style.display = 'none';
      break;

    case 'actions':
      document.getElementById('actions-view').style.display = 'block';
      AppState.currentProgramme = param;
      const programmeName = param || 'Tous les programmes';
      const actionsTitleEl = document.getElementById('actionsTitle');
      if (actionsTitleEl) {
        actionsTitleEl.textContent = `Actions - ${programmeName}`;
      }
      breadcrumb.textContent = `Programmes > Actions`;
      separator.style.display = 'inline';
      renderActionsList();
      break;

    case 'detail':
      document.getElementById('detail-view').style.display = 'block';
      if (param) {
        loadActionDetail(param);
      }
      breadcrumb.textContent = 'Programmes > Actions > Détails';
      separator.style.display = 'inline';
      break;
  }
}

// Fonction globale pour la navigation
window.showView = showView;

// ===== Chargement des données =====

async function loadProgrammes() {
  try {
    const programmes = await API.statistics.getProgrammes();
    AppState.programmes = programmes;
    renderProgrammes();
  } catch (error) {
    console.error('Erreur chargement programmes:', error);
  }
}

async function loadStatistics() {
  try {
    const stats = await API.statistics.get();

    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statEnRetard').textContent = stats.enRetard;
    document.getElementById('statAcheve').textContent = stats.acheve;
    document.getElementById('statPhysique').textContent = stats.tauxAvancementPhysique + '%';
    document.getElementById('statFinancier').textContent = stats.tauxAvancementFinancier + '%';
    
    // Enrichir les cards avec des détails
    enrichStatCards();
  } catch (error) {
    console.error('Erreur chargement statistiques:', error);
  }
}

function enrichStatCards() {
  // Actions en retard - afficher les détails
  const actionsEnRetard = AppState.actions.filter(a => a.statut === 'En retard');
  const cardEnRetard = document.querySelector('.stat-card.stat-warning');
  if (cardEnRetard && actionsEnRetard.length > 0) {
    const details = `
      <div class="stat-card-details warning">
        <div class="stat-detail-title">⚠️ Actions en retard</div>
        <ul class="stat-detail-list">
          ${actionsEnRetard.slice(0, 5).map(a => `
            <li class="stat-detail-list-item clickable" data-action-id="${a.id}">
              <span style="flex: 1;">${escapeHtml(a.intitule.substring(0, 60))}${a.intitule.length > 60 ? '...' : ''}</span>
              <span class="stat-detail-responsible">👤 ${escapeHtml(a.responsable)}</span>
            </li>
          `).join('')}
          ${actionsEnRetard.length > 5 ? `<li class="stat-detail-list-item" style="font-style: italic; color: var(--color-text-muted);">... et ${actionsEnRetard.length - 5} autre(s)</li>` : ''}
        </ul>
      </div>
    `;
    cardEnRetard.insertAdjacentHTML('beforeend', details);
    
    // Ajouter les event listeners pour les clics sur les actions
    cardEnRetard.querySelectorAll('.stat-detail-list-item.clickable').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionId = item.getAttribute('data-action-id');
        if (actionId) {
          showView('detail', actionId);
        }
      });
    });
  }
  
  // Actions achevées - afficher les détails
  const actionsAchevees = AppState.actions.filter(a => a.statut === 'Achevé');
  const cardAcheve = document.querySelectorAll('.stat-card.stat-success')[0];
  if (cardAcheve && actionsAchevees.length > 0) {
    const details = `
      <div class="stat-card-details success">
        <div class="stat-detail-title">✅ Actions achevées</div>
        <ul class="stat-detail-list">
          ${actionsAchevees.slice(0, 5).map(a => `
            <li class="stat-detail-list-item clickable" data-action-id="${a.id}">
              <span style="flex: 1;">${escapeHtml(a.intitule.substring(0, 60))}${a.intitule.length > 60 ? '...' : ''}</span>
              <span class="stat-detail-responsible">👤 ${escapeHtml(a.responsable)}</span>
            </li>
          `).join('')}
          ${actionsAchevees.length > 5 ? `<li class="stat-detail-list-item" style="font-style: italic; color: var(--color-text-muted);">... et ${actionsAchevees.length - 5} autre(s)</li>` : ''}
        </ul>
      </div>
    `;
    cardAcheve.insertAdjacentHTML('beforeend', details);
    
    // Ajouter les event listeners pour les clics sur les actions
    cardAcheve.querySelectorAll('.stat-detail-list-item.clickable').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionId = item.getAttribute('data-action-id');
        if (actionId) {
          showView('detail', actionId);
        }
      });
    });
  }
  
  // Programmes les plus avancés
  const programmesAvances = [...new Set(AppState.actions.map(a => a.programme))]
    .map(prog => {
      const actions = AppState.actions.filter(a => a.programme === prog);
      const avgPhysique = actions.reduce((sum, a) => sum + parseFloat(a.tauxphysique || 0), 0) / actions.length;
      return { programme: prog, avg: avgPhysique, count: actions.length };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3);
    
  const cardPhysique = document.querySelectorAll('.stat-card')[3];
  if (cardPhysique && programmesAvances.length > 0) {
    const details = `
      <div class="stat-card-details">
        <div class="stat-detail-title">Top 3 Programmes</div>
        ${programmesAvances.map((p, i) => `
          <div class="stat-detail-item clickable" data-programme="${escapeHtml(p.programme)}" data-index="${i}">
            <span class="stat-detail-label">${i + 1}. ${escapeHtml(p.programme.substring(0, 40))}...</span>
            <span class="stat-detail-value">${p.avg.toFixed(1)}%</span>
          </div>
        `).join('')}
      </div>
    `;
    cardPhysique.insertAdjacentHTML('beforeend', details);
    
    // Ajouter les event listeners pour les clics sur les programmes
    cardPhysique.querySelectorAll('.stat-detail-item.clickable').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation(); // Empêcher le clic de se propager à la card
        const programmeName = item.getAttribute('data-programme');
        showView('actions', programmeName);
      });
    });
  }
}

async function loadActions() {
  try {
    const filters = {};
    if (AppState.filters.programme) {
      filters.programme = AppState.filters.programme;
    }
    
    const actions = await API.actions.getAll(filters);
    AppState.actions = actions;
    
    // Debug : vérifier les données
    console.log('Actions chargées:', actions.length);
    if (actions.length > 0) {
      console.log('Exemple action:', {
        programme: actions[0].programme,
        tauxphysique: actions[0].tauxphysique,
        tauxfinancier: actions[0].tauxfinancier
      });
    }
  } catch (error) {
    console.error('Erreur chargement actions:', error);
    showError('Erreur lors du chargement des actions');
  }
}

// ===== Affichage =====

function renderProgrammes() {
  const grid = document.getElementById('programmesGrid');
  
  if (AppState.programmes.length === 0) {
    grid.innerHTML = '<div class="loading">Aucun programme trouvé</div>';
    return;
  }

  // Grouper les actions par programme
  const programmesData = AppState.programmes.map(prog => {
    const actionsProg = AppState.actions.filter(a => a.programme === prog);
    const stats = calculateProgrammeStats(actionsProg);
    
    // Debug pour chaque programme
    console.log(`Programme: ${prog}`, {
      nbActions: actionsProg.length,
      stats: stats,
      exemples: actionsProg.slice(0, 2).map(a => ({
        intitule: a.intitule,
        tauxphysique: a.tauxphysique,
        tauxfinancier: a.tauxfinancier
      }))
    });
    
    return { name: prog, actions: actionsProg, stats };
  });

  grid.innerHTML = programmesData.map((prog, index) => `
    <div class="programme-card" data-programme="${escapeHtml(prog.name)}" data-index="${index}">
      <div class="programme-header">
        <h3 class="programme-title">📁 ${escapeHtml(prog.name)}</h3>
        <div class="programme-meta">
          <span>${prog.actions.length} action${prog.actions.length > 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="programme-stats">
        <div class="programme-stat">
          <span class="programme-stat-label">Physique</span>
          <span class="programme-stat-value">${prog.stats.physique.toFixed(1)}%</span>
        </div>
        <div class="programme-stat">
          <span class="programme-stat-label">Financier</span>
          <span class="programme-stat-value">${prog.stats.financier.toFixed(1)}%</span>
        </div>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar ${prog.stats.physique < 25 ? 'danger' : prog.stats.physique < 50 ? 'warning' : 'success'}" 
             style="width: ${Math.min(100, Math.max(0, prog.stats.physique))}%">
        </div>
      </div>
    </div>
  `).join('');
  
  // Ajouter les event listeners après le rendu
  grid.querySelectorAll('.programme-card').forEach(card => {
    card.addEventListener('click', () => {
      const programmeName = card.getAttribute('data-programme');
      showView('actions', programmeName);
    });
  });
}

function calculateProgrammeStats(actions) {
  if (actions.length === 0) {
    return { physique: 0, financier: 0 };
  }
  
  // Récupérer les valeurs (gérer les différents noms de colonnes possibles)
  const totalPhysique = actions.reduce((sum, a) => {
    const valeur = parseFloat(a.tauxphysique || a.tauxPhysique || 0);
    return sum + (isNaN(valeur) ? 0 : valeur);
  }, 0);
  
  const totalFinancier = actions.reduce((sum, a) => {
    const valeur = parseFloat(a.tauxfinancier || a.tauxFinancier || 0);
    return sum + (isNaN(valeur) ? 0 : valeur);
  }, 0);
  
  const moyennePhysique = totalPhysique / actions.length;
  const moyenneFinancier = totalFinancier / actions.length;
  
  return {
    physique: Math.round(moyennePhysique * 100) / 100, // Arrondir à 2 décimales
    financier: Math.round(moyenneFinancier * 100) / 100
  };
}

function renderActionsList() {
  const list = document.getElementById('actionsList');
  
  let filteredActions = AppState.actions;
  
  // Filtrer par programme
  if (AppState.currentProgramme) {
    filteredActions = filteredActions.filter(a => a.programme === AppState.currentProgramme);
  }
  
  // Filtrer par statut
  if (AppState.filters.statut) {
    filteredActions = filteredActions.filter(a => a.statut === AppState.filters.statut);
  }
  
  // Filtrer par recherche
  if (AppState.filters.search) {
    filteredActions = filteredActions.filter(a => 
      a.intitule?.toLowerCase().includes(AppState.filters.search) ||
      a.responsable?.toLowerCase().includes(AppState.filters.search) ||
      a.programme?.toLowerCase().includes(AppState.filters.search)
    );
  }
  
  if (filteredActions.length === 0) {
    list.innerHTML = '<div class="loading">Aucune action trouvée</div>';
    return;
  }

  list.innerHTML = filteredActions.map(action => `
    <div class="action-card" data-action-id="${action.id}">
      <div class="action-card-header">
        <div>
          <h4>${escapeHtml(action.intitule || action.activite || 'Sans titre')}</h4>
          <div class="badges">
            <span class="badge badge-physique">${action.tauxphysique || 0}% physique</span>
            <span class="badge badge-financier">${action.tauxfinancier || 0}% financier</span>
            <span class="badge badge-statut badge-${getStatutClass(action.statut)}">${escapeHtml(action.statut)}</span>
          </div>
        </div>
      </div>
      <div class="action-meta">
        <span>Responsable: ${escapeHtml(action.responsable)}</span>
        <span>Échéance: ${formatDate(action.echeance)}</span>
      </div>
    </div>
  `).join('');
  
  // Ajouter les event listeners après le rendu
  list.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => {
      const actionId = parseInt(card.getAttribute('data-action-id'));
      showView('detail', actionId);
    });
  });
}

function getStatutClass(statut) {
  const map = {
    'À démarrer': 'default',
    'En cours': 'info',
    'En retard': 'warning',
    'Achevé': 'success'
  };
  return map[statut] || 'default';
}

async function loadActionDetail(id) {
  try {
    const action = await API.actions.getById(id);
    AppState.currentAction = action;
    
    // Réinitialiser les onglets après le chargement
    setTimeout(() => {
      initTabs();
      // Activer l'onglet général par défaut
      switchTab('general');
      
      // Déclencher événement pour la version mobile
      window.dispatchEvent(new Event('actionLoaded'));
    }, 100);
    
    // Remplir les onglets
    document.getElementById('detailTitle').textContent = action.intitule || action.activite || 'Détails';
    document.getElementById('detail-programme').textContent = action.programme || '-';
    document.getElementById('detail-action').textContent = action.action || action.sousdirection || '-';
    document.getElementById('detail-activite').textContent = action.activite || '-';
    document.getElementById('detail-intitule').textContent = action.intitule || '-';
    document.getElementById('detail-responsable').textContent = action.responsable || '-';
    document.getElementById('detail-echeance').textContent = formatDate(action.echeance) || '-';
    document.getElementById('detail-statut').innerHTML = `<span class="badge badge-statut badge-${getStatutClass(action.statut)}">${escapeHtml(action.statut)}</span>`;
    document.getElementById('detail-commentaire').textContent = action.commentaire || '-';
    
    // Résultats attendus
    const resultats = action.resultatsattendus || '';
    if (resultats) {
      const resultatsList = resultats.split('\n').filter(r => r.trim());
      document.getElementById('detail-resultats').innerHTML = resultatsList.map(r => 
        `<div class="resultat-item">• ${escapeHtml(r.trim())}</div>`
      ).join('');
    } else {
      document.getElementById('detail-resultats').innerHTML = '<p class="text-muted">Aucun résultat attendu défini</p>';
    }
    
    // Indicateurs
    document.getElementById('detail-indicateurs-cibles').textContent = action.indicateurscibles || '-';
    document.getElementById('detail-indicateurs-resultats').innerHTML = action.indicateursresultats 
      ? `<span class="badge badge-physique">${action.indicateursresultats}%</span>` 
      : '-';
    
    // Budget
    document.getElementById('detail-budget-previsionnel').textContent = formatNumber(action.budgetprevisionnel || action.budgettotal) || '-';
    document.getElementById('detail-budget-t1').textContent = formatNumber(action.budgett1) || '-';
    document.getElementById('detail-budget-t2').textContent = formatNumber(action.budgett2) || '-';
    document.getElementById('detail-budget-t3').textContent = formatNumber(action.budgett3) || '-';
    document.getElementById('detail-budget-t4').textContent = formatNumber(action.budgett4) || '-';
    document.getElementById('detail-budget-total').textContent = formatNumber(action.budgettotal) || '-';
    
    // Historique
    loadHistorique(id);
    
    // Afficher les boutons selon les permissions
    updateActionButtons(action);
    
  } catch (error) {
    console.error('Erreur chargement détail:', error);
    showError('Erreur lors du chargement des détails');
  }
}

async function loadHistorique(actionId) {
  try {
    const historique = await API.actions.getHistorique(actionId);
    const historiqueList = document.getElementById('detail-historique');
    
    if (historique.length === 0) {
      historiqueList.innerHTML = '<p class="text-muted">Aucune modification enregistrée</p>';
      return;
    }
    
    historiqueList.innerHTML = historique.map(h => `
      <div class="historique-item">
        <div class="historique-header">
          <strong>${escapeHtml(h.champmodifie)}</strong>
          <span class="historique-date">${formatDateTime(h.createdat)}</span>
        </div>
        <div class="historique-content">
          <span class="historique-old">${escapeHtml(h.anciennevaleur || '-')}</span>
          <span>→</span>
          <span class="historique-new">${escapeHtml(h.nouvellevaleur || '-')}</span>
        </div>
        <div class="historique-user">Par ${escapeHtml(h.username || 'Utilisateur')}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur chargement historique:', error);
  }
}

/**
 * Vérifie si l'utilisateur peut modifier/supprimer l'action
 * Admin: toujours autorisé
 * Directeur: seulement si l'action lui est assignée
 * Ministre: jamais
 */
function canEditAction(action) {
  const user = AppState.user;
  
  // Admin : toujours autorisé
  if (user.role === 'Admin') {
    return true;
  }
  
  // Ministre : lecture seule
  if (user.role === 'Ministre') {
    return false;
  }
  
  // Directeur : vérifier si l'action est dans la liste visible
  // Si l'action est visible, c'est qu'elle est assignée
  if (user.role === 'Directeur') {
    return AppState.actions.some(a => a.id === action.id);
  }
  
  return false;
}

/**
 * Met à jour la visibilité des boutons Modifier/Supprimer
 */
function updateActionButtons(action) {
  const editBtn = document.getElementById('editActionBtn');
  const deleteBtn = document.getElementById('deleteActionBtn');
  
  const canEdit = canEditAction(action);
  
  if (editBtn) {
    editBtn.style.display = canEdit ? 'inline-block' : 'none';
  }
  
  if (deleteBtn) {
    deleteBtn.style.display = canEdit ? 'inline-block' : 'none';
  }
}

/**
 * Supprime une action après confirmation
 */
async function deleteAction(actionId) {
  if (!await confirmAction('Êtes-vous sûr de vouloir supprimer cette action ? Cette action est irréversible.', 'Suppression')) {
    return;
  }
  
  try {
    await API.actions.delete(actionId);
    showSuccess('Action supprimée avec succès');
    
    // Retourner à la vue précédente
    if (AppState.currentProgramme) {
      await loadActions(); // Recharger les actions
      showView('actions', AppState.currentProgramme);
    } else {
      await loadActions(); // Recharger les actions
      await loadStatistics(); // Recharger les stats
      showView('dashboard');
    }
  } catch (error) {
    console.error('Erreur suppression action:', error);
    showError(error.message || 'Erreur lors de la suppression de l\'action');
  }
}

// ===== Onglets =====

// Initialiser les event listeners pour les onglets
function initTabs() {
  document.querySelectorAll('.tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Masquer tous les onglets
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Afficher l'onglet sélectionné
  const tabContent = document.getElementById('tab-' + tabName);
  const tabButton = document.querySelector(`.tab[data-tab="${tabName}"]`);
  
  if (tabContent) {
    tabContent.classList.add('active');
  }
  if (tabButton) {
    tabButton.classList.add('active');
  }
}

// ===== Modal =====

function openActionModal(action = null) {
  AppState.currentAction = action;
  
  const modal = document.getElementById('actionModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('actionForm');

  if (action) {
    modalTitle.textContent = 'Modifier l\'action';
    
    // Remplir le formulaire
    document.getElementById('actionId').value = action.id;
    document.getElementById('actionProgramme').value = action.programme || '';
    document.getElementById('actionAction').value = action.action || action.sousdirection || '';
    document.getElementById('actionActivite').value = action.activite || '';
    document.getElementById('actionIntitule').value = action.intitule || '';
    document.getElementById('actionResponsable').value = action.responsable || '';
    document.getElementById('actionEcheance').value = action.echeance || '';
    document.getElementById('actionTauxPhysique').value = action.tauxphysique || 0;
    document.getElementById('actionTauxFinancier').value = action.tauxfinancier || 0;
    document.getElementById('actionStatut').value = action.statut || 'À démarrer';
    document.getElementById('actionResultatsAttendus').value = action.resultatsattendus || '';
    document.getElementById('actionIndicateursCibles').value = action.indicateurscibles || '';
    document.getElementById('actionIndicateursResultats').value = action.indicateursresultats || '';
    document.getElementById('actionBudgetPrevisionnel').value = action.budgetprevisionnel || action.budgettotal || '';
    document.getElementById('actionBudgetT1').value = action.budgett1 || '';
    document.getElementById('actionBudgetT2').value = action.budgett2 || '';
    document.getElementById('actionBudgetT3').value = action.budgett3 || '';
    document.getElementById('actionBudgetT4').value = action.budgett4 || '';
    document.getElementById('actionCommentaire').value = action.commentaire || '';
  } else {
    modalTitle.textContent = 'Nouvelle action';
    form.reset();
    document.getElementById('actionId').value = '';
    
    // Pré-remplir le programme si l'utilisateur est Directeur
    if (AppState.user.role === 'Directeur' && AppState.user.programme) {
      document.getElementById('actionProgramme').value = AppState.user.programme;
    }
    
    // Pré-remplir le programme courant si on vient de la vue actions
    if (AppState.currentProgramme) {
      document.getElementById('actionProgramme').value = AppState.currentProgramme;
    }
  }

  modal.classList.add('active');
}

function closeActionModal() {
  const modal = document.getElementById('actionModal');
  modal.classList.remove('active');
  AppState.currentAction = null;
}

async function handleActionSubmit(e) {
  e.preventDefault();

  const actionData = {
    programme: document.getElementById('actionProgramme').value,
    action: document.getElementById('actionAction').value,
    activite: document.getElementById('actionActivite').value,
    intitule: document.getElementById('actionIntitule').value,
    responsable: document.getElementById('actionResponsable').value,
    echeance: document.getElementById('actionEcheance').value,
    tauxPhysique: parseFloat(document.getElementById('actionTauxPhysique').value) || 0,
    tauxFinancier: parseFloat(document.getElementById('actionTauxFinancier').value) || 0,
    statut: document.getElementById('actionStatut').value,
    resultatsAttendus: document.getElementById('actionResultatsAttendus').value,
    indicateursCibles: document.getElementById('actionIndicateursCibles').value,
    indicateursResultats: parseFloat(document.getElementById('actionIndicateursResultats').value) || null,
    budgetPrevisionnel: parseFloat(document.getElementById('actionBudgetPrevisionnel').value) || null,
    budgetT1: parseFloat(document.getElementById('actionBudgetT1').value) || null,
    budgetT2: parseFloat(document.getElementById('actionBudgetT2').value) || null,
    budgetT3: parseFloat(document.getElementById('actionBudgetT3').value) || null,
    budgetT4: parseFloat(document.getElementById('actionBudgetT4').value) || null,
    commentaire: document.getElementById('actionCommentaire').value,
  };

  try {
    const actionId = document.getElementById('actionId').value;

    if (actionId) {
      // Mise à jour
      await API.actions.update(actionId, actionData);
      showSuccess('Action mise à jour avec succès');
    } else {
      // Création
      await API.actions.create(actionData);
      showSuccess('Action créée avec succès');
    }

    closeActionModal();
    await loadActions();
    await loadProgrammes();
    await loadStatistics();
    
    // Recharger la vue actuelle
    if (AppState.view === 'actions') {
      renderActionsList();
    } else if (AppState.view === 'detail' && AppState.currentAction) {
      loadActionDetail(AppState.currentAction.id);
    } else {
      renderProgrammes();
    }
  } catch (error) {
    console.error('Erreur sauvegarde action:', error);
    showError(error.message || 'Erreur lors de la sauvegarde');
  }
}

// ===== Utilitaires =====

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR');
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('fr-FR');
}

function formatNumber(num) {
  if (!num) return '';
  return new Intl.NumberFormat('fr-FR').format(num);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Note: showSuccess et showError sont maintenant fournis par notifications.js
// Pas besoin de les redéfinir ici

// ===== Auto-refresh périodique (optionnel) =====

// Rafraîchir les données toutes les 5 minutes
setInterval(async () => {
  await loadStatistics();
  await loadActions();
  if (AppState.view === 'dashboard') {
    renderProgrammes();
  } else if (AppState.view === 'actions') {
    renderActionsList();
  }
}, 5 * 60 * 1000);
