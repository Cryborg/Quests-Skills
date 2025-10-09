// Service d'authentification partagé pour toute l'application
class AuthService {
    constructor() {
        this.TOKEN_KEY = 'auth_token';
        this.USER_KEY = 'current_user';
        this.currentUser = null;
        this.token = null;
        this.onAuthChangeCallbacks = [];
    }

    // Initialiser le service (à appeler au démarrage)
    async init() {
        this.token = localStorage.getItem(this.TOKEN_KEY);
        const storedUser = localStorage.getItem(this.USER_KEY);
        
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
        }

        // Vérifier si le token est toujours valide
        if (this.token && this.currentUser) {
            try {
                const user = await this.fetchCurrentUser();
                this.currentUser = user;
                this.notifyAuthChange();

                // Réclamer les cartes quotidiennes automatiques
                await this.claimDailyCards();

                // Initialiser le gestionnaire de crédits
                if (typeof CreditsManager !== 'undefined') {
                    await CreditsManager.init();
                }

                return true;
            } catch (error) {
                console.error('Token expired or invalid, logging out');
                this.logout();
                return false;
            }
        }

        return false;
    }

    // S'abonner aux changements d'authentification
    onAuthChange(callback) {
        this.onAuthChangeCallbacks.push(callback);
    }

    // Notifier les changements
    notifyAuthChange() {
        this.onAuthChangeCallbacks.forEach(callback => callback(this.currentUser));
    }

    // Récupérer l'utilisateur courant depuis l'API
    async fetchCurrentUser() {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }

        return await response.json();
    }

    // Connexion
    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        this.token = data.token;
        this.currentUser = data.user;

        // Sauvegarder dans localStorage
        localStorage.setItem(this.TOKEN_KEY, this.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(this.currentUser));

        this.notifyAuthChange();
        return this.currentUser;
    }

    // Inscription
    async register(username, email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }

        const data = await response.json();
        this.token = data.token;
        this.currentUser = data.user;

        // Sauvegarder dans localStorage
        localStorage.setItem(this.TOKEN_KEY, this.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(this.currentUser));

        this.notifyAuthChange();
        return this.currentUser;
    }

    // Déconnexion
    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.notifyAuthChange();
        
        // Rediriger vers la page d'accueil
        window.location.href = '/';
    }

    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    // Récupérer l'utilisateur courant
    getCurrentUser() {
        return this.currentUser;
    }

    // Récupérer le token pour les requêtes API
    getToken() {
        return this.token;
    }

    // Vérifier si l'utilisateur est admin
    isAdmin() {
        return this.currentUser && this.currentUser.is_admin;
    }

    // Réclame les cartes quotidiennes automatiques
    async claimDailyCards() {
        if (!this.currentUser) return;

        try {
            const response = await this.fetchAPI(`/users/${this.currentUser.id}/daily-cards`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();

                // Affiche un toast si des cartes ont été données
                if (result.success && result.cardsGiven > 0 && typeof Toast !== 'undefined') {
                    Toast.success(result.message);
                }

                console.log('🎁 Cartes quotidiennes:', result);
            }
        } catch (error) {
            console.error('Erreur lors de la réclamation des cartes quotidiennes:', error);
        }
    }

    // Faire une requête API authentifiée
    async fetchAPI(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401 || response.status === 403) {
            // Token expiré ou invalide
            this.logout();
            throw new Error('Authentication required');
        }

        return response;
    }
}

// Instance globale du service d'authentification
const authService = new AuthService();
