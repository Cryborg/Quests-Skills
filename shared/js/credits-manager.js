/**
 * Gestionnaire centralisé des crédits et cartes
 * Émet des événements pour mettre à jour l'UI automatiquement
 */
const CreditsManager = {
    currentCredits: 0,

    /**
     * Initialiser le gestionnaire (charger les crédits actuels)
     */
    async init() {
        const user = authService.getCurrentUser();
        if (!user) return;

        try {
            const response = await authService.fetchAPI(`/users/${user.id}/credits`);
            const data = await response.json();
            this.currentCredits = data.credits || 0;
            this.emitCreditsUpdate();
        } catch (error) {
            console.error('Failed to load credits:', error);
        }
    },

    /**
     * Ajouter des crédits
     */
    async addCredits(amount, reason = 'Récompense') {
        const user = authService.getCurrentUser();
        if (!user) return false;

        try {
            const response = await authService.fetchAPI(`/users/${user.id}/credits`, {
                method: 'POST',
                body: JSON.stringify({ amount })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentCredits = data.credits;
                this.emitCreditsUpdate();
                console.log(`✅ +${amount} crédits ajoutés (${reason})`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Failed to add credits:', error);
            return false;
        }
    },

    /**
     * Retirer des crédits
     */
    async removeCredits(amount, reason = 'Achat') {
        const user = authService.getCurrentUser();
        if (!user) return false;

        try {
            const response = await authService.fetchAPI(`/users/${user.id}/credits`, {
                method: 'POST',
                body: JSON.stringify({ amount: -amount })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentCredits = data.credits;
                this.emitCreditsUpdate();
                console.log(`✅ -${amount} crédits retirés (${reason})`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Failed to remove credits:', error);
            return false;
        }
    },

    /**
     * Tirer des cartes (utilise des crédits)
     * Note: La route /cards/draw gère automatiquement le retrait des crédits
     */
    async drawCards(count = 1) {
        const user = authService.getCurrentUser();
        if (!user) return { success: false, cards: [] };

        if (this.currentCredits < count) {
            Toast.error(`Pas assez de crédits ! (${this.currentCredits}/${count})`);
            return { success: false, cards: [] };
        }

        try {
            // Appel API qui retire les crédits ET pioche les cartes (tout en un seul appel)
            const response = await authService.fetchAPI(`/cards/draw/${user.id}`, {
                method: 'POST',
                body: JSON.stringify({ count })
            });

            if (response.ok) {
                const data = await response.json();

                // Mettre à jour les crédits locaux (la route a déjà retiré les crédits côté serveur)
                this.currentCredits -= count;
                this.emitCreditsUpdate();

                this.emitCardsDrawn(data.cards);
                console.log(`✅ ${data.cards.length} carte(s) tirée(s) (${count} crédits utilisés)`);
                return { success: true, cards: data.cards };
            }

            return { success: false, cards: [] };
        } catch (error) {
            console.error('Failed to draw cards:', error);
            return { success: false, cards: [] };
        }
    },

    /**
     * Obtenir les crédits actuels
     */
    getCredits() {
        return this.currentCredits;
    },

    /**
     * Émettre un événement de mise à jour des crédits
     */
    emitCreditsUpdate() {
        window.dispatchEvent(new CustomEvent('credits-updated', {
            detail: { credits: this.currentCredits }
        }));
    },

    /**
     * Émettre un événement de cartes tirées
     */
    emitCardsDrawn(cards) {
        window.dispatchEvent(new CustomEvent('cards-drawn', {
            detail: { cards }
        }));
    }
};

// Écouter les mises à jour de crédits pour mettre à jour la sidebar
window.addEventListener('credits-updated', (event) => {
    const creditsElement = document.getElementById('user-credits');
    if (creditsElement) {
        creditsElement.textContent = event.detail.credits;
    }
});
