// Système de gestion des cartes et mécaniques de jeu (adapté pour l'API)
class CardSystem {
    constructor() {
        this.currentTheme = 'minecraft';
        this.filters = {
            rarity: '',
            sort: 'default'
        };
    }

    // Pioche plusieurs cartes d'un coup
    async drawMultipleCards(count = 1) {
        const results = [];
        const drawnCards = {};

        for (let i = 0; i < count; i++) {
            const result = await this.drawSingleCard();
            if (result.success) {
                results.push(result);

                // Groupe les cartes identiques
                const cardId = result.card.id;
                if (!drawnCards[cardId]) {
                    drawnCards[cardId] = {
                        card: result.card,
                        count: 0,
                        wasNew: !result.isDuplicate && i === results.findIndex(r => r.card.id === cardId)
                    };
                }
                drawnCards[cardId].count++;
            } else {
                // Si une pioche échoue, on s'arrête
                break;
            }
        }

        return {
            success: results.length > 0,
            results: results,
            groupedCards: drawnCards,
            totalDrawn: results.length,
            creditsUsed: count,
            creditsRemaining: await DB.getCredits()
        };
    }

    // Pioche des cartes (interface publique)
    async drawCard(count = null) {
        // Si pas de count spécifié, utilise tous les crédits disponibles
        const credits = await DB.getCredits();
        const creditsToUse = count || credits;
        return await this.drawMultipleCards(creditsToUse);
    }

    // Pioche une carte aléatoire (fonction interne)
    async drawSingleCard() {
        // Vérifie si le joueur a des crédits
        const credits = await DB.getCredits();
        if (credits < 1) {
            return {
                success: false,
                message: 'Aucun crédit de pioche disponible'
            };
        }

        // Utilise un crédit
        await DB.useCredits(1);

        // Génère une rareté aléatoire
        const rarity = UTILS.getRandomRarity();

        // Récupère toutes les cartes de cette rareté (base_rarity)
        const allCards = DB.getAllCards();
        const cardsOfRarity = allCards.filter(c => c.base_rarity === rarity);

        if (cardsOfRarity.length === 0) {
            // Fallback sur une carte commune si aucune carte de cette rareté
            const commonCards = allCards.filter(c => c.base_rarity === 'common');
            const randomCard = commonCards[Math.floor(Math.random() * commonCards.length)];
            await DB.addToCollection(randomCard.id);

            return {
                success: true,
                card: randomCard,
                isDuplicate: false,
                creditsRemaining: await DB.getCredits()
            };
        }

        // Sélectionne une carte aléatoire
        const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];

        // Vérifie si c'est un doublon
        const collection = DB.getCollection();
        const isDuplicate = !!collection[randomCard.id];

        // Ajoute à la collection
        await DB.addToCollection(randomCard.id);

        return {
            success: true,
            card: randomCard,
            isDuplicate: isDuplicate,
            creditsRemaining: await DB.getCredits()
        };
    }

    // Définit le thème actuel
    setTheme(theme) {
        this.currentTheme = theme;
    }

    // Récupère le thème actuel
    getTheme() {
        return this.currentTheme;
    }

    // Alias pour setTheme (compatibilité)
    setCurrentTheme(theme) {
        this.setTheme(theme);
    }

    // Récupère les cartes du thème actuel avec filtres appliqués
    getCurrentThemeCards() {
        const allCards = DB.getAllCards();
        const filtered = this.applyFilters(allCards);

        // Enrichit avec les infos de collection
        const collection = DB.getCollection();
        return filtered.map(card => {
            const collectionItem = collection[card.id];
            const currentRarity = collectionItem?.currentRarity || 'common';
            const canUpgrade = this.canUpgradeRarity(card.id);

            return {
                ...card,
                owned: !!collectionItem,
                count: collectionItem?.quantity || 0,
                quantity: collectionItem?.quantity || 0,
                currentRarity: currentRarity,
                baseRarity: card.base_rarity,
                canUpgrade: canUpgrade.canUpgrade,
                upgradeInfo: canUpgrade
            };
        });
    }

    // Applique les filtres
    applyFilters(cards) {
        let filtered = [...cards];

        // Filtre par thème
        if (this.currentTheme) {
            const themeMap = {
                'minecraft': 'minecraft',
                'space': 'espace',
                'espace': 'espace',
                'dinosaurs': 'dinosaure',
                'dinosaure': 'dinosaure'
            };
            const mappedTheme = themeMap[this.currentTheme] || this.currentTheme;
            filtered = filtered.filter(card => card.category === mappedTheme);
        }

        // Filtre par rareté (base_rarity)
        if (this.filters.rarity) {
            filtered = filtered.filter(card => card.base_rarity === this.filters.rarity);
        }

        // Tri
        filtered = this.sortCards(filtered, this.filters.sort);

        return filtered;
    }

    // Trie les cartes selon le critère choisi
    sortCards(cards, sortType) {
        const sorted = [...cards];
        const rarityOrder = { common: 1, rare: 2, very_rare: 3, epic: 4, legendary: 5 };

        switch (sortType) {
            case 'rarity-asc':
                return sorted.sort((a, b) => rarityOrder[a.base_rarity] - rarityOrder[b.base_rarity]);
            case 'rarity-desc':
                return sorted.sort((a, b) => rarityOrder[b.base_rarity] - rarityOrder[a.base_rarity]);
            case 'alpha-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'alpha-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            case 'default':
            default:
                return sorted; // Ordre par défaut (tel que défini dans la DB)
        }
    }

    // Met à jour les filtres
    setFilter(filterName, value) {
        if (this.filters.hasOwnProperty(filterName)) {
            this.filters[filterName] = value;
        }
    }

    // Met à jour plusieurs filtres à la fois
    setFilters(filters) {
        Object.keys(filters).forEach(key => {
            if (this.filters.hasOwnProperty(key)) {
                this.filters[key] = filters[key];
            }
        });
    }

    // Récupère les statistiques détaillées
    getDetailedStats() {
        const collection = DB.getCollection();
        const allCards = DB.getAllCards();

        const stats = {
            totalCards: allCards.length,
            ownedCards: Object.keys(collection).length,
            completionPercentage: 0,
            rarityStats: {
                common: { total: 0, owned: 0 },
                rare: { total: 0, owned: 0 },
                epic: { total: 0, owned: 0 },
                legendary: { total: 0, owned: 0 }
            }
        };

        // Calcule les stats par rareté
        allCards.forEach(card => {
            if (stats.rarityStats[card.rarity]) {
                stats.rarityStats[card.rarity].total++;
                if (collection[card.id]) {
                    stats.rarityStats[card.rarity].owned++;
                }
            }
        });

        stats.completionPercentage = stats.totalCards > 0
            ? Math.round((stats.ownedCards / stats.totalCards) * 100)
            : 0;

        return stats;
    }

    // Simule des pioches (pour debug)
    async simulateDraws(count) {
        const results = {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0
        };

        for (let i = 0; i < count; i++) {
            const rarity = UTILS.getRandomRarity();
            results[rarity]++;
        }

        return results;
    }

    // Vérifie si une carte peut être upgradée
    canUpgradeRarity(cardId) {
        const collection = DB.getCollection();
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

        // Coût = 2^(index + 2) (4, 8, 16, 32...)
        const upgradeCost = Math.pow(2, currentIndex + 2);
        const hasEnoughCards = collection[cardId].quantity >= upgradeCost;

        return {
            canUpgrade: hasEnoughCards,
            cost: upgradeCost,
            current: collection[cardId].quantity,
            nextRarity: rarityOrder[currentIndex + 1],
            reason: hasEnoughCards ? 'Peut être améliorée' : `Besoin de ${upgradeCost} exemplaires`
        };
    }

    // Upgrade une carte
    async upgradeCard(cardId) {
        const upgradeInfo = this.canUpgradeRarity(cardId);

        if (!upgradeInfo.canUpgrade) {
            throw new Error(upgradeInfo.reason);
        }

        await DB.upgradeCard(cardId, upgradeInfo.nextRarity, upgradeInfo.cost);
    }

    // Calcule les points d'une carte selon sa rareté
    calculateCardPoints(card, currentRarity) {
        const rarityPoints = {
            'common': 1,
            'rare': 3,
            'very_rare': 6,
            'epic': 10,
            'legendary': 20
        };

        return rarityPoints[currentRarity] || 1;
    }

    // Récupère les cartes améliorables
    getUpgradeableCards() {
        const collection = DB.getCollection();
        const allCards = DB.getAllCards();

        return allCards.filter(card => {
            if (!collection[card.id]) return false;
            const upgradeInfo = this.canUpgradeRarity(card.id);
            return upgradeInfo.canUpgrade;
        });
    }

    // Récupère les cartes avec info de collection (pour l'UI)
    getCardsWithCollectionInfo(theme = null) {
        let cards = theme ? DB.getCardsByTheme(theme) : DB.getAllCards();
        const collection = DB.getCollection();

        return cards.map(card => {
            const collectionItem = collection[card.id];
            const currentRarity = collectionItem?.currentRarity || 'common';
            const canUpgrade = this.canUpgradeRarity(card.id);

            return {
                ...card,
                owned: !!collectionItem,
                count: collectionItem?.quantity || 0,
                quantity: collectionItem?.quantity || 0,
                currentRarity: currentRarity,
                baseRarity: card.base_rarity,
                canUpgrade: canUpgrade.canUpgrade,
                upgradeInfo: canUpgrade
            };
        });
    }
}

// Instance globale
const CARD_SYSTEM = new CardSystem();
