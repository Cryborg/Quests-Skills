const express = require('express');
const { all, get } = require('../turso-db');

const router = express.Router();

// GET /api/cards - Récupérer toutes les cartes
router.get('/', async (req, res) => {
    try {
        const cards = await all('SELECT * FROM cards ORDER BY name ASC');
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

        res.json(card);
    } catch (error) {
        console.error('Error fetching card:', error);
        res.status(500).json({ error: 'Failed to fetch card' });
    }
});

module.exports = router;
