/**
 * Module centralisé pour les appels API
 * Gère l'authentification JWT et les requêtes HTTP
 */

const API = {
  baseURL: '/api',

  /**
   * Récupère le token JWT du localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Récupère les informations utilisateur du localStorage
   */
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Déconnexion
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },

  /**
   * Requête HTTP générique
   */
  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log('[API] Requête:', options.method || 'GET', url);
      const response = await fetch(url, config);
      
      // Gestion de l'authentification expirée
      if (response.status === 401) {
        this.logout();
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur API');
      }

      return data;
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  },

  /**
   * Requête GET
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  /**
   * Requête POST
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Requête PUT
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Requête DELETE
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // ===== Endpoints spécifiques =====

  /**
   * Authentification
   */
  auth: {
    async login(username, password) {
      return API.post('/auth/login', { username, password });
    },
    
    async getMe() {
      return API.get('/auth/me');
    },

    async changePassword(currentPassword, newPassword) {
      return API.post('/auth/change-password', { currentPassword, newPassword });
    },
  },

  /**
   * Actions
   */
  actions: {
    async getAll(filters = {}) {
      const params = new URLSearchParams();
      if (filters.programme) params.append('programme', filters.programme);
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.responsable) params.append('responsable', filters.responsable);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      return API.get(`/actions${query}`);
    },

    async getById(id) {
      return API.get(`/actions/${id}`);
    },

    async create(actionData) {
      return API.post('/actions', actionData);
    },

    async update(id, actionData) {
      return API.put(`/actions/${id}`, actionData);
    },

    async delete(id) {
      return API.delete(`/actions/${id}`);
    },

    async getHistorique(id) {
      return API.get(`/actions/${id}/historique`);
    },

    /** Importe un fichier xlsx (remplace tout). file = File/Blob. */
    async importXlsx(file) {
      const token = API.getToken();
      const res = await fetch('/api/actions/import', {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }), 'Content-Type': 'application/octet-stream' },
        body: file,
      });
      if (res.status === 401) { API.logout(); return null; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'import');
      return data;
    },

    /** Exporte au format xlsx (renvoie un Blob). filters optionnels : {programme, statut, search}. */
    async exportXlsx(filters = {}) {
      const params = new URLSearchParams();
      if (filters.programme) params.append('programme', filters.programme);
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.search) params.append('search', filters.search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const token = API.getToken();
      const res = await fetch('/api/actions/export' + qs, { headers: { ...(token && { Authorization: `Bearer ${token}` }) } });
      if (res.status === 401) { API.logout(); return null; }
      if (!res.ok) throw new Error('Erreur lors de l\'export');
      return res.blob();
    },
  },

  /**
   * Versions (snapshots des actions)
   */
  versions: {
    async list() {
      return API.get('/actions/versions');
    },
    async restore(id) {
      return API.post(`/actions/versions/${id}/restore`, {});
    },
    async exportVersion(id) {
      const token = API.getToken();
      const res = await fetch(`/api/actions/versions/${id}/export`, { headers: { ...(token && { Authorization: `Bearer ${token}` }) } });
      if (res.status === 401) { API.logout(); return null; }
      if (!res.ok) throw new Error('Erreur lors de l\'export de la version');
      return res.blob();
    },
  },

  /**
   * Statistiques
   */
  statistics: {
    async get(programme = null) {
      const query = programme ? `?programme=${programme}` : '';
      return API.get(`/statistics${query}`);
    },

    async getProgrammes() {
      return API.get('/statistics/programmes');
    },
  },

  /**
   * Utilisateurs
   */
  users: {
    async getAll() {
      return API.get('/users');
    },

    async getById(id) {
      return API.get(`/users/${id}`);
    },

    async create(userData) {
      return API.post('/users', userData);
    },

    async update(id, userData) {
      return API.put(`/users/${id}`, userData);
    },

    async delete(id) {
      return API.delete(`/users/${id}`);
    },

    async resetPassword(id, password) {
      return API.put(`/users/${id}/password`, { password });
    },
  },
};

// Vérifier l'authentification au chargement
if (window.location.pathname !== '/login.html' && !API.getToken()) {
  window.location.href = '/login.html';
}

