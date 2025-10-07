const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/cards - Récupérer toutes les cartes
router.get('/', async (req, res) => {
    try {
        const cards = await prisma.card.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ error: 'Failed to fetch cards' });
    }
});

// GET /api/cards/:id - Récupérer une carte
router.get('/:id', async (req, res) => {
    try {
        const card = await prisma.card.findUnique({
            where: { id: parseInt(req.params.id) }
        });

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
