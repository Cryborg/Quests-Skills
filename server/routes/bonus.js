const express = require('express');
const { all, get } = require('../turso-db');
const { authenticateAndTrack } = require('../middleware/activity-tracker');

const router = express.Router();

// GET /api/bonus-operations - Récupérer toutes les opérations bonus
router.get('/', authenticateAndTrack, async (req, res) => {
    try {
        const operations = await all(
            'SELECT * FROM bonus_operations WHERE is_active = 1 ORDER BY type ASC'
        );

        res.json(operations);
    } catch (error) {
        console.error('Error fetching bonus operations:', error);
        res.status(500).json({ error: 'Failed to fetch bonus operations' });
    }
});

// GET /api/bonus-operations/:id - Récupérer une opération
router.get('/:id', authenticateAndTrack, async (req, res) => {
    try {
        const operation = await get(
            'SELECT * FROM bonus_operations WHERE id = ?',
            [parseInt(req.params.id)]
        );

        if (!operation) {
            return res.status(404).json({ error: 'Operation not found' });
        }

        res.json(operation);
    } catch (error) {
        console.error('Error fetching operation:', error);
        res.status(500).json({ error: 'Failed to fetch operation' });
    }
});

module.exports = router;
