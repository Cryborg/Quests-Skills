const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users/:id - Récupérer un user
router.get('/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.params.id) }
        });

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
router.get('/:id/cards', async (req, res) => {
    try {
        const userCards = await prisma.userCard.findMany({
            where: { user_id: parseInt(req.params.id) },
            include: { card: true }
        });

        res.json(userCards);
    } catch (error) {
        console.error('Error fetching user cards:', error);
        res.status(500).json({ error: 'Failed to fetch user cards' });
    }
});

// POST /api/users/:id/cards - Ajouter une carte à un user
router.post('/:id/cards', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { card_id } = req.body;

        // Vérifier si l'user a déjà cette carte
        const existing = await prisma.userCard.findUnique({
            where: {
                user_id_card_id: {
                    user_id: userId,
                    card_id: card_id
                }
            }
        });

        if (existing) {
            // Incrémenter la quantité
            const updated = await prisma.userCard.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + 1 },
                include: { card: true }
            });
            return res.json(updated);
        }

        // Créer nouvelle relation
        const userCard = await prisma.userCard.create({
            data: {
                user_id: userId,
                card_id: card_id,
                quantity: 1
            },
            include: { card: true }
        });

        res.json(userCard);
    } catch (error) {
        console.error('Error adding card to user:', error);
        res.status(500).json({ error: 'Failed to add card' });
    }
});

// POST /api/users/:id/cards/:cardId/upgrade - Upgrader une carte
router.post('/:id/cards/:cardId/upgrade', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const cardId = parseInt(req.params.cardId);
        const { to_rarity, cost } = req.body;

        // Vérifier que l'user a la carte
        const userCard = await prisma.userCard.findUnique({
            where: {
                user_id_card_id: { user_id: userId, card_id: cardId }
            },
            include: { card: true }
        });

        if (!userCard) {
            return res.status(404).json({ error: 'Card not owned' });
        }

        // Vérifier que l'user a assez de cartes pour l'upgrade
        if (userCard.quantity < cost) {
            return res.status(400).json({ error: 'Not enough cards to upgrade' });
        }

        // Upgrade: déduire le coût et changer la rareté
        const updated = await prisma.userCard.update({
            where: { id: userCard.id },
            data: {
                current_rarity: to_rarity,
                quantity: userCard.quantity - cost
            },
            include: { card: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error upgrading card:', error);
        res.status(500).json({ error: 'Failed to upgrade card' });
    }
});

// GET /api/users/:id/credits - Récupérer les crédits d'un user
router.get('/:id/credits', async (req, res) => {
    try {
        const credits = await prisma.userCredit.findUnique({
            where: { user_id: parseInt(req.params.id) }
        });

        res.json(credits || { credits: 0 });
    } catch (error) {
        console.error('Error fetching user credits:', error);
        res.status(500).json({ error: 'Failed to fetch credits' });
    }
});

// POST /api/users/:id/credits - Ajouter des crédits
router.post('/:id/credits', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { amount } = req.body;

        const credits = await prisma.userCredit.upsert({
            where: { user_id: userId },
            update: { credits: { increment: amount } },
            create: { user_id: userId, credits: amount }
        });

        res.json(credits);
    } catch (error) {
        console.error('Error adding credits:', error);
        res.status(500).json({ error: 'Failed to add credits' });
    }
});

// POST /api/users/:id/credits/use - Utiliser des crédits
router.post('/:id/credits/use', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { amount } = req.body;

        const currentCredits = await prisma.userCredit.findUnique({
            where: { user_id: userId }
        });

        if (!currentCredits || currentCredits.credits < amount) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }

        const updated = await prisma.userCredit.update({
            where: { user_id: userId },
            data: { credits: { decrement: amount } }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error using credits:', error);
        res.status(500).json({ error: 'Failed to use credits' });
    }
});

// GET /api/users/:id/attempts - Récupérer l'historique des tentatives
router.get('/:id/attempts', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { date } = req.query;

        const where = { user_id: userId };

        // Filtrer par date si fournie
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            where.created_at = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        const attempts = await prisma.operationAttempt.findMany({
            where,
            include: { bonus_operation: true },
            orderBy: { created_at: 'desc' }
        });

        res.json(attempts);
    } catch (error) {
        console.error('Error fetching attempts:', error);
        res.status(500).json({ error: 'Failed to fetch attempts' });
    }
});

// POST /api/users/:id/attempts - Enregistrer une tentative
router.post('/:id/attempts', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { bonus_operation_id, exercise, user_answers, success, cards_earned } = req.body;

        const attempt = await prisma.operationAttempt.create({
            data: {
                user_id: userId,
                bonus_operation_id,
                exercise,
                user_answers,
                success,
                cards_earned
            },
            include: { bonus_operation: true }
        });

        res.json(attempt);
    } catch (error) {
        console.error('Error creating attempt:', error);
        res.status(500).json({ error: 'Failed to create attempt' });
    }
});

module.exports = router;
