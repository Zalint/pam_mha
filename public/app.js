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
  initShell();

  // Charger les données (d'abord les actions, puis les programmes pour calculer les stats)
  await loadActions();
  await loadStatistics();
  await loadProgrammes();
  updateNavCounts();

  // Afficher le dashboard par défaut
  showView('dashboard');
});

/**
 * Recharge toutes les données et rafraîchit la vue courante.
 * Exposé globalement pour import-export.js (après import / restauration).
 */
window.refreshAppData = async function refreshAppData() {
  await loadActions();
  await loadStatistics();
  await loadProgrammes();
  updateNavCounts();
  if (AppState.view === 'actions') renderActionsList();
};

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

  // Export xlsx de la vue Actions courante (filtres appliqués) — accessible à tous
  document.getElementById('exportActionsBtn')?.addEventListener('click', () => {
    if (!window.ImportExport) return;
    window.ImportExport.doExport({
      programme: AppState.currentProgramme || undefined,
      statut: AppState.filters.statut || undefined,
      search: AppState.filters.search || undefined,
    });
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
  ['dashboard-view', 'actions-view', 'detail-view', 'import-view', 'versions-view'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Élément de navigation actif (le détail reste sous "Actions")
  document.querySelectorAll('.nav-item[data-view]').forEach((n) => {
    const v = n.getAttribute('data-view');
    n.classList.toggle('active', v === view || (view === 'detail' && v === 'actions'));
  });

  // Mettre à jour le breadcrumb
  const breadcrumb = document.getElementById('breadcrumb-current');
  const separator = document.getElementById('breadcrumb-separator');

  switch (view) {
    case 'dashboard':
      document.getElementById('dashboard-view').style.display = 'block';
      breadcrumb.textContent = 'Programmes';
      separator.style.display = 'none';
      break;

    case 'actions': {
      document.getElementById('actions-view').style.display = 'block';
      AppState.currentProgramme = param;
      const programmeName = param || 'Tous les programmes';
      const actionsTitleEl = document.getElementById('actionsTitle');
      if (actionsTitleEl) actionsTitleEl.textContent = `Actions — ${programmeName}`;
      breadcrumb.textContent = 'Programmes / Actions';
      separator.style.display = 'inline';
      renderActionsList();
      break;
    }

    case 'detail':
      document.getElementById('detail-view').style.display = 'block';
      if (param) loadActionDetail(param);
      breadcrumb.textContent = 'Programmes / Actions / Détails';
      separator.style.display = 'inline';
      break;

    case 'import':
      document.getElementById('import-view').style.display = 'block';
      breadcrumb.textContent = 'Import / Export';
      separator.style.display = 'none';
      break;

    case 'versions':
      document.getElementById('versions-view').style.display = 'block';
      breadcrumb.textContent = 'Versions';
      separator.style.display = 'none';
      if (window.ImportExport) window.ImportExport.renderVersions();
      break;
  }

  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
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

    // Graphiques du tableau de bord (remplace les anciens panneaux à emojis)
    renderDashboardCharts();
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

  const folderSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';

  grid.innerHTML = programmesData.map((prog, index) => `
    <div class="programme-card" data-programme="${escapeHtml(prog.name)}" data-index="${index}">
      <div class="programme-title">
        <span class="programme-icon">${folderSvg}</span>
        <span>${escapeHtml(prog.name)}</span>
      </div>
      <div class="programme-meta">${prog.actions.length} action${prog.actions.length > 1 ? 's' : ''}</div>
      <div class="programme-stats">
        <div class="programme-stat"><div class="label">Physique</div><div class="value">${prog.stats.physique.toFixed(1)}%</div></div>
        <div class="programme-stat"><div class="label">Financier</div><div class="value">${prog.stats.financier.toFixed(1)}%</div></div>
      </div>
      <div class="progress"><span style="width: ${Math.min(100, Math.max(0, prog.stats.physique))}%"></span></div>
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
  if (!AppState.actionsSort) AppState.actionsSort = { key: 'sortindex', dir: 1 };

  let rows = AppState.actions.slice();
  if (AppState.currentProgramme) rows = rows.filter(a => a.programme === AppState.currentProgramme);
  if (AppState.filters.statut) rows = rows.filter(a => a.statut === AppState.filters.statut);
  if (AppState.filters.search) {
    const q = AppState.filters.search;
    rows = rows.filter(a =>
      (a.intitule || '').toLowerCase().includes(q) ||
      (a.responsable || '').toLowerCase().includes(q) ||
      (a.programme || '').toLowerCase().includes(q) ||
      (a.activite || '').toLowerCase().includes(q)
    );
  }

  // Tri
  const { key, dir } = AppState.actionsSort;
  const numeric = (key === 'tauxphysique' || key === 'tauxfinancier' || key === 'sortindex');
  rows.sort((a, b) => {
    if (numeric) return ((parseFloat(a[key]) || 0) - (parseFloat(b[key]) || 0)) * dir;
    return String(a[key] == null ? '' : a[key]).toLowerCase()
      .localeCompare(String(b[key] == null ? '' : b[key]).toLowerCase()) * dir;
  });

  if (rows.length === 0) {
    list.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><h3>Aucune action</h3><p>Aucune action ne correspond aux filtres.</p></div>';
    return;
  }

  const arrow = (k) => AppState.actionsSort.key === k ? (AppState.actionsSort.dir === 1 ? '▲' : '▼') : '↕';
  const ariaSort = (k) => AppState.actionsSort.key === k ? (AppState.actionsSort.dir === 1 ? 'ascending' : 'descending') : 'none';

  const body = rows.map(a => {
    const ech = a.echeancelibelle || (a.echeance ? formatDate(a.echeance) : '—');
    const ph = parseFloat(a.tauxphysique) || 0, fi = parseFloat(a.tauxfinancier) || 0;
    return `
      <tr data-action-id="${a.id}">
        <td class="cell-title">${escapeHtml(a.intitule || a.activite || 'Sans titre')}</td>
        <td class="col-hide-sm">${escapeHtml(a.activite || a.action || '—')}</td>
        <td class="col-hide-sm">${escapeHtml(ech)}</td>
        <td class="col-num">${ph.toFixed(0)}% <span class="mini-progress"><span style="width:${Math.min(100, ph)}%"></span></span></td>
        <td class="col-num col-hide-sm">${fi.toFixed(0)}%</td>
        <td><span class="status-badge status-${getStatutSlug(a.statut)}">${escapeHtml(a.statut)}</span></td>
      </tr>`;
  }).join('');

  const th = (k, label, cls = '') =>
    `<th data-sort="${k}" class="${cls}" aria-sort="${ariaSort(k)}">${label} <span class="sort-ind">${arrow(k)}</span></th>`;

  list.innerHTML = `
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr>
          ${th('intitule', 'Intitulé')}
          ${th('activite', 'Activité', 'col-hide-sm')}
          ${th('echeance', 'Échéance', 'col-hide-sm')}
          ${th('tauxphysique', 'Physique', 'col-num')}
          ${th('tauxfinancier', 'Financier', 'col-num col-hide-sm')}
          ${th('statut', 'Statut')}
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <div class="text-muted" style="margin-top:12px;font-size:.82rem;">${rows.length} action${rows.length > 1 ? 's' : ''} affichée${rows.length > 1 ? 's' : ''}</div>`;

  list.querySelectorAll('tbody tr').forEach(tr =>
    tr.addEventListener('click', () => showView('detail', parseInt(tr.getAttribute('data-action-id')))));
  list.querySelectorAll('th[data-sort]').forEach(th =>
    th.addEventListener('click', () => {
      const k = th.getAttribute('data-sort');
      if (AppState.actionsSort.key === k) AppState.actionsSort.dir *= -1;
      else AppState.actionsSort = { key: k, dir: 1 };
      renderActionsList();
    }));
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
    document.getElementById('detail-echeance').textContent = action.echeancelibelle || formatDate(action.echeance) || '-';
    document.getElementById('detail-statut').innerHTML = `<span class="status-badge status-${getStatutSlug(action.statut)}">${escapeHtml(action.statut)}</span>`;

    // Avancement physique / financier : éditable en ligne (si droits)
    const ph = parseFloat(action.tauxphysique) || 0;
    const fi = parseFloat(action.tauxfinancier) || 0;
    const phI = document.getElementById('detail-physique-input');
    const fiI = document.getElementById('detail-financier-input');
    const phB = document.getElementById('detail-physique-bar');
    const fiB = document.getElementById('detail-financier-bar');
    phI.value = ph;
    fiI.value = fi;
    phB.style.width = Math.min(100, ph) + '%';
    fiB.style.width = Math.min(100, fi) + '%';

    const editable = canEditAction(action);
    phI.disabled = !editable;
    fiI.disabled = !editable;
    const hint = document.getElementById('avancementHint');
    if (hint) hint.style.display = editable ? 'block' : 'none';

    // Barre live pendant la saisie ; sauvegarde à la sortie du champ (onchange remplace l'ancien handler)
    phI.oninput = () => { phB.style.width = Math.min(100, Math.max(0, parseFloat(phI.value) || 0)) + '%'; };
    fiI.oninput = () => { fiB.style.width = Math.min(100, Math.max(0, parseFloat(fiI.value) || 0)) + '%'; };
    phI.onchange = () => saveAvancement(action.id);
    fiI.onchange = () => saveAvancement(action.id);

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
    document.getElementById('detail-budget-previsionnel').textContent = action.budgetprevisionnellibelle || formatNumber(action.budgetprevisionnel || action.budgettotal) || '-';
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

/**
 * Enregistre l'avancement physique/financier saisi en ligne dans la fiche détail.
 */
async function saveAvancement(actionId) {
  const phI = document.getElementById('detail-physique-input');
  const fiI = document.getElementById('detail-financier-input');
  const ph = Math.min(100, Math.max(0, parseFloat(phI.value) || 0));
  const fi = Math.min(100, Math.max(0, parseFloat(fiI.value) || 0));
  phI.value = ph;
  fiI.value = fi;
  document.getElementById('detail-physique-bar').style.width = ph + '%';
  document.getElementById('detail-financier-bar').style.width = fi + '%';

  try {
    await API.actions.update(actionId, { tauxPhysique: ph, tauxFinancier: fi });
    if (AppState.currentAction) { AppState.currentAction.tauxphysique = ph; AppState.currentAction.tauxfinancier = fi; }
    const a = AppState.actions.find(x => x.id === parseInt(actionId));
    if (a) { a.tauxphysique = ph; a.tauxfinancier = fi; }
    if (window.showSuccess) showSuccess('Avancement enregistré.', 'Mise à jour');
    await loadStatistics(); // rafraîchit KPIs + graphiques
  } catch (error) {
    if (window.showError) showError(error.message || 'Erreur lors de l\'enregistrement', 'Échec');
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

function getStatutSlug(statut) {
  const map = { 'À démarrer': 'a-demarrer', 'En cours': 'en-cours', 'En retard': 'en-retard', 'Achevé': 'acheve' };
  return map[statut] || 'a-demarrer';
}

// ===== Coquille (thème, menu, navigation latérale) =====

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarScrim')?.classList.remove('show');
}

function initShell() {
  // Thème clair/sombre (persisté)
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    if (AppState.view === 'dashboard') renderDashboardCharts();
  });

  // Menu mobile
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebarScrim')?.classList.toggle('show');
  });
  document.getElementById('sidebarScrim')?.addEventListener('click', closeSidebar);

  // Navigation latérale
  document.querySelectorAll('.nav-item[data-view]').forEach((n) => {
    n.addEventListener('click', () => showView(n.getAttribute('data-view')));
  });
  document.getElementById('navUsers')?.addEventListener('click', () => { window.location.href = '/users.html'; });

  // Bascule Physique / Financier des barres par programme
  document.querySelectorAll('#progMetricToggle .seg-btn').forEach((b) => {
    b.addEventListener('click', () => {
      AppState.programmeMetric = b.getAttribute('data-metric');
      document.querySelectorAll('#progMetricToggle .seg-btn').forEach((x) => x.classList.toggle('active', x === b));
      renderProgrammeBars();
    });
  });

  // Sections réservées à l'Admin
  if (AppState.user && AppState.user.role === 'Admin') {
    document.querySelectorAll('.admin-only').forEach((el) => { el.style.display = ''; });
  }
}

function updateNavCounts() {
  const a = document.getElementById('navActionsCount');
  if (a) a.textContent = AppState.actions.length;
}

// ===== Graphiques du tableau de bord (SVG/CSS, sans dépendance) =====

function renderDashboardCharts() {
  renderStatusDonut();
  renderProgrammeBars();
}

function renderStatusDonut() {
  const svg = document.getElementById('dashStatusDonut');
  const legend = document.getElementById('dashStatusLegend');
  if (!svg || !legend) return;

  const order = [
    ['À démarrer', '#64748B'], ['En cours', '#0EA5E9'],
    ['En retard', '#E0840B'], ['Achevé', '#0E9F6E'],
  ];
  const counts = order.map(([name]) => AppState.actions.filter(a => a.statut === name).length);
  const total = counts.reduce((s, n) => s + n, 0);

  const cx = 60, cy = 60, r = 44, C = 2 * Math.PI * r, sw = 16;
  let offset = 0, segs = '';
  order.forEach(([, color], i) => {
    const frac = total ? counts[i] / total : 0;
    const len = frac * C;
    if (len > 0) {
      segs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"></circle>`;
    }
    offset += len;
  });
  svg.innerHTML =
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${sw}"></circle>${segs}` +
    `<text class="donut-total" x="${cx}" y="${cy - 2}" text-anchor="middle" dominant-baseline="middle">${total}</text>` +
    `<text class="donut-sub" x="${cx}" y="${cy + 15}" text-anchor="middle">actions</text>`;
  legend.innerHTML = order.map(([name, color], i) =>
    `<div class="legend-row"><span class="legend-dot" style="background:${color}"></span><span class="legend-name">${name}</span><span class="legend-val">${counts[i]}</span></div>`
  ).join('');
}

function renderProgrammeBars() {
  const el = document.getElementById('dashProgrammeBars');
  if (!el) return;
  const metric = AppState.programmeMetric || 'tauxphysique';
  const titleEl = document.getElementById('progBarsTitle');
  if (titleEl) titleEl.textContent = `Avancement ${metric === 'tauxfinancier' ? 'financier' : 'physique'} par programme`;

  const progs = [...new Set(AppState.actions.map(a => a.programme))];
  if (!progs.length) { el.innerHTML = '<div class="loading">Aucune donnée</div>'; return; }
  const data = progs.map(p => {
    const acts = AppState.actions.filter(a => a.programme === p);
    const avg = acts.reduce((s, a) => s + (parseFloat(a[metric]) || 0), 0) / acts.length;
    return { p, avg };
  }).sort((a, b) => b.avg - a.avg);

  el.innerHTML = data.map(d => `
    <div class="bar-row">
      <div class="bar-head">
        <span class="bar-label" title="${escapeHtml(d.p)}">${escapeHtml(d.p)}</span>
        <span class="bar-val">${d.avg.toFixed(1)}%</span>
      </div>
      <span class="bar-track"><span class="bar-fill" style="width:${Math.min(100, Math.max(0, d.avg))}%"></span></span>
    </div>`).join('');
}

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
