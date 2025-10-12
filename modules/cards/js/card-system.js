// Système de gestion des cartes et mécaniques de jeu
class CardSystem {
    constructor() {
        this.currentTheme = 'minecraft';
        this.filters = {
            rarity: '',
            sort: 'default'
        };
    }

    // Pioche plusieurs cartes d'un coup (OPTIMISÉ - utilise la route serveur)
    async drawMultipleCards(count = 1) {
        const user = authService.getCurrentUser();
        if (!user) {
            return {
                success: false,
                results: [],
                groupedCards: {},
                totalDrawn: 0,
                creditsUsed: 0,
                message: 'Utilisateur non connecté'
            };
        }

        try {
            console.log(`🎰 Drawing ${count} cards via optimized server route...`);

            // UN SEUL appel API qui fait TOUT : vérification des crédits, retrait, pioche ET ajout
            const response = await authService.fetchAPI(`/cards/draw/${user.id}`, {
                method: 'POST',
                body: JSON.stringify({ count })
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    results: [],
                    groupedCards: {},
                    totalDrawn: 0,
                    creditsUsed: 0,
                    message: error.error || 'Erreur lors de la pioche'
                };
            }

            const data = await response.json();
            const drawnCards = data.cards;

            console.log(`✅ ${drawnCards.length} cartes piochées depuis le serveur`);

            // Grouper les cartes identiques pour l'animation
            const groupedCards = {};
            const currentCollection = DB.getCollectionSync();

            for (const card of drawnCards) {
                const cardId = card.id;
                if (!groupedCards[cardId]) {
                    // Vérifier si c'était une nouvelle carte (pas dans la collection avant)
                    const wasNew = !currentCollection[cardId] || currentCollection[cardId].count === 0;

                    groupedCards[cardId] = {
                        card: card,
                        count: 0,
                        wasNew: wasNew
                    };
                }
                groupedCards[cardId].count++;
            }

            // Recharger la collection pour avoir les données à jour
            await DB.getCollection();

            // Mettre à jour les crédits locaux (la route a déjà retiré les crédits côté serveur)
            if (typeof CreditsManager !== 'undefined') {
                CreditsManager.currentCredits = Math.max(0, CreditsManager.currentCredits - count);
                CreditsManager.emitCreditsUpdate();
            }

            // Sauvegarde l'heure de pioche
            DB.saveLastDrawTime();

            return {
                success: true,
                results: drawnCards.map(card => ({ success: true, card })),
                groupedCards: groupedCards,
                totalDrawn: drawnCards.length,
                creditsUsed: count,
                creditsRemaining: 0
            };
        } catch (error) {
            console.error('❌ Failed to draw cards:', error);
            return {
                success: false,
                results: [],
                groupedCards: {},
                totalDrawn: 0,
                creditsUsed: 0,
                message: 'Erreur lors de la pioche'
            };
        }
    }

    // Pioche des cartes (interface publique)
    async drawCard(count = null) {
        // Si pas de count spécifié, utilise tous les crédits disponibles
        const creditsToUse = count || await DB.getCredits();
        return await this.drawMultipleCards(creditsToUse);
    }

    // Pioche une carte aléatoire (fonction interne, SANS appels API ni modification DB)
    drawSingleCardLocal() {
        // Génère une rareté aléatoire selon la baseRarity de la carte
        const baseRarity = UTILS.getRandomRarity();
        console.log('🎲 Random rarity:', baseRarity);

        // Récupère toutes les cartes de cette rareté de base
        const allCards = DB.getAllCards();
        console.log('📊 Total cards in DB:', allCards.length);

        // Récupère les thèmes sélectionnés par l'utilisateur
        const userThemes = DB.getUserThemes();
        console.log('🎨 User themes:', userThemes);

        // Filtre les cartes : même baseRarity ET pas encore légendaires ET thème sélectionné
        const availableCards = allCards.filter(card => {
            if (card.baseRarity !== baseRarity) {
                return false;
            }

            // Filtrer par thèmes sélectionnés (si des thèmes sont configurés)
            if (userThemes.length > 0 && !userThemes.includes(card.theme)) {
                return false;
            }

            // Vérifie si cette carte a déjà atteint le niveau légendaire
            const currentRarity = DB.getCardCurrentRarity(card.id);
            return currentRarity !== 'legendary';
        });

        console.log('✅ Available cards after filtering:', availableCards.length);

        if (availableCards.length === 0) {
            console.error('❌ No available cards to draw!');
            return {
                success: false,
                message: 'Aucune carte disponible avec tes thèmes sélectionnés'
            };
        }

        // Sélectionne une carte aléatoire
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const drawnCard = availableCards[randomIndex];

        // Note: on ne modifie plus la collection ici, c'est fait en batch après
        const currentCount = DB.getCardCount(drawnCard.id);
        const isDuplicate = currentCount > 0;

        return {
            success: true,
            card: drawnCard,
            isDuplicate,
            newCount: currentCount + 1,  // Valeur future après l'ajout
            message: isDuplicate ? CONFIG.MESSAGES.DUPLICATE_FOUND : CONFIG.MESSAGES.CARD_DRAWN
        };
    }

    // Améliore une carte en utilisant des doublons (amélioration de rareté)
    async upgradeCard(cardId) {
        return await DB.upgradeCardRarity(cardId);
    }

    // Calcule les points d'une carte selon sa rareté actuelle
    calculateCardPoints(card, currentRarity) {
        // Sécurité : vérifier que la rareté existe
        if (!currentRarity || !CONFIG.RARITIES[currentRarity]) {
            console.warn(`Rareté invalide pour la carte ${card?.id}: ${currentRarity}`);
            return 0;
        }
        const basePoints = CONFIG.RARITIES[currentRarity].points;
        return basePoints;
    }

    // Récupère toutes les cartes avec leurs informations de collection
    getCardsWithCollectionInfo(themeFilter = null) {
        const allCards = DB.getAllCards();
        const collection = DB.getCollectionSync(); // Utilise la version sync qui lit le cache

        let filteredCards = allCards;

        // Filtre par thème
        if (themeFilter) {
            filteredCards = filteredCards.filter(card => card.theme === themeFilter);
        }

        // Filtre par rareté (basé sur la rareté actuelle)
        if (this.filters.rarity) {
            filteredCards = filteredCards.filter(card => {
                const currentRarity = DB.getCardCurrentRarity(card.id);
                return currentRarity === this.filters.rarity;
            });
        }

        // Ajoute les informations de collection
        let cardsWithInfo = filteredCards.map(card => {
            const collectionItem = collection[card.id];
            const currentRarity = DB.getCardCurrentRarity(card.id);
            const canUpgradeRarity = this.canUpgradeRarity(card.id);

            const result = {
                ...card,
                owned: !!collectionItem,
                count: collectionItem ? collectionItem.count : 0,
                currentRarity: currentRarity,
                baseRarity: card.baseRarity,
                points: this.calculateCardPoints(card, currentRarity),
                canUpgrade: canUpgradeRarity.canUpgrade,
                upgradeInfo: canUpgradeRarity
            };

            // Debug : vérifie les propriétés manquantes
            if (!result.baseRarity) {
                console.error('baseRarity manquante pour la carte:', card);
            }

            return result;
        });

        // Applique le tri
        cardsWithInfo = this.applySorting(cardsWithInfo);

        return cardsWithInfo;
    }

    // Applique le tri sur les cartes
    applySorting(cards) {
        const sortType = this.filters.sort;

        switch (sortType) {
            case 'rarity-asc':
                return this.sortByRarity(cards, 'asc');
            case 'rarity-desc':
                return this.sortByRarity(cards, 'desc');
            case 'alpha-asc':
                return this.sortAlphabetically(cards, 'asc');
            case 'alpha-desc':
                return this.sortAlphabetically(cards, 'desc');
            case 'default':
            default:
                return cards; // Ordre original
        }
    }

    // Tri par rareté (basé sur la rareté actuelle de la carte)
    sortByRarity(cards, order = 'asc') {
        const rarityOrder = ['common', 'rare', 'very_rare', 'epic', 'legendary'];

        return cards.slice().sort((a, b) => {
            const rarityA = rarityOrder.indexOf(a.currentRarity);
            const rarityB = rarityOrder.indexOf(b.currentRarity);

            if (order === 'asc') {
                return rarityA - rarityB;
            } else {
                return rarityB - rarityA;
            }
        });
    }

    // Tri alphabétique par nom
    sortAlphabetically(cards, order = 'asc') {
        return cards.slice().sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            if (order === 'asc') {
                return nameA.localeCompare(nameB, 'fr');
            } else {
                return nameB.localeCompare(nameA, 'fr');
            }
        });
    }

    // Vérifie si une carte peut être améliorée en rareté
    canUpgradeRarity(cardId) {
        const collection = DB.getCollectionSync();
        const card = DB.getCardById(cardId);

        if (!collection[cardId] || !card) {
            return { canUpgrade: false, reason: 'Carte non possédée' };
        }

        const currentRarity = collection[cardId].currentRarity || 'common';
        const rarityOrder = ['common', 'rare', 'very_rare', 'epic', 'legendary'];
        const currentIndex = rarityOrder.indexOf(currentRarity);
        const legendaryIndex = rarityOrder.indexOf('legendary');

        if (currentIndex >= legendaryIndex) {
            return {
                canUpgrade: false,
                reason: 'Rareté maximale atteinte (Légendaire)',
                maxRarity: 'legendary'
            };
        }

        const upgradeCost = Math.pow(2, currentIndex + 2);
        const hasEnoughCards = collection[cardId].count >= upgradeCost;

        return {
            canUpgrade: hasEnoughCards,
            cost: upgradeCost,
            current: collection[cardId].count,
            nextRarity: rarityOrder[currentIndex + 1],
            reason: hasEnoughCards ? 'Peut être améliorée' : `Besoin de ${upgradeCost} exemplaires`
        };
    }

    // Met à jour les filtres
    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
    }

    // Change le thème actuel
    setCurrentTheme(theme) {
        this.currentTheme = theme;
    }

    // Récupère les cartes du thème actuel
    getCurrentThemeCards() {
        return this.getCardsWithCollectionInfo(this.currentTheme);
    }

    // Calcule le score total du joueur
    calculateTotalScore() {
        const collection = DB.getCollectionSync();
        const allCards = DB.getAllCards();
        let totalScore = 0;

        for (const [cardId, collectionItem] of Object.entries(collection)) {
            const card = allCards.find(c => c.id === cardId);
            if (card) {
                const cardScore = this.calculateCardPoints(card, collectionItem.currentRarity);
                totalScore += cardScore;
            }
        }

        return totalScore;
    }

    // Récupère les statistiques détaillées
    getDetailedStats() {
        const basicStats = DB.getCollectionStats();
        const totalScore = this.calculateTotalScore();
        const collection = DB.getCollection();

        // Statistiques par rareté
        const rarityStats = {};
        for (const [rarityKey, rarity] of Object.entries(CONFIG.RARITIES)) {
            const allCardsOfRarity = DB.getAllCards().filter(card => card.rarity === rarityKey);
            const ownedCardsOfRarity = allCardsOfRarity.filter(card => DB.hasCard(card.id));

            rarityStats[rarityKey] = {
                name: rarity.name,
                total: allCardsOfRarity.length,
                owned: ownedCardsOfRarity.length,
                percentage: allCardsOfRarity.length > 0 ?
                    Math.round((ownedCardsOfRarity.length / allCardsOfRarity.length) * 100) : 0
            };
        }

        // Carte la plus élevée en niveau
        let highestLevelCard = null;
        let highestLevel = 0;

        for (const [cardId, collectionItem] of Object.entries(collection)) {
            if (collectionItem.level > highestLevel) {
                highestLevel = collectionItem.level;
                highestLevelCard = DB.getCardById(cardId);
            }
        }

        return {
            ...basicStats,
            totalScore,
            rarityStats,
            highestLevelCard,
            highestLevel
        };
    }

    // Vérifie s'il y a des améliorations possibles
    hasUpgradeableCards() {
        const cards = this.getCardsWithCollectionInfo();
        return cards.some(card => card.canUpgrade);
    }

    // Récupère les cartes qui peuvent être améliorées
    getUpgradeableCards() {
        const cards = this.getCardsWithCollectionInfo();
        return cards.filter(card => card.canUpgrade);
    }

    // Simulation de pioche (pour les probabilités)
    simulateDraws(numberOfDraws = 100) {
        const results = {};

        for (const rarityKey of Object.keys(CONFIG.RARITIES)) {
            results[rarityKey] = 0;
        }

        for (let i = 0; i < numberOfDraws; i++) {
            const rarity = UTILS.getRandomRarity();
            results[rarity]++;
        }

        // Convertit en pourcentages
        for (const rarityKey of Object.keys(results)) {
            results[rarityKey] = Math.round((results[rarityKey] / numberOfDraws) * 100);
        }

        return results;
    }
}

// Instance globale
const CARD_SYSTEM = new CardSystem();