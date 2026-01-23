/**
 * Gestion des utilisateurs et des assignations
 */

// État global
const UsersState = {
  users: [],
  programmes: [],
  actions: [],
  currentUser: null,
  selectedAssignments: {
    all: false,
    programmes: new Set(),
    actions: new Set()
  }
};

// ===== Initialisation =====

document.addEventListener('DOMContentLoaded', async () => {
  // Vérifier authentification
  const user = API.getUser();
  
  if (!user || user.role !== 'Admin') {
    await showAlert('Accès réservé aux administrateurs', 'Accès refusé', 'error');
    window.location.href = '/index.html';
    return;
  }

  document.getElementById('userName').textContent = user.fullName;

  // Initialiser les événements
  initEventListeners();

  // Charger les données
  await loadUsers();
  await loadProgrammesAndActions();
});

// ===== Événements =====

function initEventListeners() {
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

  // Recherche et filtres
  document.getElementById('searchUsers').addEventListener('input', filterUsers);
  document.getElementById('filterRole').addEventListener('change', filterUsers);

  // Bouton ajouter
  document.getElementById('addUserBtn').addEventListener('click', () => {
    openUserModal();
  });

  // Modal
  document.getElementById('closeModalBtn').addEventListener('click', closeUserModal);
  document.getElementById('cancelBtn').addEventListener('click', closeUserModal);
  document.getElementById('userForm').addEventListener('submit', handleUserSubmit);

  // Changement de rôle
  document.getElementById('role').addEventListener('change', (e) => {
    const assignmentsSection = document.getElementById('assignmentsSection');
    if (e.target.value === 'Directeur') {
      assignmentsSection.style.display = 'block';
    } else {
      assignmentsSection.style.display = 'none';
    }
  });

  // Checkbox "Tous"
  document.getElementById('assignAll').addEventListener('change', (e) => {
    if (e.target.checked) {
      // Désélectionner tout
      UsersState.selectedAssignments.all = true;
      UsersState.selectedAssignments.programmes.clear();
      UsersState.selectedAssignments.actions.clear();
      
      // Masquer la liste
      document.getElementById('assignmentsList').style.display = 'none';
    } else {
      UsersState.selectedAssignments.all = false;
      document.getElementById('assignmentsList').style.display = 'block';
    }
    
    updateSummary();
  });

  // Recherche d'assignations
  document.getElementById('searchAssignments').addEventListener('input', filterAssignments);
}

// ===== Chargement des données =====

async function loadUsers() {
  try {
    const users = await API.users.getAll();
    UsersState.users = users;
    renderUsers();
  } catch (error) {
    console.error('Erreur chargement utilisateurs:', error);
    showError('Erreur lors du chargement des utilisateurs');
  }
}

async function loadProgrammesAndActions() {
  try {
    const [programmes, actions] = await Promise.all([
      API.statistics.getProgrammes(),
      API.actions.getAll({})
    ]);
    
    UsersState.programmes = programmes;
    UsersState.actions = actions;
  } catch (error) {
    console.error('Erreur chargement données:', error);
  }
}

// ===== Affichage =====

function renderUsers() {
  const container = document.getElementById('usersList');
  const filtered = filterUsersData();
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="loading">Aucun utilisateur trouvé</div>';
    return;
  }

  container.innerHTML = filtered.map(user => `
    <div class="user-card" data-user-id="${user.id}">
      <div class="user-card-header">
        <div>
          <h3>👤 ${escapeHtml(user.fullname || user.fullName)}</h3>
          <div class="user-meta">
            <span class="badge badge-role badge-${user.role.toLowerCase()}">${user.role}</span>
            <span>•</span>
            <span>${user.username}</span>
            ${user.isactive === false || user.isActive === false ? '<span>• <span style="color: var(--color-danger);">Inactif</span></span>' : ''}
          </div>
          ${user.role === 'Directeur' && user.assignmentSummary ? `
            <div class="user-assignments" style="margin-top: 0.5rem; color: var(--color-text-light); font-size: 0.875rem;">
              ${getAssignmentSummaryText(user.assignmentSummary)}
            </div>
          ` : ''}
          <div class="user-date" style="margin-top: 0.5rem; color: var(--color-text-muted); font-size: 0.75rem;">
            Créé le ${formatDate(user.createdat || user.createdAt)}
          </div>
        </div>
      </div>
      <div class="user-actions">
        <button class="btn btn-small btn-primary" onclick="editUser(${user.id})">Modifier</button>
        <button class="btn btn-small btn-warning" onclick="resetPassword(${user.id}, '${escapeHtml(user.fullname || user.fullName)}')">🔑 Reset MDP</button>
        <button class="btn btn-small btn-secondary" onclick="deleteUser(${user.id})">Supprimer</button>
      </div>
    </div>
  `).join('');
}

function getAssignmentSummaryText(summary) {
  if (summary.type === 'all') {
    return 'Accès total (tous les programmes et actions)';
  }
  
  if (summary.type === 'none') {
    return 'Aucune assignation';
  }
  
  const parts = [];
  if (summary.programmes > 0) {
    parts.push(`${summary.programmes} programme${summary.programmes > 1 ? 's' : ''}`);
  }
  if (summary.actions > 0) {
    parts.push(`${summary.actions} action${summary.actions > 1 ? 's' : ''}`);
  }
  
  return parts.join(', ');
}

function filterUsersData() {
  const search = document.getElementById('searchUsers').value.toLowerCase();
  const roleFilter = document.getElementById('filterRole').value;
  
  return UsersState.users.filter(user => {
    const matchSearch = !search || 
      (user.fullname || user.fullName || '').toLowerCase().includes(search) ||
      user.username.toLowerCase().includes(search);
    
    const matchRole = !roleFilter || user.role === roleFilter;
    
    return matchSearch && matchRole;
  });
}

function filterUsers() {
  renderUsers();
}

// ===== Modal =====

function openUserModal(user = null) {
  UsersState.currentUser = user;
  
  const modal = document.getElementById('userModal');
  const modalTitle = document.getElementById('modalTitle');
  const passwordGroup = document.getElementById('passwordGroup');
  const assignmentsSection = document.getElementById('assignmentsSection');

  // Réinitialiser les assignations
  UsersState.selectedAssignments = {
    all: false,
    programmes: new Set(),
    actions: new Set()
  };

  if (user) {
    modalTitle.textContent = `Modifier l'utilisateur : ${user.fullname || user.fullName}`;
    
    // Remplir le formulaire
    document.getElementById('userId').value = user.id;
    document.getElementById('fullName').value = user.fullname || user.fullName;
    document.getElementById('username').value = user.username;
    document.getElementById('username').disabled = true; // Ne pas permettre de changer le username
    document.getElementById('role').value = user.role;
    document.getElementById('isActive').checked = user.isactive !== false && user.isActive !== false;
    
    // Masquer le mot de passe en édition
    passwordGroup.style.display = 'none';
    document.getElementById('password').required = false;
    
    // Charger les assignations si c'est un Directeur
    if (user.role === 'Directeur') {
      assignmentsSection.style.display = 'block';
      loadUserAssignments(user.id);
    } else {
      assignmentsSection.style.display = 'none';
    }
  } else {
    modalTitle.textContent = 'Nouvel utilisateur';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('username').disabled = false;
    passwordGroup.style.display = 'block';
    document.getElementById('password').required = true;
    assignmentsSection.style.display = 'none';
  }

  renderProgrammesAssignments();
  updateSummary();
  modal.classList.add('active');
}

function closeUserModal() {
  const modal = document.getElementById('userModal');
  modal.classList.remove('active');
  UsersState.currentUser = null;
}

async function loadUserAssignments(userId) {
  try {
    const assignments = await API.get(`/users/${userId}/assignments`);
    
    // Analyser les assignations
    assignments.forEach(a => {
      if (a.assignmenttype === 'all') {
        UsersState.selectedAssignments.all = true;
        document.getElementById('assignAll').checked = true;
        document.getElementById('assignmentsList').style.display = 'none';
      } else if (a.assignmenttype === 'programme') {
        UsersState.selectedAssignments.programmes.add(a.assignmentvalue);
      } else if (a.assignmenttype === 'action') {
        UsersState.selectedAssignments.actions.add(parseInt(a.assignmentvalue));
      }
    });
    
    renderProgrammesAssignments();
    updateSummary();
  } catch (error) {
    console.error('Erreur chargement assignations:', error);
  }
}

function renderProgrammesAssignments() {
  const container = document.getElementById('programmesAssignments');
  
  if (UsersState.programmes.length === 0) {
    container.innerHTML = '<div class="loading">Aucun programme trouvé</div>';
    return;
  }

  // Grouper les actions par programme
  const programmeActions = {};
  UsersState.actions.forEach(action => {
    if (!programmeActions[action.programme]) {
      programmeActions[action.programme] = [];
    }
    programmeActions[action.programme].push(action);
  });

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h5 style="color: var(--color-primary); margin-bottom: 0.75rem;">📁 Programmes</h5>
      ${UsersState.programmes.map(prog => {
        const actions = programmeActions[prog] || [];
        const progChecked = UsersState.selectedAssignments.programmes.has(prog);
        const allActionsChecked = actions.length > 0 && actions.every(a => UsersState.selectedAssignments.actions.has(a.id));
        
        return `
          <div class="programme-assignment" style="margin-bottom: 1rem; padding: 0.75rem; background: white; border-radius: var(--border-radius); border: 1px solid var(--border-color);">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" class="programme-checkbox" data-programme="${escapeHtml(prog)}" ${progChecked || allActionsChecked ? 'checked' : ''} style="margin-right: 0.5rem;">
              <strong>${escapeHtml(prog)}</strong>
              <span style="margin-left: 0.5rem; color: var(--color-text-light);">(${actions.length} actions)</span>
            </label>
            <div class="actions-list" style="margin-left: 1.5rem; margin-top: 0.5rem; display: ${progChecked ? 'none' : 'block'};">
              ${actions.slice(0, 5).map(action => `
                <label style="display: block; margin: 0.25rem 0; font-size: 0.875rem; cursor: pointer;">
                  <input type="checkbox" class="action-checkbox" data-action-id="${action.id}" data-programme="${escapeHtml(prog)}" ${UsersState.selectedAssignments.actions.has(action.id) || progChecked ? 'checked' : ''} ${progChecked ? 'disabled' : ''} style="margin-right: 0.5rem;">
                  ${escapeHtml(action.intitule || action.activite || 'Sans titre')}
                </label>
              `).join('')}
              ${actions.length > 5 ? `<small style="color: var(--color-text-muted);">... et ${actions.length - 5} autres</small>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Ajouter les event listeners
  container.querySelectorAll('.programme-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', handleProgrammeCheckbox);
  });

  container.querySelectorAll('.action-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', handleActionCheckbox);
  });
}

function handleProgrammeCheckbox(e) {
  const programmeName = e.target.getAttribute('data-programme');
  const checked = e.target.checked;
  
  if (checked) {
    UsersState.selectedAssignments.programmes.add(programmeName);
    
    // Masquer les actions
    const parent = e.target.closest('.programme-assignment');
    const actionsList = parent.querySelector('.actions-list');
    actionsList.style.display = 'none';
    
    // Cocher toutes les actions
    actionsList.querySelectorAll('.action-checkbox').forEach(cb => {
      cb.checked = true;
      cb.disabled = true;
    });
  } else {
    UsersState.selectedAssignments.programmes.delete(programmeName);
    
    // Afficher les actions
    const parent = e.target.closest('.programme-assignment');
    const actionsList = parent.querySelector('.actions-list');
    actionsList.style.display = 'block';
    
    // Décocher et activer les actions
    actionsList.querySelectorAll('.action-checkbox').forEach(cb => {
      cb.checked = false;
      cb.disabled = false;
    });
  }
  
  updateSummary();
}

function handleActionCheckbox(e) {
  const actionId = parseInt(e.target.getAttribute('data-action-id'));
  const checked = e.target.checked;
  
  if (checked) {
    UsersState.selectedAssignments.actions.add(actionId);
  } else {
    UsersState.selectedAssignments.actions.delete(actionId);
  }
  
  updateSummary();
}

function filterAssignments() {
  const search = document.getElementById('searchAssignments').value.toLowerCase();
  
  document.querySelectorAll('.programme-assignment').forEach(prog => {
    const programmeName = prog.querySelector('strong').textContent.toLowerCase();
    const visible = programmeName.includes(search);
    prog.style.display = visible ? 'block' : 'none';
  });
}

function updateSummary() {
  const summaryText = document.getElementById('summaryText');
  
  if (UsersState.selectedAssignments.all) {
    summaryText.innerHTML = '<span style="color: var(--color-primary); font-weight: 600;">✓ Accès total à tous les programmes et actions</span>';
    return;
  }
  
  const nbProgrammes = UsersState.selectedAssignments.programmes.size;
  const nbActions = UsersState.selectedAssignments.actions.size;
  
  if (nbProgrammes === 0 && nbActions === 0) {
    summaryText.innerHTML = '<span style="color: var(--color-text-muted);">Aucune assignation sélectionnée</span>';
    return;
  }
  
  const parts = [];
  if (nbProgrammes > 0) {
    parts.push(`<strong>${nbProgrammes}</strong> programme${nbProgrammes > 1 ? 's' : ''}`);
  }
  if (nbActions > 0) {
    parts.push(`<strong>${nbActions}</strong> action${nbActions > 1 ? 's' : ''} individuelle${nbActions > 1 ? 's' : ''}`);
  }
  
  summaryText.innerHTML = `• ${parts.join(' + ')}`;
}

// ===== Actions =====

async function handleUserSubmit(e) {
  e.preventDefault();

  const userData = {
    fullName: document.getElementById('fullName').value,
    role: document.getElementById('role').value,
    isActive: document.getElementById('isActive').checked
  };

  const userId = document.getElementById('userId').value;
  const isEdit = !!userId;

  // Ajouter username et password si création
  if (!isEdit) {
    userData.username = document.getElementById('username').value;
    userData.password = document.getElementById('password').value;
  }

  try {
    let savedUser;
    
    if (isEdit) {
      // Mise à jour
      savedUser = await API.users.update(userId, userData);
    } else {
      // Création
      savedUser = await API.users.create(userData);
    }

    // Sauvegarder les assignations si Directeur
    if (userData.role === 'Directeur') {
      const assignments = [];
      
      if (UsersState.selectedAssignments.all) {
        assignments.push({ assignmentType: 'all', assignmentValue: null });
      } else {
        // Ajouter les programmes
        UsersState.selectedAssignments.programmes.forEach(prog => {
          assignments.push({ assignmentType: 'programme', assignmentValue: prog });
        });
        
        // Ajouter les actions
        UsersState.selectedAssignments.actions.forEach(actionId => {
          assignments.push({ assignmentType: 'action', assignmentValue: actionId.toString() });
        });
      }
      
      await API.post(`/users/${savedUser.id || userId}/assignments`, { assignments });
    }

    showSuccess(isEdit ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès');
    closeUserModal();
    await loadUsers();
  } catch (error) {
    console.error('Erreur sauvegarde utilisateur:', error);
    showError(error.message || 'Erreur lors de la sauvegarde');
  }
}

window.editUser = async (id) => {
  try {
    const user = await API.users.getById(id);
    openUserModal(user);
  } catch (error) {
    console.error('Erreur chargement utilisateur:', error);
    showError('Erreur lors du chargement de l\'utilisateur');
  }
};

window.deleteUser = async (id) => {
  if (!await confirmDelete('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
    return;
  }

  try {
    await API.users.delete(id);
    showSuccess('Utilisateur supprimé avec succès');
    await loadUsers();
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    showError(error.message || 'Erreur lors de la suppression');
  }
};

window.resetPassword = async (id, fullName) => {
  const newPassword = prompt(`Nouveau mot de passe pour ${fullName}:\n(minimum 6 caractères)`);
  
  if (!newPassword) {
    return; // Annulé
  }
  
  if (newPassword.length < 6) {
    showError('Le mot de passe doit contenir au moins 6 caractères');
    return;
  }
  
  try {
    await API.users.resetPassword(id, newPassword);
    await showAlert(`Mot de passe réinitialisé avec succès pour ${fullName}\n\nNouveau mot de passe : ${newPassword}`, 'Succès', 'success');
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    showError(error.message || 'Erreur lors de la réinitialisation du mot de passe');
  }
};

// ===== Utilitaires =====

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

