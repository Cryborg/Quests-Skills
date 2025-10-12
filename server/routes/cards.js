const express = require('express');
const { all, get, run } = require('../turso-db');
const { requireAdmin } = require('../middleware/auth');
const { authenticateAndTrack } = require('../middleware/activity-tracker');
const { validateRequired, validateRarity, validateImage, validateOwnership, validatePositiveNumber } = require('../middleware/validators');
const DBHelpers = require('../utils/db-helpers');

const router = express.Router();

// GET /api/cards - Récupérer toutes les cartes
router.get('/', async (req, res) => {
    try {
        const cards = await all('SELECT * FROM cards ORDER BY name ASC');

        // Ne PAS transformer les chemins - retourner les données brutes de la DB
        // La transformation se fait côté frontend pour l'affichage
        res.json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ error: 'Failed to fetch cards' });
    }
});

// GET /api/cards/:id - Récupérer une carte
router.get('/:id', async (req, res) => {
    try {
        const card = await get('SELECT * FROM cards WHERE id = ?', [parseInt(req.params.id)]);

        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Ne PAS transformer le chemin - retourner les données brutes de la DB
        // La transformation se fait côté frontend pour l'affichage
        res.json(card);
    } catch (error) {
        console.error('Error fetching card:', error);
        res.status(500).json({ error: 'Failed to fetch card' });
    }
});

// POST /api/cards - Créer une carte (admin seulement)
router.post('/',
    authenticateAndTrack,
    requireAdmin,
    validateRequired(['name', 'description', 'category', 'base_rarity', 'image']),
    validateRarity,
    validateImage,
    async (req, res) => {
    try {
        const { name, description, category, base_rarity, image } = req.body;

        // Valider le thème (vérifier qu'il existe dans card_themes)
        const theme = await get('SELECT * FROM card_themes WHERE slug = ?', [category]);
        if (!theme) {
            return res.status(400).json({ error: 'Invalid category: theme does not exist' });
        }

        // Créer la carte
        const now = DBHelpers.now();
        const result = await run(
            'INSERT INTO cards (name, description, category, base_rarity, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, category, base_rarity, image, now, now]
        );

        const newCard = await get('SELECT * FROM cards WHERE id = ?', [Number(result.lastInsertRowid)]);
        res.status(201).json(newCard);
    } catch (error) {
        console.error('Error creating card:', error);
        res.status(500).json({ error: 'Failed to create card' });
    }
});

// PUT /api/cards/:id - Modifier une carte (admin seulement)
router.put('/:id',
    authenticateAndTrack,
    requireAdmin,
    validateRarity,
    async (req, res) => {
    try {
        const cardId = parseInt(req.params.id);
        const { name, description, category, base_rarity, image } = req.body;

        // Vérifier que la carte existe
        const card = await get('SELECT * FROM cards WHERE id = ?', [cardId]);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Préparer les champs à mettre à jour
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }

        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }

        if (category !== undefined) {
            // Valider le thème (vérifier qu'il existe dans card_themes)
            const theme = await get('SELECT * FROM card_themes WHERE slug = ?', [category]);
            if (!theme) {
                return res.status(400).json({ error: 'Invalid category: theme does not exist' });
            }
            updates.push('category = ?');
            values.push(category);
        }

        if (base_rarity !== undefined) {
            // La validation de rareté sera faite par le middleware si nécessaire
            updates.push('base_rarity = ?');
            values.push(base_rarity);
        }

        if (image !== undefined) {
            updates.push('image = ?');
            values.push(image);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        // Ajouter updated_at
        updates.push('updated_at = ?');
        values.push(DBHelpers.now());

        values.push(cardId);
        await run(`UPDATE cards SET ${updates.join(', ')} WHERE id = ?`, values);

        const updatedCard = await get('SELECT * FROM cards WHERE id = ?', [cardId]);
        res.json(updatedCard);
    } catch (error) {
        console.error('Error updating card:', error);
        res.status(500).json({ error: 'Failed to update card' });
    }
});

// DELETE /api/cards/:id - Supprimer une carte (admin seulement)
router.delete('/:id', authenticateAndTrack, requireAdmin, async (req, res) => {
    try {
        const cardId = parseInt(req.params.id);

        // Vérifier que la carte existe
        const card = await get('SELECT * FROM cards WHERE id = ?', [cardId]);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Supprimer la carte
        await run('DELETE FROM cards WHERE id = ?', [cardId]);

        res.json({ message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Error deleting card:', error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

// POST /api/cards/draw/:userId - Piocher des cartes (optimisé)
router.post('/draw/:userId',
    authenticateAndTrack,
    validateOwnership,
    async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { count = 1 } = req.body;

        // Vérifier que l'utilisateur existe et a assez de crédits
        const user = await DBHelpers.getUserOrFail(userId);

        if (user.credits < count) {
            return res.status(400).json({
                error: 'Insufficient credits',
                required: count,
                available: user.credits
            });
        }

        // Retirer les crédits AVANT de piocher
        const now = DBHelpers.now();
        await run(
            'UPDATE users SET credits = credits - ?, updated_at = ? WHERE id = ?',
            [count, now, userId]
        );

        // Récupérer les thèmes sélectionnés par l'utilisateur
        const userThemes = await all(
            'SELECT theme_slug FROM user_themes WHERE user_id = ?',
            [userId]
        );
        const themesSlugs = userThemes.map(t => t.theme_slug);

        // Si aucun thème sélectionné, utiliser tous les thèmes
        let allCards;
        if (themesSlugs.length === 0) {
            allCards = await all('SELECT * FROM cards');
        } else {
            const placeholders = DBHelpers.buildInClause(themesSlugs);
            allCards = await all(
                `SELECT * FROM cards WHERE category IN (${placeholders})`,
                themesSlugs
            );
        }

        if (allCards.length === 0) {
            return res.status(400).json({ error: 'No cards available for selected themes' });
        }

        // Récupérer la collection actuelle de l'utilisateur
        const userCards = await all(
            'SELECT card_id, quantity, current_rarity FROM user_cards WHERE user_id = ?',
            [userId]
        );
        const collection = {};
        for (const uc of userCards) {
            collection[uc.card_id] = {
                quantity: uc.quantity,
                currentRarity: uc.current_rarity || 'common'
            };
        }

        // Fonction de génération de rareté aléatoire (probabilités identiques au front)
        const getRandomRarity = () => {
            const random = Math.random();
            if (random <= 0.60) return 'common';      // 60%
            if (random <= 0.85) return 'rare';        // 25%
            if (random <= 0.95) return 'very_rare';   // 10%
            if (random <= 0.99) return 'epic';        // 4%
            return 'legendary';                        // 1%
        };

        // Piocher les cartes
        const drawnCards = [];
        const cardsToUpdate = {}; // { card_id: quantity_to_add }

        for (let i = 0; i < count; i++) {
            // Générer une rareté aléatoire
            const targetRarity = getRandomRarity();

            // Filtrer les cartes : même baseRarity ET pas encore légendaires
            const availableCards = allCards.filter(card => {
                if (card.base_rarity !== targetRarity) return false;

                // Vérifier si la carte a déjà atteint la rareté légendaire
                const userCard = collection[card.id];
                if (userCard && userCard.currentRarity === 'legendary') return false;

                return true;
            });

            if (availableCards.length === 0) {
                // Fallback: prendre n'importe quelle carte non-légendaire
                const fallbackCards = allCards.filter(card => {
                    const userCard = collection[card.id];
                    return !userCard || userCard.currentRarity !== 'legendary';
                });

                if (fallbackCards.length === 0) continue; // Toutes les cartes sont légendaires

                const randomCard = fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
                drawnCards.push(randomCard);
                cardsToUpdate[randomCard.id] = (cardsToUpdate[randomCard.id] || 0) + 1;
            } else {
                // Sélectionner une carte aléatoire parmi les cartes disponibles
                const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
                drawnCards.push(randomCard);
                cardsToUpdate[randomCard.id] = (cardsToUpdate[randomCard.id] || 0) + 1;
            }
        }

        // Mettre à jour la collection en batch avec UPSERT (compatible SQLite et Turso)
        // Réutilise le 'now' déclaré plus haut (ligne 199)
        for (const [cardId, quantityToAdd] of Object.entries(cardsToUpdate)) {
            await run(`
                INSERT INTO user_cards (user_id, card_id, quantity, current_rarity, created_at, updated_at)
                VALUES (?, ?, ?, 'common', ?, ?)
                ON CONFLICT(user_id, card_id)
                DO UPDATE SET
                    quantity = quantity + excluded.quantity,
                    updated_at = excluded.updated_at
            `, [userId, cardId, quantityToAdd, now, now]);
        }

        // Transformer les cartes pour inclure les chemins d'images avec la nouvelle structure
        const CardsService = require('../services/cards-service');
        const cardsWithFullPaths = CardsService.transformImagePaths(drawnCards);

        res.json({
            success: true,
            cards: cardsWithFullPaths,
            totalDrawn: drawnCards.length
        });
    } catch (error) {
        console.error('Error drawing cards:', error);
        res.status(500).json({ error: 'Failed to draw cards' });
    }
});

module.exports = router;
