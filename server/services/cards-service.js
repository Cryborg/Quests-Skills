const { get, run } = require('../turso-db');
const DBHelpers = require('../utils/db-helpers');

/**
 * Service pour la logique métier des cartes
 * Centralise les opérations courantes sur les cartes pour éviter la duplication
 */
class CardsService {
    /**
     * Transforme le path d'image d'une carte pour l'URL complète
     * @param {Object} card - Carte à transformer
     * @returns {Object} - Carte avec image path transformé
     *
     * @example
     * const card = { id: 1, image: 'images/card.jpg' };
     * const transformed = CardsService.transformImagePath(card);
     * // transformed.image = '/shared/images/card.jpg'
     */
    static transformImagePath(card) {
        return {
            ...card,
            image: card.image.startsWith('images/')
                ? `/shared/${card.image}`
                : card.image
        };
    }

    /**
     * Transforme un tableau de cartes avec leurs images
     * @param {Array} cards - Tableau de cartes
     * @returns {Array} - Cartes transformées
     */
    static transformImagePaths(cards) {
        return cards.map(card => this.transformImagePath(card));
    }

    /**
     * Ajoute ou met à jour une carte dans la collection d'un utilisateur (UPSERT)
     * Si la carte existe déjà, ajoute la quantité, sinon crée une nouvelle entrée
     * @param {number} userId - ID de l'utilisateur
     * @param {number} cardId - ID de la carte
     * @param {number} quantity - Quantité à ajouter (défaut: 1)
     * @param {string} rarity - Rareté initiale (défaut: 'common')
     * @returns {Promise<Object>} - Carte utilisateur créée/mise à jour
     *
     * @example
     * await CardsService.upsertUserCard(1, 42, 2);
     * // Ajoute 2 exemplaires de la carte 42 à l'utilisateur 1
     */
    static async upsertUserCard(userId, cardId, quantity = 1, rarity = 'common') {
        const existing = await get(
            'SELECT * FROM user_cards WHERE user_id = ? AND card_id = ?',
            [userId, cardId]
        );

        const now = DBHelpers.now();

        if (existing) {
            await run(
                'UPDATE user_cards SET quantity = ?, updated_at = ? WHERE id = ?',
                [existing.quantity + quantity, now, existing.id]
            );

            return {
                ...existing,
                quantity: existing.quantity + quantity,
                updated_at: now
            };
        } else {
            const result = await run(
                'INSERT INTO user_cards (user_id, card_id, quantity, current_rarity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, cardId, quantity, rarity, now, now]
            );

            return {
                id: result.lastInsertRowid,
                user_id: userId,
                card_id: cardId,
                quantity,
                current_rarity: rarity,
                created_at: now,
                updated_at: now
            };
        }
    }

    /**
     * Ajoute plusieurs cartes à la collection d'un utilisateur en batch
     * @param {number} userId - ID de l'utilisateur
     * @param {Array<{card_id: number, count: number}>} cards - Cartes à ajouter
     * @returns {Promise<Array>} - Cartes ajoutées/mises à jour
     *
     * @example
     * const cards = [
     *   { card_id: 1, count: 2 },
     *   { card_id: 5, count: 1 }
     * ];
     * await CardsService.addCardsToCollection(userId, cards);
     */
    static async addCardsToCollection(userId, cards) {
        const results = [];

        for (const { card_id, count } of cards) {
            const result = await this.upsertUserCard(userId, card_id, count);
            results.push(result);
        }

        return results;
    }

    /**
     * Calcule la prochaine rareté d'une carte
     * @param {string} currentRarity - Rareté actuelle
     * @returns {string|null} - Rareté suivante ou null si déjà légendaire
     */
    static getNextRarity(currentRarity) {
        const rarityOrder = ['common', 'rare', 'very_rare', 'epic', 'legendary'];
        const currentIndex = rarityOrder.indexOf(currentRarity);

        if (currentIndex === -1 || currentIndex >= rarityOrder.length - 1) {
            return null; // Déjà à la rareté maximale
        }

        return rarityOrder[currentIndex + 1];
    }

    /**
     * Calcule le coût d'amélioration pour une rareté donnée
     * Le coût augmente exponentiellement: 4, 8, 16, 32
     * @param {string} currentRarity - Rareté actuelle
     * @returns {number} - Coût en nombre de cartes
     */
    static getUpgradeCost(currentRarity) {
        const rarityOrder = ['common', 'rare', 'very_rare', 'epic', 'legendary'];
        const currentIndex = rarityOrder.indexOf(currentRarity);

        if (currentIndex === -1) {
            return 0;
        }

        // Formule: 2^(index + 2)
        // common (0): 2^2 = 4
        // rare (1): 2^3 = 8
        // very_rare (2): 2^4 = 16
        // epic (3): 2^5 = 32
        return Math.pow(2, currentIndex + 2);
    }

    /**
     * Vérifie si une carte peut être améliorée
     * @param {Object} userCard - Carte de l'utilisateur (avec quantity et current_rarity)
     * @returns {Object} - { canUpgrade: boolean, nextRarity: string|null, cost: number, current: number }
     */
    static canUpgradeCard(userCard) {
        const currentRarity = userCard.current_rarity || 'common';
        const nextRarity = this.getNextRarity(currentRarity);

        if (!nextRarity) {
            return {
                canUpgrade: false,
                nextRarity: null,
                cost: 0,
                current: userCard.quantity
            };
        }

        const cost = this.getUpgradeCost(currentRarity);
        const canUpgrade = userCard.quantity >= cost;

        return {
            canUpgrade,
            nextRarity,
            cost,
            current: userCard.quantity
        };
    }

    /**
     * Améliore la rareté d'une carte utilisateur
     * Vérifie les conditions et effectue l'upgrade
     * @param {number} userId - ID de l'utilisateur
     * @param {number} cardId - ID de la carte
     * @returns {Promise<Object>} - Résultat de l'upgrade
     */
    static async upgradeCardRarity(userId, cardId) {
        const userCard = await get(
            'SELECT * FROM user_cards WHERE user_id = ? AND card_id = ?',
            [userId, cardId]
        );

        if (!userCard) {
            return {
                success: false,
                message: 'Carte non trouvée dans votre collection'
            };
        }

        const upgradeInfo = this.canUpgradeCard(userCard);

        if (!upgradeInfo.canUpgrade) {
            return {
                success: false,
                message: upgradeInfo.nextRarity
                    ? `Il faut ${upgradeInfo.cost} exemplaires pour cette amélioration`
                    : 'Cette carte a atteint sa rareté maximale (Légendaire)',
                required: upgradeInfo.cost,
                current: upgradeInfo.current
            };
        }

        // Effectuer l'upgrade
        const newQuantity = userCard.quantity - upgradeInfo.cost;
        const now = DBHelpers.now();

        await run(
            'UPDATE user_cards SET quantity = ?, current_rarity = ?, updated_at = ? WHERE id = ?',
            [newQuantity, upgradeInfo.nextRarity, now, userCard.id]
        );

        // Si la carte atteint la rareté légendaire, bonus de crédits
        let creditsEarned = 0;
        if (upgradeInfo.nextRarity === 'legendary') {
            creditsEarned = 5;
            await DBHelpers.addCredits(userId, creditsEarned);
        }

        return {
            success: true,
            newRarity: upgradeInfo.nextRarity,
            cost: upgradeInfo.cost,
            newQuantity,
            creditsEarned,
            message: `Carte améliorée en ${upgradeInfo.nextRarity} !`
        };
    }

    /**
     * Récupère toutes les cartes d'une catégorie/thème
     * @param {string} category - Slug de la catégorie
     * @returns {Promise<Array>} - Cartes de la catégorie
     */
    static async getCardsByCategory(category) {
        const { query } = require('../turso-db');
        const result = await query(
            'SELECT * FROM cards WHERE category = ? ORDER BY name',
            [category]
        );
        return this.transformImagePaths(result.rows || []);
    }
}

module.exports = CardsService;
