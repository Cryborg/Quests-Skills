const express = require('express');
const router = express.Router();
const { query, run } = require('../turso-db');
const { authenticateToken } = require('../middleware/auth');

// Configuration des limites par type de jeu (cartes gagnables par jour)
const GAME_LIMITS = {
    'sudoku': 3,
    'word-search': 3,
    'number-sequence': 3,
    'clock-reading': 3,
    'grid-navigation': 3,
    'cipher': 3
};

// Récupérer les sessions d'aujourd'hui pour un utilisateur et un jeu
router.get('/:userId/sessions/:gameType', authenticateToken, async (req, res) => {
    try {
        const { userId, gameType } = req.params;

        // Vérifier que l'utilisateur accède à ses propres données
        if (parseInt(userId) !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Récupérer les sessions d'aujourd'hui avec range comparisons (optimisé pour l'index)
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        const sessions = await query(
            `SELECT * FROM game_sessions
             WHERE user_id = ?
             AND game_type = ?
             AND created_at >= ?
             AND created_at <= ?
             ORDER BY created_at DESC`,
            [userId, gameType, todayStart, todayEnd]
        );

        // Calculer le total de cartes gagnées aujourd'hui
        const totalCardsEarned = sessions.rows.reduce((sum, session) => sum + (session.cards_earned || 0), 0);
        const limit = GAME_LIMITS[gameType] || 3;
        const remaining = Math.max(0, limit - totalCardsEarned);

        res.json({
            sessions: sessions.rows,
            totalCardsEarned,
            limit,
            remaining,
            canEarn: remaining > 0
        });
    } catch (error) {
        console.error('Error fetching game sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enregistrer une session de jeu
router.post('/:userId/sessions', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { gameType, errors, success } = req.body;

        // Vérifier que l'utilisateur accède à ses propres données
        if (parseInt(userId) !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Vérifier les sessions d'aujourd'hui avec range comparisons (optimisé pour l'index)
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        const sessions = await query(
            `SELECT SUM(cards_earned) as total FROM game_sessions
             WHERE user_id = ?
             AND game_type = ?
             AND created_at >= ?
             AND created_at <= ?`,
            [userId, gameType, todayStart, todayEnd]
        );

        const totalCardsEarned = sessions.rows[0]?.total || 0;
        const limit = GAME_LIMITS[gameType] || 3;
        const remaining = Math.max(0, limit - totalCardsEarned);

        // Calculer les cartes gagnées (toutes les 2 erreurs, on perd 1 carte)
        let cardsEarned = 0;
        if (success && remaining > 0) {
            const errorPenalty = Math.floor(errors / 2);
            cardsEarned = Math.max(0, Math.min(1 - errorPenalty, remaining));
        }

        // Enregistrer la session
        const now = new Date().toISOString();
        await run(
            `INSERT INTO game_sessions (user_id, game_type, errors, success, cards_earned, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, gameType, errors, success ? 1 : 0, cardsEarned, now]
        );

        // Si des cartes ont été gagnées, ajouter des crédits
        if (cardsEarned > 0) {
            await run(
                `UPDATE users SET credits = credits + ? WHERE id = ?`,
                [cardsEarned, userId]
            );
        }

        res.json({
            cardsEarned,
            totalCardsEarned: totalCardsEarned + cardsEarned,
            remaining: remaining - cardsEarned,
            limit
        });
    } catch (error) {
        console.error('Error saving game session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
