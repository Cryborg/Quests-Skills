const express = require('express');
const { get, run, all } = require('../turso-db');
const { checkOwnership, requireAdmin } = require('../middleware/auth');
const { authenticateAndTrack } = require('../middleware/activity-tracker');
const { validateRequired, validatePositiveNumber } = require('../middleware/validators');
const DBHelpers = require('../utils/db-helpers');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateAndTrack);

// POST /api/ratings - Créer ou mettre à jour une notation
router.post('/',
    validateRequired(['game_type', 'interest_rating', 'difficulty_rating']),
    async (req, res) => {
    try {
        const userId = req.user.id;
        const { game_type, interest_rating, difficulty_rating } = req.body;

        // Valider les notes (1-5)
        if (interest_rating < 1 || interest_rating > 5 || difficulty_rating < 1 || difficulty_rating > 5) {
            return res.status(400).json({ error: 'Ratings must be between 1 and 5' });
        }

        // Vérifier si une notation existe déjà
        const existing = await get(
            'SELECT * FROM game_ratings WHERE user_id = ? AND game_type = ?',
            [userId, game_type]
        );

        const now = DBHelpers.now();

        if (existing) {
            // Mettre à jour
            await run(
                `UPDATE game_ratings
                 SET interest_rating = ?, difficulty_rating = ?, updated_at = ?
                 WHERE id = ?`,
                [interest_rating, difficulty_rating, now, existing.id]
            );
        } else {
            // Créer
            await run(
                `INSERT INTO game_ratings (user_id, game_type, interest_rating, difficulty_rating, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, game_type, interest_rating, difficulty_rating, now, now]
            );
        }

        // Récupérer la notation mise à jour
        const rating = await get(
            'SELECT * FROM game_ratings WHERE user_id = ? AND game_type = ?',
            [userId, game_type]
        );

        res.json(rating);
    } catch (error) {
        console.error('Error saving rating:', error);
        res.status(500).json({ error: 'Failed to save rating' });
    }
});

// GET /api/ratings/:game_type - Récupérer la notation d'un utilisateur pour un jeu
router.get('/:game_type', async (req, res) => {
    try {
        const userId = req.user.id;
        const { game_type } = req.params;

        const rating = await get(
            'SELECT * FROM game_ratings WHERE user_id = ? AND game_type = ?',
            [userId, game_type]
        );

        if (!rating) {
            return res.status(404).json({ error: 'Rating not found' });
        }

        res.json(rating);
    } catch (error) {
        console.error('Error fetching rating:', error);
        res.status(500).json({ error: 'Failed to fetch rating' });
    }
});

// GET /api/ratings/stats/:game_type - Statistiques pour un jeu (admin seulement)
router.get('/stats/:game_type', requireAdmin, async (req, res) => {
    try {
        const { game_type } = req.params;

        // Récupérer toutes les notations pour ce jeu
        const ratings = await all(
            `SELECT gr.*, u.birth_date
             FROM game_ratings gr
             JOIN users u ON gr.user_id = u.id
             WHERE gr.game_type = ?`,
            [game_type]
        );

        // Calculer les moyennes globales
        const avgInterest = ratings.reduce((sum, r) => sum + r.interest_rating, 0) / ratings.length || 0;
        const avgDifficulty = ratings.reduce((sum, r) => sum + r.difficulty_rating, 0) / ratings.length || 0;

        // Grouper par tranche d'âge
        const ageGroups = {};
        const today = new Date();

        ratings.forEach(rating => {
            if (!rating.birth_date) return;

            const birthDate = new Date(rating.birth_date);
            const age = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24 * 365.25));

            // Déterminer la tranche d'âge
            let ageGroup;
            if (age < 8) ageGroup = '0-7';
            else if (age < 11) ageGroup = '8-10';
            else if (age < 14) ageGroup = '11-13';
            else if (age < 18) ageGroup = '14-17';
            else ageGroup = '18+';

            if (!ageGroups[ageGroup]) {
                ageGroups[ageGroup] = {
                    count: 0,
                    totalInterest: 0,
                    totalDifficulty: 0
                };
            }

            ageGroups[ageGroup].count++;
            ageGroups[ageGroup].totalInterest += rating.interest_rating;
            ageGroups[ageGroup].totalDifficulty += rating.difficulty_rating;
        });

        // Calculer les moyennes par tranche d'âge
        const ageStats = Object.keys(ageGroups).map(ageGroup => ({
            ageGroup,
            count: ageGroups[ageGroup].count,
            avgInterest: (ageGroups[ageGroup].totalInterest / ageGroups[ageGroup].count).toFixed(2),
            avgDifficulty: (ageGroups[ageGroup].totalDifficulty / ageGroups[ageGroup].count).toFixed(2)
        }));

        res.json({
            game_type,
            totalRatings: ratings.length,
            avgInterest: avgInterest.toFixed(2),
            avgDifficulty: avgDifficulty.toFixed(2),
            ageStats
        });
    } catch (error) {
        console.error('Error fetching rating stats:', error);
        res.status(500).json({ error: 'Failed to fetch rating stats' });
    }
});

// GET /api/ratings/stats/all - Statistiques pour tous les jeux (admin seulement)
router.get('/stats/all/games', requireAdmin, async (req, res) => {
    try {
        // Récupérer toutes les notations avec les dates de naissance
        const ratings = await all(
            `SELECT gr.*, u.birth_date
             FROM game_ratings gr
             JOIN users u ON gr.user_id = u.id`
        );

        // Grouper par type de jeu
        const gameStats = {};
        const today = new Date();

        ratings.forEach(rating => {
            if (!gameStats[rating.game_type]) {
                gameStats[rating.game_type] = {
                    game_type: rating.game_type,
                    totalRatings: 0,
                    totalInterest: 0,
                    totalDifficulty: 0,
                    ageGroups: {}
                };
            }

            const stats = gameStats[rating.game_type];
            stats.totalRatings++;
            stats.totalInterest += rating.interest_rating;
            stats.totalDifficulty += rating.difficulty_rating;

            // Calculer l'âge et grouper
            if (rating.birth_date) {
                const birthDate = new Date(rating.birth_date);
                const age = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24 * 365.25));

                let ageGroup;
                if (age < 8) ageGroup = '0-7';
                else if (age < 11) ageGroup = '8-10';
                else if (age < 14) ageGroup = '11-13';
                else if (age < 18) ageGroup = '14-17';
                else ageGroup = '18+';

                if (!stats.ageGroups[ageGroup]) {
                    stats.ageGroups[ageGroup] = {
                        count: 0,
                        totalInterest: 0,
                        totalDifficulty: 0
                    };
                }

                stats.ageGroups[ageGroup].count++;
                stats.ageGroups[ageGroup].totalInterest += rating.interest_rating;
                stats.ageGroups[ageGroup].totalDifficulty += rating.difficulty_rating;
            }
        });

        // Formater les résultats
        const results = Object.values(gameStats).map(stats => {
            const ageStats = Object.keys(stats.ageGroups).map(ageGroup => ({
                ageGroup,
                count: stats.ageGroups[ageGroup].count,
                avgInterest: (stats.ageGroups[ageGroup].totalInterest / stats.ageGroups[ageGroup].count).toFixed(2),
                avgDifficulty: (stats.ageGroups[ageGroup].totalDifficulty / stats.ageGroups[ageGroup].count).toFixed(2)
            }));

            return {
                game_type: stats.game_type,
                totalRatings: stats.totalRatings,
                avgInterest: (stats.totalInterest / stats.totalRatings).toFixed(2),
                avgDifficulty: (stats.totalDifficulty / stats.totalRatings).toFixed(2),
                ageStats
            };
        });

        res.json(results);
    } catch (error) {
        console.error('Error fetching all rating stats:', error);
        res.status(500).json({ error: 'Failed to fetch rating stats' });
    }
});

module.exports = router;
