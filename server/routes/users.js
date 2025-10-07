const express = require('express');
const { all, get, run } = require('../turso-db');
const { authenticateToken, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/users/:id - Récupérer un user
router.get('/:id', checkOwnership, async (req, res) => {
    try {
        const user = await get('SELECT * FROM users WHERE id = ?', [parseInt(req.params.id)]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Ne pas retourner le password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// GET /api/users/:id/cards - Récupérer les cartes d'un user
router.get('/:id/cards', checkOwnership, async (req, res) => {
    try {
        const userCards = await all(
            `SELECT uc.*, c.*
             FROM user_cards uc
             JOIN cards c ON uc.card_id = c.id
             WHERE uc.user_id = ?`,
            [parseInt(req.params.id)]
        );

        res.json(userCards);
    } catch (error) {
        console.error('Error fetching user cards:', error);
        res.status(500).json({ error: 'Failed to fetch user cards' });
    }
});

// POST /api/users/:id/cards - Ajouter une carte à un user
router.post('/:id/cards', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { card_id } = req.body;

        // Vérifier si l'user a déjà cette carte
        const existing = await get(
            'SELECT * FROM user_cards WHERE user_id = ? AND card_id = ?',
            [userId, card_id]
        );

        if (existing) {
            // Incrémenter la quantité
            await run(
                'UPDATE user_cards SET quantity = ? WHERE id = ?',
                [existing.quantity + 1, existing.id]
            );

            const updated = await get(
                `SELECT uc.*, c.*
                 FROM user_cards uc
                 JOIN cards c ON uc.card_id = c.id
                 WHERE uc.id = ?`,
                [existing.id]
            );
            return res.json(updated);
        }

        // Créer nouvelle relation
        await run(
            'INSERT INTO user_cards (user_id, card_id, quantity) VALUES (?, ?, ?)',
            [userId, card_id, 1]
        );

        const userCard = await get(
            `SELECT uc.*, c.*
             FROM user_cards uc
             JOIN cards c ON uc.card_id = c.id
             WHERE uc.user_id = ? AND uc.card_id = ?`,
            [userId, card_id]
        );

        res.json(userCard);
    } catch (error) {
        console.error('Error adding card to user:', error);
        res.status(500).json({ error: 'Failed to add card' });
    }
});

// POST /api/users/:id/cards/:cardId/upgrade - Upgrader une carte
router.post('/:id/cards/:cardId/upgrade', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const cardId = parseInt(req.params.cardId);
        const { to_rarity, cost } = req.body;

        // Vérifier que l'user a la carte
        const userCard = await get(
            `SELECT uc.*, c.*
             FROM user_cards uc
             JOIN cards c ON uc.card_id = c.id
             WHERE uc.user_id = ? AND uc.card_id = ?`,
            [userId, cardId]
        );

        if (!userCard) {
            return res.status(404).json({ error: 'Card not owned' });
        }

        // Vérifier que l'user a assez de cartes pour l'upgrade
        if (userCard.quantity < cost) {
            return res.status(400).json({ error: 'Not enough cards to upgrade' });
        }

        // Upgrade: déduire le coût et changer la rareté
        await run(
            'UPDATE user_cards SET current_rarity = ?, quantity = ? WHERE id = ?',
            [to_rarity, userCard.quantity - cost, userCard.id]
        );

        const updated = await get(
            `SELECT uc.*, c.*
             FROM user_cards uc
             JOIN cards c ON uc.card_id = c.id
             WHERE uc.id = ?`,
            [userCard.id]
        );

        res.json(updated);
    } catch (error) {
        console.error('Error upgrading card:', error);
        res.status(500).json({ error: 'Failed to upgrade card' });
    }
});

// GET /api/users/:id/credits - Récupérer les crédits d'un user
router.get('/:id/credits', checkOwnership, async (req, res) => {
    try {
        const credits = await get(
            'SELECT * FROM user_credits WHERE user_id = ?',
            [parseInt(req.params.id)]
        );

        res.json(credits || { credits: 0 });
    } catch (error) {
        console.error('Error fetching user credits:', error);
        res.status(500).json({ error: 'Failed to fetch credits' });
    }
});

// POST /api/users/:id/credits - Ajouter des crédits
router.post('/:id/credits', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { amount } = req.body;

        const existing = await get(
            'SELECT * FROM user_credits WHERE user_id = ?',
            [userId]
        );

        if (existing) {
            await run(
                'UPDATE user_credits SET credits = credits + ? WHERE user_id = ?',
                [amount, userId]
            );
        } else {
            await run(
                'INSERT INTO user_credits (user_id, credits) VALUES (?, ?)',
                [userId, amount]
            );
        }

        const credits = await get(
            'SELECT * FROM user_credits WHERE user_id = ?',
            [userId]
        );

        res.json(credits);
    } catch (error) {
        console.error('Error adding credits:', error);
        res.status(500).json({ error: 'Failed to add credits' });
    }
});

// POST /api/users/:id/credits/use - Utiliser des crédits
router.post('/:id/credits/use', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { amount } = req.body;

        const currentCredits = await get(
            'SELECT * FROM user_credits WHERE user_id = ?',
            [userId]
        );

        if (!currentCredits || currentCredits.credits < amount) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }

        await run(
            'UPDATE user_credits SET credits = credits - ? WHERE user_id = ?',
            [amount, userId]
        );

        const updated = await get(
            'SELECT * FROM user_credits WHERE user_id = ?',
            [userId]
        );

        res.json(updated);
    } catch (error) {
        console.error('Error using credits:', error);
        res.status(500).json({ error: 'Failed to use credits' });
    }
});

// GET /api/users/:id/attempts - Récupérer l'historique des tentatives
router.get('/:id/attempts', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { date } = req.query;

        let sql = `
            SELECT oa.*, bo.*
            FROM operation_attempts oa
            JOIN bonus_operations bo ON oa.bonus_operation_id = bo.id
            WHERE oa.user_id = ?
        `;
        const args = [userId];

        // Filtrer par date si fournie
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            sql += ' AND oa.created_at >= ? AND oa.created_at <= ?';
            args.push(startOfDay.toISOString(), endOfDay.toISOString());
        }

        sql += ' ORDER BY oa.created_at DESC';

        const attempts = await all(sql, args);

        res.json(attempts);
    } catch (error) {
        console.error('Error fetching attempts:', error);
        res.status(500).json({ error: 'Failed to fetch attempts' });
    }
});

// POST /api/users/:id/attempts - Enregistrer une tentative
router.post('/:id/attempts', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { bonus_operation_id, exercise, user_answers, success, cards_earned } = req.body;

        await run(
            `INSERT INTO operation_attempts
             (user_id, bonus_operation_id, exercise, user_answers, success, cards_earned, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                bonus_operation_id,
                JSON.stringify(exercise),
                JSON.stringify(user_answers),
                success ? 1 : 0,
                cards_earned,
                new Date().toISOString()
            ]
        );

        const attempt = await get(
            `SELECT oa.*, bo.*
             FROM operation_attempts oa
             JOIN bonus_operations bo ON oa.bonus_operation_id = bo.id
             WHERE oa.user_id = ?
             ORDER BY oa.created_at DESC
             LIMIT 1`,
            [userId]
        );

        res.json(attempt);
    } catch (error) {
        console.error('Error creating attempt:', error);
        res.status(500).json({ error: 'Failed to create attempt' });
    }
});

module.exports = router;
