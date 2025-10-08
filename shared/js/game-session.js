// Helper pour gérer les sessions de jeu et les gains de cartes
class GameSessionManager {
    constructor(gameType) {
        this.gameType = gameType;
        this.errors = 0;
        this.canEarnCards = true;
        this.remaining = 0;
        this.limit = 3;
    }

    async init() {
        const user = authService.getCurrentUser();
        if (!user) return;

        try {
            const response = await authService.fetchAPI(`/games/${user.id}/sessions/${this.gameType}`);
            const data = await response.json();

            this.canEarnCards = data.canEarn;
            this.remaining = data.remaining;
            this.limit = data.limit;
        } catch (error) {
            console.error('Failed to load game session info:', error);
        }
    }

    // Incrémenter le compteur d'erreurs
    addError() {
        this.errors++;
    }

    // Réinitialiser les erreurs (nouvelle partie)
    resetErrors() {
        this.errors = 0;
    }

    // Calculer les cartes qui seront gagnées (avant de sauvegarder)
    calculateReward() {
        if (!this.canEarnCards || this.remaining <= 0) {
            return 0;
        }

        // Toutes les 2 erreurs, on perd 1 carte
        const errorPenalty = Math.floor(this.errors / 2);
        const cardsEarned = Math.max(0, Math.min(1 - errorPenalty, this.remaining));

        return cardsEarned;
    }

    // Sauvegarder la session et obtenir la récompense
    async saveSession(success) {
        const user = authService.getCurrentUser();
        if (!user) return { cardsEarned: 0 };

        try {
            const response = await authService.fetchAPI(`/games/${user.id}/sessions`, {
                method: 'POST',
                body: JSON.stringify({
                    gameType: this.gameType,
                    errors: this.errors,
                    success: success
                })
            });

            const data = await response.json();

            // Mettre à jour l'état
            this.remaining = data.remaining;
            this.canEarnCards = data.remaining > 0;

            return data;
        } catch (error) {
            console.error('Failed to save game session:', error);
            return { cardsEarned: 0 };
        }
    }

    // Obtenir un message de feedback
    getFeedbackMessage(cardsEarned) {
        if (cardsEarned === 0 && this.remaining === 0) {
            return `Limite quotidienne atteinte (${this.limit}/${this.limit} cartes)`;
        }

        if (cardsEarned === 0 && this.errors >= 2) {
            const errorPenalty = Math.floor(this.errors / 2);
            return `Trop d'erreurs (${this.errors}) - Récompense : 0 carte (pénalité: -${errorPenalty})`;
        }

        if (cardsEarned === 0) {
            return 'Récompense : 0 carte';
        }

        const errorText = this.errors > 0 ? ` (${this.errors} erreur${this.errors > 1 ? 's' : ''})` : '';
        return `+${cardsEarned} 🪙${errorText} - ${this.remaining}/${this.limit} restantes aujourd'hui`;
    }
}
