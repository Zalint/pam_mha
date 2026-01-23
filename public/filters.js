/**
 * Gestion des filtres avancés
 */

const FiltersState = {
  physiqueEnabled: true,
  physiqueValue: 15,
  financierEnabled: true,
  financierValue: 15,
  statusFilters: {
    'En cours': true,
    'À démarrer': true,
    'En retard': true,
    'Achevé': true
  },
  filteredActions: []
};

// Initialisation des filtres
function initFilters() {
  const showBtn = document.getElementById('showFiltersBtn');
  const toggleBtn = document.getElementById('toggleFilters');
  const filtersContainer = document.getElementById('advancedFilters');
  const resetBtn = document.getElementById('resetFilters');
  
  // Afficher/masquer les filtres
  showBtn.addEventListener('click', () => {
    filtersContainer.style.display = 'block';
    showBtn.style.display = 'none';
    applyFilters();
  });
  
  toggleBtn.addEventListener('click', () => {
    filtersContainer.style.display = 'none';
    showBtn.style.display = 'inline-flex';
  });
  
  // Réinitialiser
  resetBtn.addEventListener('click', () => {
    FiltersState.physiqueValue = 15;
    FiltersState.financierValue = 15;
    FiltersState.physiqueEnabled = true;
    FiltersState.financierEnabled = true;
    FiltersState.statusFilters = {
      'En cours': true,
      'À démarrer': true,
      'En retard': true,
      'Achevé': true
    };
    
    document.getElementById('filterPhysiqueEnabled').checked = true;
    document.getElementById('filterFinancierEnabled').checked = true;
    document.getElementById('filterPhysiqueSlider').value = 15;
    document.getElementById('filterFinancierSlider').value = 15;
    document.getElementById('filterPhysiqueValue').value = 15;
    document.getElementById('filterFinancierValue').value = 15;
    document.getElementById('filterStatusEnCours').checked = true;
    document.getElementById('filterStatusADemarrer').checked = true;
    document.getElementById('filterStatusEnRetard').checked = true;
    document.getElementById('filterStatusAcheve').checked = true;
    
    updateSliderBackground('filterPhysiqueSlider', 15);
    updateSliderBackground('filterFinancierSlider', 15);
    applyFilters();
  });
  
  // Filtre Physique - Checkbox
  document.getElementById('filterPhysiqueEnabled').addEventListener('change', (e) => {
    FiltersState.physiqueEnabled = e.target.checked;
    document.getElementById('filterPhysiqueSlider').disabled = !e.target.checked;
    document.getElementById('filterPhysiqueValue').disabled = !e.target.checked;
    applyFilters();
  });
  
  // Filtre Physique - Slider
  document.getElementById('filterPhysiqueSlider').addEventListener('input', (e) => {
    FiltersState.physiqueValue = parseInt(e.target.value);
    document.getElementById('filterPhysiqueValue').value = e.target.value;
    updateSliderBackground('filterPhysiqueSlider', e.target.value);
    applyFilters();
  });
  
  // Filtre Physique - Input
  document.getElementById('filterPhysiqueValue').addEventListener('input', (e) => {
    let value = parseInt(e.target.value) || 0;
    value = Math.max(0, Math.min(100, value)); // Clamp entre 0 et 100
    FiltersState.physiqueValue = value;
    document.getElementById('filterPhysiqueSlider').value = value;
    updateSliderBackground('filterPhysiqueSlider', value);
    applyFilters();
  });
  
  // Filtre Financier - Checkbox
  document.getElementById('filterFinancierEnabled').addEventListener('change', (e) => {
    FiltersState.financierEnabled = e.target.checked;
    document.getElementById('filterFinancierSlider').disabled = !e.target.checked;
    document.getElementById('filterFinancierValue').disabled = !e.target.checked;
    applyFilters();
  });
  
  // Filtre Financier - Slider
  document.getElementById('filterFinancierSlider').addEventListener('input', (e) => {
    FiltersState.financierValue = parseInt(e.target.value);
    document.getElementById('filterFinancierValue').value = e.target.value;
    updateSliderBackground('filterFinancierSlider', e.target.value);
    applyFilters();
  });
  
  // Filtre Financier - Input
  document.getElementById('filterFinancierValue').addEventListener('input', (e) => {
    let value = parseInt(e.target.value) || 0;
    value = Math.max(0, Math.min(100, value)); // Clamp entre 0 et 100
    FiltersState.financierValue = value;
    document.getElementById('filterFinancierSlider').value = value;
    updateSliderBackground('filterFinancierSlider', value);
    applyFilters();
  });
  
  // Filtres de Statut
  document.getElementById('filterStatusEnCours').addEventListener('change', (e) => {
    FiltersState.statusFilters['En cours'] = e.target.checked;
    applyFilters();
  });
  
  document.getElementById('filterStatusADemarrer').addEventListener('change', (e) => {
    FiltersState.statusFilters['À démarrer'] = e.target.checked;
    applyFilters();
  });
  
  document.getElementById('filterStatusEnRetard').addEventListener('change', (e) => {
    FiltersState.statusFilters['En retard'] = e.target.checked;
    applyFilters();
  });
  
  document.getElementById('filterStatusAcheve').addEventListener('change', (e) => {
    FiltersState.statusFilters['Achevé'] = e.target.checked;
    applyFilters();
  });
  
  // Initialiser les backgrounds des sliders
  updateSliderBackground('filterPhysiqueSlider', 15);
  updateSliderBackground('filterFinancierSlider', 15);
}

// Mettre à jour le gradient du slider
function updateSliderBackground(sliderId, value) {
  const slider = document.getElementById(sliderId);
  const percentage = value;
  const gradient = `linear-gradient(to right, 
    var(--color-primary) 0%, 
    var(--color-primary) ${percentage}%, 
    #e5e7eb ${percentage}%, 
    #e5e7eb 100%)`;
  slider.style.background = gradient;
}

// Appliquer les filtres
function applyFilters() {
  if (!AppState.actions || AppState.actions.length === 0) {
    return;
  }
  
  let filtered = AppState.actions;
  
  // Appliquer filtre physique si activé
  if (FiltersState.physiqueEnabled) {
    filtered = filtered.filter(action => {
      const taux = parseFloat(action.tauxphysique) || 0;
      return taux >= FiltersState.physiqueValue;
    });
  }
  
  // Appliquer filtre financier si activé
  if (FiltersState.financierEnabled) {
    filtered = filtered.filter(action => {
      const taux = parseFloat(action.tauxfinancier) || 0;
      return taux >= FiltersState.financierValue;
    });
  }
  
  // Appliquer filtre de statut
  const enabledStatuses = Object.keys(FiltersState.statusFilters).filter(
    status => FiltersState.statusFilters[status]
  );
  
  if (enabledStatuses.length > 0 && enabledStatuses.length < 4) {
    // Si au moins un statut est décoché, filtrer
    filtered = filtered.filter(action => {
      return enabledStatuses.includes(action.statut);
    });
  }
  
  FiltersState.filteredActions = filtered;
  renderFilteredActions(filtered);
}

// Afficher les actions filtrées
function renderFilteredActions(actions) {
  const container = document.getElementById('filterResultsList');
  const countEl = document.getElementById('filterResultsCount');
  
  countEl.textContent = `${actions.length} action${actions.length > 1 ? 's' : ''} correspond${actions.length > 1 ? 'ent' : ''} aux critères`;
  
  if (actions.length === 0) {
    container.innerHTML = '<div class="no-results" style="text-align: center; padding: 3rem; color: var(--color-text-muted);">Aucune action ne correspond aux critères sélectionnés</div>';
    return;
  }
  
  container.innerHTML = actions.map(action => {
    const statusClass = getStatusClass(action.statut);
    return `
    <div class="filter-action-card" data-action-id="${action.id}">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
        <div class="filter-action-title" style="flex: 1; margin-bottom: 0;">${escapeHtml(action.intitule)}</div>
        <span class="status-badge ${statusClass}" style="margin-left: 0.75rem; flex-shrink: 0;">${escapeHtml(action.statut)}</span>
      </div>
      <div class="filter-action-meta">
        <div class="filter-action-meta-row">
          📁 ${escapeHtml(action.programme)}
        </div>
        <div class="filter-action-meta-row">
          👤 ${escapeHtml(action.responsable)}  •  📅 ${action.echeance}
        </div>
      </div>
      <div class="filter-action-progress">
        <div class="filter-progress-item">
          <div class="filter-progress-label">Physique</div>
          <div class="filter-progress-value">${parseFloat(action.tauxphysique || 0).toFixed(1)}%</div>
        </div>
        <div class="filter-progress-item">
          <div class="filter-progress-label">Financier</div>
          <div class="filter-progress-value">${parseFloat(action.tauxfinancier || 0).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  `;
  }).join('');
  
  // Ajouter les event listeners pour les clics
  container.querySelectorAll('.filter-action-card').forEach(card => {
    card.addEventListener('click', () => {
      const actionId = card.getAttribute('data-action-id');
      showView('detail', actionId);
    });
  });
}

// Fonction utilitaire d'échappement HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fonction pour obtenir la classe CSS du statut
function getStatusClass(statut) {
  const statusMap = {
    'En cours': 'status-en-cours',
    'À démarrer': 'status-a-demarrer',
    'En retard': 'status-en-retard',
    'Achevé': 'status-acheve'
  };
  return statusMap[statut] || 'status-en-cours';
}

// Initialiser au chargement de la page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFilters);
} else {
  initFilters();
}

