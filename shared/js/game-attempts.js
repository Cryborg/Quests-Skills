// Système centralisé de gestion des essais journaliers

const GameAttempts = {
    /**
     * Récupère les essais d'aujourd'hui pour un module
     * @param {string} moduleType - Type de module (ex: 'word-search', 'sudoku', etc.)
     * @returns {Promise<number>} Nombre d'essais effectués aujourd'hui
     */
    async getTodayCount(moduleType) {
        const user = authService.getCurrentUser();
        if (!user) return 0;

        try {
            const response = await authService.fetchAPI(`/games/${user.id}/sessions/${moduleType}`);
            const data = await response.json();

            // L'API retourne directement les sessions d'aujourd'hui
            return data.sessions ? data.sessions.length : 0;
        } catch (error) {
            console.error('Failed to load game attempts:', error);
            return 0;
        }
    },

    /**
     * Récupère le nombre d'essais restants pour aujourd'hui
     * @param {string} moduleType - Type de module
     * @param {number} maxAttempts - Nombre max d'essais par jour (défaut: 3)
     * @returns {Promise<number>} Nombre d'essais restants
     */
    async getRemainingCount(moduleType, maxAttempts = 3) {
        const todayCount = await this.getTodayCount(moduleType);
        return Math.max(0, maxAttempts - todayCount);
    },

    /**
     * Vérifie si l'utilisateur peut encore jouer aujourd'hui
     * @param {string} moduleType - Type de module
     * @param {number} maxAttempts - Nombre max d'essais par jour (défaut: 3)
     * @returns {Promise<boolean>}
     */
    async canPlay(moduleType, maxAttempts = 3) {
        const remaining = await this.getRemainingCount(moduleType, maxAttempts);
        return remaining > 0;
    },

    /**
     * Enregistre une nouvelle tentative
     * @param {string} moduleType - Type de module
     * @param {Object} data - Données de la session (score, completed, etc.)
     * @returns {Promise<Object>} Session créée
     */
    async recordAttempt(moduleType, data = {}) {
        const user = authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        try {
            const response = await authService.fetchAPI(`/games/${user.id}/sessions`, {
                method: 'POST',
                body: JSON.stringify({
                    gameType: moduleType,
                    errors: data.errors || 0,
                    success: data.success || data.completed || false
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Failed to record attempt:', error);
            throw error;
        }
    },

    /**
     * Met à jour le compteur d'essais restants dans le header
     * @param {number} remaining - Nombre d'essais restants
     */
    updateHeaderDisplay(remaining) {
        const statElement = document.getElementById('attempts-remaining');
        if (statElement) {
            statElement.textContent = remaining;

            // Changer la couleur selon le nombre restant
            const statContainer = statElement.closest('.page-header-stat');
            if (statContainer) {
                statContainer.classList.remove('warning', 'danger');
                if (remaining === 1) {
                    statContainer.classList.add('warning');
                } else if (remaining === 0) {
                    statContainer.classList.add('danger');
                }
            }
        }
    },

    /**
     * Initialise l'affichage des essais dans le header d'un module
     * @param {string} moduleType - Type de module
     * @param {number} maxAttempts - Nombre max d'essais (défaut: 3)
     * @returns {Promise<number>} Nombre d'essais restants
     */
    async initHeaderDisplay(moduleType, maxAttempts = 3) {
        const remaining = await this.getRemainingCount(moduleType, maxAttempts);
        this.updateHeaderDisplay(remaining);
        return remaining;
    }
};

// Export global
window.GameAttempts = GameAttempts;
