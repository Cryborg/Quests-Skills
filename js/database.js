// Nouveau DatabaseManager qui utilise l'API au lieu de localStorage
class DatabaseManager {
    constructor() {
        this.apiUrl = '/api';
        this.userId = 1; // User demo pour l'instant
        this.cards = [];
        this.collection = {};
        this.isInitialized = false;
    }

    // Initialise les données depuis l'API
    async initializeData() {
        if (this.isInitialized) return;

        try {
            // Charger toutes les cartes
            const response = await fetch(`${this.apiUrl}/cards`);
            this.cards = await response.json();

            // Charger la collection de l'user
            await this.refreshCollection();

            this.isInitialized = true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
        }
    }

    async refreshCollection() {
        try {
            const response = await fetch(`${this.apiUrl}/users/${this.userId}/cards`);
            const userCards = await response.json();

            // Convertir en format collection (objet avec card_id comme clé)
            this.collection = {};
            userCards.forEach(uc => {
                this.collection[uc.card_id] = {
                    quantity: uc.quantity,
                    cardId: uc.card_id,
                    currentRarity: uc.current_rarity,
                    card: uc.card
                };
            });
        } catch (error) {
            console.error('Erreur lors du rafraîchissement de la collection:', error);
        }
    }

    // Récupère toutes les cartes
    getAllCards() {
        return [...this.cards]; // Retourne une copie pour éviter les modifications accidentelles
    }

    // Récupère une carte par son ID
    getCardById(id) {
        return this.cards.find(c => c.id === parseInt(id));
    }

    // Récupère les cartes par thème
    getCardsByTheme(theme) {
        // Mapping des anciens noms de thèmes vers les nouveaux
        const themeMap = {
            'minecraft': 'minecraft',
            'space': 'espace',
            'dinosaurs': 'dinosaure'
        };
        const newTheme = themeMap[theme] || theme;
        return this.cards.filter(c => c.category === newTheme);
    }

    // Récupère la collection
    getCollection() {
        return this.collection;
    }

    // Sauvegarde la collection (non utilisé avec l'API)
    saveCollection(collection) {
        this.collection = collection;
    }

    // Ajoute une carte à la collection
    async addToCollection(cardId) {
        try {
            const response = await fetch(`${this.apiUrl}/users/${this.userId}/cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ card_id: parseInt(cardId) })
            });

            await this.refreshCollection();
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de l\'ajout à la collection:', error);
        }
    }

    // Retire une carte de la collection (non implémenté dans l'API pour l'instant)
    removeFromCollection(cardId) {
        if (this.collection[cardId]) {
            delete this.collection[cardId];
        }
    }

    // Récupère les stats de la collection
    getCollectionStats() {
        const ownedCards = Object.keys(this.collection).length;
        const totalCards = this.cards.length;
        const completionPercentage = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0;

        return {
            ownedCards,
            totalCards,
            completionPercentage
        };
    }

    // Gestion des crédits
    async getCredits() {
        try {
            const response = await fetch(`${this.apiUrl}/users/${this.userId}/credits`);
            const data = await response.json();
            return data.credits || 0;
        } catch (error) {
            console.error('Erreur lors de la récupération des crédits:', error);
            return 0;
        }
    }

    async addCredits(amount) {
        try {
            const response = await fetch(`${this.apiUrl}/users/${this.userId}/credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseInt(amount) })
            });
            const data = await response.json();
            return data.credits || 0;
        } catch (error) {
            console.error('Erreur lors de l\'ajout des crédits:', error);
            return 0;
        }
    }

    async useCredits(amount) {
        try {
            const response = await fetch(`${this.apiUrl}/users/${this.userId}/credits/use`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseInt(amount) })
            });
            const data = await response.json();
            return data.credits || 0;
        } catch (error) {
            console.error('Erreur lors de l\'utilisation des crédits:', error);
            return 0;
        }
    }

    // Vérifie si l'user possède une carte
    hasCard(cardId) {
        return !!this.collection[cardId];
    }

    // Récupère la quantité d'une carte
    getCardQuantity(cardId) {
        return this.collection[cardId]?.quantity || 0;
    }

    // Récupère la rareté actuelle d'une carte
    getCardCurrentRarity(cardId) {
        return this.collection[cardId]?.currentRarity || 'common';
    }

    // Upgrade une carte
    async upgradeCard(cardId, toRarity, cost) {
        try {
            const response = await fetch(`${this.apiUrl}/users/${this.userId}/cards/${cardId}/upgrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to_rarity: toRarity, cost: cost })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upgrade failed');
            }

            await this.refreshCollection();
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de l\'upgrade de la carte:', error);
            throw error;
        }
    }

    // Vérifie si l'user a des crédits
    async hasCredits() {
        const credits = await this.getCredits();
        return credits > 0;
    }

    // Utilise un crédit (alias pour useCredits(1))
    async useCredit() {
        try {
            await this.useCredits(1);
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }

    // Système de crédit gratuit quotidien
    canClaimDailyCredit() {
        const STORAGE_KEY = 'daily_credit_timestamp';
        const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 heures

        const lastClaim = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
        const now = Date.now();

        return now - lastClaim >= COOLDOWN_MS;
    }

    async claimDailyCredit() {
        if (!this.canClaimDailyCredit()) {
            return { success: false, message: 'Crédit déjà réclamé aujourd\'hui' };
        }

        const STORAGE_KEY = 'daily_credit_timestamp';
        localStorage.setItem(STORAGE_KEY, Date.now().toString());

        await this.addCredits(1);

        return { success: true };
    }

    getTimeUntilNextDailyCredit() {
        const STORAGE_KEY = 'daily_credit_timestamp';
        const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 heures

        const lastClaim = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
        const now = Date.now();
        const timeSinceLast = now - lastClaim;

        if (timeSinceLast >= COOLDOWN_MS) {
            return 0;
        }

        return COOLDOWN_MS - timeSinceLast;
    }

    // Reset de la base de données (pour debug)
    resetDatabase() {
        console.warn('⚠️ Reset de la base de données non implémenté avec l\'API');
        // TODO: implémenter si nécessaire
    }
}

// Instance globale
const DB = new DatabaseManager();
