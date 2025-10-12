// Gestionnaire de base de données (API uniquement, sans cache)
class DatabaseManager {
    constructor() {
        this.collectionCache = null; // Pas de cache de collection
        this.cardsCache = null; // Cache des cartes depuis l'API
        this.cardsTimestamp = 0; // Timestamp du cache des cartes
        this.userThemes = []; // Thèmes sélectionnés par l'utilisateur
    }

    // Initialisation async des cartes depuis l'API
    async init() {
        console.log('🎴 Chargement des cartes depuis l\'API...');
        await this.loadCardsFromAPI();
        await this.loadUserThemes();
    }

    // Charge les thèmes sélectionnés par l'utilisateur
    async loadUserThemes() {
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                console.warn('No user logged in, skipping theme loading');
                return;
            }

            const response = await authService.fetchAPI(`/users/${currentUser.id}/themes`);
            if (!response.ok) {
                console.error('Failed to load user themes');
                return;
            }

            const themes = await response.json();
            this.userThemes = themes.map(t => t.slug);
            console.log(`✅ ${this.userThemes.length} thèmes sélectionnés:`, this.userThemes);
        } catch (error) {
            console.error('Error loading user themes:', error);
        }
    }

    // Récupère tous les thèmes sélectionnés
    getUserThemes() {
        return this.userThemes;
    }

    // Charge les cartes depuis l'API
    async loadCardsFromAPI() {
        try {
            // Utilise le cache si valide (cache de 5 minutes pour les cartes)
            const now = Date.now();
            if (this.cardsCache && (now - this.cardsTimestamp) < 300000) {
                return this.cardsCache;
            }

            const response = await fetch('/api/cards');
            if (!response.ok) {
                console.error('Failed to load cards from API');
                return [];
            }

            const cards = await response.json();

            // Transform les cartes pour avoir le format attendu
            // Note: On utilise maintenant les IDs INTEGER de la base directement
            this.cardsCache = cards.map(card => ({
                id: card.id, // ID INTEGER de la base (1, 2, 3...)
                name: card.name,
                theme: card.category, // category dans la base, theme dans le front
                baseRarity: card.base_rarity,
                image: card.image,
                description: card.description
            }));

            this.cardsTimestamp = now;
            console.log(`✅ ${this.cardsCache.length} cartes chargées depuis l'API`);
            return this.cardsCache;
        } catch (error) {
            console.error('Error loading cards from API:', error);
            return [];
        }
    }

    // ANCIENNE VERSION - Sera supprimée après migration
    // Crée les cartes par défaut pour les 3 thèmes (DEPRECATED)
    initializeDefaultCards_DEPRECATED() {
        const defaultCards = [
            // MINECRAFT
            {
                id: 'mc_01',
                name: 'Creeper',
                theme: 'minecraft',
                baseRarity: 'common',
                emoji: '💚',
                image: '../../shared/images/creeper.webp',
                description: 'Une créature explosive qui détruit tout sur son passage.'
            },
            {
                id: 'mc_02',
                name: 'Enderman',
                theme: 'minecraft',
                baseRarity: 'rare',
                emoji: '👤',
                image: '../../shared/images/enderman.webp',
                description: 'Être mystérieux capable de téléportation.'
            },
            {
                id: 'mc_03',
                name: 'Diamant',
                theme: 'minecraft',
                baseRarity: 'very_rare',
                emoji: '💎',
                image: '../../shared/images/diamant.webp',
                description: 'Le minerai le plus précieux du monde de Minecraft.'
            },
            {
                id: 'mc_04',
                name: 'Ender Dragon',
                theme: 'minecraft',
                baseRarity: 'epic',
                emoji: '🐉',
                image: '../../shared/images/ender_dragon.webp',
                description: 'Le boss final qui règne sur l\'End.'
            },
            {
                id: 'mc_05',
                name: 'Steve',
                theme: 'minecraft',
                baseRarity: 'legendary',
                emoji: '🧑‍🔧',
                image: '../../shared/images/steve.webp',
                description: 'Le héros légendaire de Minecraft.'
            },
            {
                id: 'mc_06',
                name: 'Zombie',
                theme: 'minecraft',
                baseRarity: 'common',
                emoji: '🧟',
                image: '../../shared/images/zombie.webp',
                description: 'Mort-vivant qui erre dans la nuit.'
            },
            {
                id: 'mc_07',
                name: 'Wither',
                theme: 'minecraft',
                baseRarity: 'epic',
                emoji: '💀',
                image: '../../shared/images/wither.webp',
                description: 'Boss destructeur aux trois têtes.'
            },
            {
                id: 'mc_08',
                name: 'Émeraude',
                theme: 'minecraft',
                baseRarity: 'rare',
                emoji: '💚',
                image: '../../shared/images/emeraude.webp',
                description: 'Gemme précieuse pour le commerce.'
            },

            // ASTRONOMIE
            {
                id: 'space_01',
                name: 'Soleil',
                theme: 'space',
                baseRarity: 'legendary',
                emoji: '☀️',
                image: '../../shared/images/soleil.jpg',
                description: 'Notre étoile, source de toute vie sur Terre.'
            },
            {
                id: 'space_02',
                name: 'Lune',
                theme: 'space',
                baseRarity: 'common',
                emoji: '🌙',
                image: '../../shared/images/lune.jpg',
                description: 'Satellite naturel de la Terre.'
            },
            {
                id: 'space_03',
                name: 'Mars',
                theme: 'space',
                baseRarity: 'rare',
                emoji: '🔴',
                image: '../../shared/images/mars.jpg',
                description: 'La planète rouge, future destination humaine.'
            },
            {
                id: 'space_04',
                name: 'Saturne',
                theme: 'space',
                baseRarity: 'very_rare',
                emoji: '🪐',
                image: '../../shared/images/saturne.jpg',
                description: 'Planète aux magnifiques anneaux.'
            },
            {
                id: 'space_05',
                name: 'Trou Noir',
                theme: 'space',
                baseRarity: 'epic',
                emoji: '⚫',
                image: '../../shared/images/trou_noir.webp',
                description: 'Objet cosmique d\'une densité infinie.'
            },
            {
                id: 'space_06',
                name: 'Galaxie',
                theme: 'space',
                baseRarity: 'epic',
                emoji: '🌌',
                image: '../../shared/images/galaxie.jpg',
                description: 'Amas de milliards d\'étoiles.'
            },
            {
                id: 'space_07',
                name: 'Comète',
                theme: 'space',
                baseRarity: 'rare',
                emoji: '☄️',
                image: '../../shared/images/comete.jpg',
                description: 'Voyageuse glacée des confins du système solaire.'
            },
            {
                id: 'space_08',
                name: 'Nébuleuse',
                theme: 'space',
                baseRarity: 'very_rare',
                emoji: '🌠',
                image: '../../shared/images/nebuleuse.webp',
                description: 'Nuage cosmique où naissent les étoiles.'
            },

            // DINOSAURES
            {
                id: 'dino_01',
                name: 'T-Rex',
                theme: 'dinosaurs',
                baseRarity: 'legendary',
                emoji: '🦖',
                image: '../../shared/images/t_rex.png',
                description: 'Le roi des prédateurs du Crétacé.'
            },
            {
                id: 'dino_02',
                name: 'Tricératops',
                theme: 'dinosaurs',
                baseRarity: 'rare',
                emoji: '🦕',
                image: '../../shared/images/triceratops.webp',
                description: 'Herbivore aux trois cornes impressionnantes.'
            },
            {
                id: 'dino_03',
                name: 'Vélociraptor',
                theme: 'dinosaurs',
                baseRarity: 'very_rare',
                emoji: '🦅',
                image: '../../shared/images/velociraptor.webp',
                description: 'Chasseur intelligent et redoutable.'
            },
            {
                id: 'dino_04',
                name: 'Diplodocus',
                theme: 'dinosaurs',
                baseRarity: 'common',
                emoji: '🦴',
                image: '../../shared/images/diplodocus.jpg',
                description: 'Géant au long cou et à la longue queue.'
            },
            {
                id: 'dino_05',
                name: 'Ptérodactyle',
                theme: 'dinosaurs',
                baseRarity: 'rare',
                emoji: '🦋',
                image: '../../shared/images/pterodactyle.jpg',
                description: 'Reptile volant des temps préhistoriques.'
            },
            {
                id: 'dino_06',
                name: 'Spinosaure',
                theme: 'dinosaurs',
                baseRarity: 'epic',
                emoji: '🐊',
                image: '../../shared/images/spinosaure.webp',
                description: 'Prédateur aquatique à la voile dorsale.'
            },
            {
                id: 'dino_07',
                name: 'Ankylosaure',
                theme: 'dinosaurs',
                baseRarity: 'common',
                emoji: '🛡️',
                image: '../../shared/images/ankylosaure.jpg',
                description: 'Herbivore blindé comme un tank.'
            },
            {
                id: 'dino_08',
                name: 'Archéoptéryx',
                theme: 'dinosaurs',
                baseRarity: 'epic',
                emoji: '🪶',
                image: '../../shared/images/archeopteryx.jpg',
                description: 'Lien évolutif entre dinosaures et oiseaux.'
            }
        ];

        this.saveCards(defaultCards);
    }

    // Récupère toutes les cartes disponibles (depuis le cache API)
    getAllCards() {
        if (!this.cardsCache) {
            console.warn('⚠️ Cards not loaded yet! Call await DB.init() first');
            return [];
        }
        return this.cardsCache;
    }

    // Récupère les cartes par thème
    getCardsByTheme(theme) {
        const allCards = this.getAllCards();
        return allCards.filter(card => card.theme === theme);
    }

    // Récupère une carte par son ID (ID INTEGER maintenant)
    getCardById(cardId) {
        const allCards = this.getAllCards();
        return allCards.find(card => card.id === cardId);
    }

    // Récupère la collection du joueur depuis l'API (TOUJOURS frais)
    async getCollection() {
        try {
            const user = authService.getCurrentUser();
            if (!user) return {};

            // TOUJOURS fetch depuis l'API (pas de cache pour éviter les données périmées)
            const response = await authService.fetchAPI(`/users/${user.id}/cards`);
            if (!response.ok) {
                console.error('Failed to fetch collection');
                return {};
            }

            const cards = await response.json();

            // Transforme le tableau en objet indexé par card_id
            const collection = {};
            for (const userCard of cards) {
                // userCard contient : { id, user_id, card_id, quantity, current_rarity, ... }
                collection[userCard.card_id] = {
                    count: userCard.quantity,
                    currentRarity: userCard.current_rarity || 'common',
                    level: 1, // Pas dans la DB pour l'instant
                    firstObtained: new Date(userCard.created_at).getTime()
                };
            }

            // Met à jour le cache pour getCollectionSync()
            this.collectionCache = collection;

            return collection;
        } catch (error) {
            console.error('Failed to get collection:', error);
            return {};
        }
    }

    // Version synchrone qui utilise uniquement le cache (pour compatibilité)
    getCollectionSync() {
        return this.collectionCache || {};
    }

    // Ajoute plusieurs cartes à la collection en batch
    async addCardsToCollection(cards) {
        try {
            const user = authService.getCurrentUser();
            if (!user) {
                console.error('No user logged in');
                return { success: false, error: 'Non connecté' };
            }

            console.log('📤 Adding cards to collection:', cards);

            // Appel API batch pour ajouter toutes les cartes
            const response = await authService.fetchAPI(`/users/${user.id}/cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cards })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Failed to add cards to collection:', response.status, errorData);
                return { success: false, error: errorData.error || errorData.details || `Erreur HTTP ${response.status}` };
            }

            const result = await response.json();
            console.log('✅ Cards added successfully:', result.added);

            // NE PAS recharger la collection ici pour optimiser les performances
            // La collection sera rechargée uniquement quand nécessaire (ex: après animation)

            return { success: true, collection: result.collection };
        } catch (error) {
            console.error('❌ Exception when adding cards to collection:', error);
            return { success: false, error: error.message || 'Erreur réseau' };
        }
    }

    // Ajoute une carte à la collection via l'API (utilise le batch en interne)
    async addToCollection(cardId, level = 1) {
        const result = await this.addCardsToCollection([{ card_id: cardId, count: 1 }]);
        if (!result.success) {
            return { count: 0 };
        }

        // Trouve la carte ajoutée dans le résultat
        const addedCard = result.collection.find(c => c.card_id === cardId);
        return {
            count: addedCard ? addedCard.quantity : 1,
            currentRarity: addedCard ? addedCard.current_rarity : 'common',
            level: level,
            firstObtained: Date.now()
        };
    }

    // Met à jour le niveau d'une carte
    upgradeCard(cardId, newLevel) {
        const collection = this.getCollectionSync();

        if (collection[cardId]) {
            collection[cardId].level = newLevel;
            this.saveCollection(collection);
            return true;
        }

        return false;
    }

    // Améliore la rareté d'une carte via l'API
    async upgradeCardRarity(cardId) {
        try {
            const user = authService.getCurrentUser();
            if (!user) return { success: false, message: 'Utilisateur non connecté' };

            // Recharge toujours la collection depuis l'API pour avoir les données à jour
            await this.getCollection();

            const collection = this.getCollectionSync();
            const card = this.getCardById(cardId);

            if (!collection[cardId] || !card) {
                return { success: false, message: 'Carte introuvable' };
            }

            const currentRarity = collection[cardId].currentRarity || 'common';
            const rarityOrder = ['common', 'rare', 'very_rare', 'epic', 'legendary'];
            const currentIndex = rarityOrder.indexOf(currentRarity);

            // Toutes les cartes peuvent maintenant atteindre Légendaire
            const legendaryIndex = rarityOrder.indexOf('legendary');
            if (currentIndex >= legendaryIndex) {
                return {
                    success: false,
                    message: 'Cette carte a atteint sa rareté maximale (Légendaire)',
                    maxRarity: 'legendary'
                };
            }

            // Calcule le coût d'amélioration (de plus en plus cher)
            const upgradeCost = Math.pow(2, currentIndex + 2); // 4, 8, 16, 32...

            if (collection[cardId].count < upgradeCost) {
                return {
                    success: false,
                    message: `Il faut ${upgradeCost} exemplaires pour cette amélioration`,
                    required: upgradeCost,
                    current: collection[cardId].count
                };
            }

            // Calcule la nouvelle rareté
            const newRarity = rarityOrder[currentIndex + 1];

            // Appel API pour upgrade
            const response = await authService.fetchAPI(`/users/${user.id}/cards/${cardId}/upgrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to_rarity: newRarity,
                    cost: upgradeCost
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    message: error.error || 'Erreur lors de l\'amélioration'
                };
            }

            const result = await response.json();

            // Recharge pour mettre à jour le cache local
            // Note: On garde celui-ci car c'est un cas rare (upgrade manuel)
            await this.getCollection();

            return {
                success: true,
                newRarity,
                message: `Carte améliorée en ${CONFIG.RARITIES[newRarity].name} !`,
                cost: upgradeCost,
                creditsEarned: result.creditsEarned || 0,
                excessCards: result.excessCards || 0
            };
        } catch (error) {
            console.error('Failed to upgrade card rarity:', error);
            return {
                success: false,
                message: 'Erreur lors de l\'amélioration'
            };
        }
    }

    // Retire des cartes de la collection (pour les améliorations)
    removeFromCollection(cardId, count) {
        const collection = this.getCollectionSync();

        if (collection[cardId] && collection[cardId].count >= count) {
            collection[cardId].count -= count;

            if (collection[cardId].count <= 0) {
                delete collection[cardId];
            }

            this.saveCollection(collection);
            return true;
        }

        return false;
    }

    // Vérifie si le joueur possède une carte
    hasCard(cardId) {
        const collection = this.getCollectionSync();
        return collection[cardId] && collection[cardId].count > 0;
    }

    // Récupère le nombre de cartes possédées (utilise le cache)
    getCardCount(cardId) {
        const collection = this.getCollectionSync();
        return collection[cardId] ? collection[cardId].count : 0;
    }

    // Récupère le niveau d'une carte (utilise le cache)
    getCardLevel(cardId) {
        const collection = this.getCollectionSync();
        return collection[cardId] ? collection[cardId].level : 1;
    }

    // Récupère la rareté actuelle d'une carte (utilise le cache)
    getCardCurrentRarity(cardId) {
        const collection = this.getCollectionSync();
        return collection[cardId] ? (collection[cardId].currentRarity || 'common') : 'common';
    }

    // Statistiques de la collection
    getCollectionStats() {
        const allCards = this.getAllCards();
        const collection = this.getCollectionSync(); // Utilise la version sync qui lit le cache

        const totalCards = allCards.length;
        const ownedCards = Object.keys(collection).length;
        const completionPercentage = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0;

        // Statistiques par thème (extraire les thèmes uniques depuis les cartes)
        const themeStats = {};
        const uniqueThemes = [...new Set(allCards.map(card => card.theme))];

        for (const theme of uniqueThemes) {
            const themeCards = this.getCardsByTheme(theme);
            const ownedThemeCards = themeCards.filter(card => this.hasCard(card.id));

            themeStats[theme] = {
                total: themeCards.length,
                owned: ownedThemeCards.length,
                percentage: themeCards.length > 0 ? Math.round((ownedThemeCards.length / themeCards.length) * 100) : 0
            };
        }

        return {
            totalCards,
            ownedCards,
            completionPercentage,
            themeStats
        };
    }

    // Sauvegarde de l'heure de dernière pioche
    saveLastDrawTime() {
        UTILS.saveToStorage(CONFIG.STORAGE_KEYS.LAST_DRAW, Date.now());
    }

    // Gestion des crédits de pioche via API
    async getCredits() {
        try {
            const user = authService.getCurrentUser();
            if (!user) return CONFIG.CREDITS.INITIAL;

            const response = await authService.fetchAPI(`/users/${user.id}/credits`);
            const data = await response.json();
            return data.credits ?? CONFIG.CREDITS.INITIAL;
        } catch (error) {
            console.error('Failed to get credits:', error);
            return CONFIG.CREDITS.INITIAL;
        }
    }

    async saveCredits(credits) {
        try {
            const user = authService.getCurrentUser();
            if (!user) return credits;

            const maxCredits = Math.min(credits, CONFIG.CREDITS.MAX_STORED);

            // Mettre à jour via API
            const response = await authService.fetchAPI(`/users/${user.id}/credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: maxCredits, action: 'set' })
            });

            if (!response.ok) {
                throw new Error('Failed to save credits');
            }

            return maxCredits;
        } catch (error) {
            console.error('Failed to save credits:', error);
            return credits;
        }
    }

    async addCredits(amount) {
        try {
            const user = authService.getCurrentUser();
            if (!user) return 0;

            const response = await authService.fetchAPI(`/users/${user.id}/credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });

            if (!response.ok) {
                throw new Error('Failed to add credits');
            }

            const data = await response.json();
            return Math.min(data.credits, CONFIG.CREDITS.MAX_STORED);
        } catch (error) {
            console.error('Failed to add credits:', error);
            return 0;
        }
    }

    async useCredit() {
        return this.useCredits(1);
    }

    // Utilise plusieurs crédits en un seul appel API
    async useCredits(amount) {
        try {
            const user = authService.getCurrentUser();
            if (!user) return { success: false, remaining: 0, used: 0 };

            // L'endpoint /credits/use vérifie déjà les crédits disponibles côté serveur
            // et retourne le montant réellement utilisé
            const response = await authService.fetchAPI(`/users/${user.id}/credits/use`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });

            if (!response.ok) {
                const data = await response.json();
                // Si pas assez de crédits, le serveur retourne une erreur
                if (response.status === 400) {
                    return { success: false, remaining: 0, used: 0 };
                }
                throw new Error(data.error || 'Failed to use credits');
            }

            const data = await response.json();
            return { success: true, remaining: data.credits, used: amount };
        } catch (error) {
            console.error('Failed to use credits:', error);
            return { success: false, remaining: 0, used: 0 };
        }
    }

    async hasCredits() {
        const credits = await this.getCredits();
        return credits > 0;
    }

    // Gestion du crédit quotidien
    getLastDailyCreditDate() {
        // Stocke la date au format YYYY-MM-DD
        return UTILS.loadFromStorage(CONFIG.STORAGE_KEYS.LAST_DAILY_CREDIT, null);
    }

    saveLastDailyCreditDate() {
        const today = new Date().toISOString().split('T')[0];
        return UTILS.saveToStorage(CONFIG.STORAGE_KEYS.LAST_DAILY_CREDIT, today);
    }

    canClaimDailyCredit() {
        const lastClaimDate = this.getLastDailyCreditDate();
        const today = new Date().toISOString().split('T')[0];

        // Si jamais réclamé ou date différente d'aujourd'hui
        return !lastClaimDate || lastClaimDate !== today;
    }

    getDailyCreditTimeLeft() {
        if (this.canClaimDailyCredit()) {
            return 0;
        }

        // Calcule le temps jusqu'à minuit
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);

        return midnight.getTime() - now.getTime();
    }

    async claimDailyCredit() {
        try {
            const user = authService.getCurrentUser();
            if (!user) {
                return {
                    success: false,
                    message: 'Utilisateur non connecté'
                };
            }

            const response = await authService.fetchAPI(`/users/${user.id}/credits/claim-daily`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    message: error.error || 'Erreur lors de la réclamation des crédits quotidiens'
                };
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Failed to claim daily credits:', error);
            return {
                success: false,
                message: 'Erreur lors de la réclamation des crédits quotidiens'
            };
        }
    }

    // Reset complet de la base de données (pour debug)
    resetDatabase() {
        localStorage.removeItem('all_cards');
        localStorage.removeItem(CONFIG.STORAGE_KEYS.COLLECTION);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_DRAW);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.CREDITS);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_DAILY_CREDIT);
        this.initializeData();
    }
}

// Instance globale
const DB = new DatabaseManager();

