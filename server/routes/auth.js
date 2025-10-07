const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/auth/me - Récupérer l'user courant (pour l'instant user demo)
router.get('/me', async (req, res) => {
    try {
        // Pour l'instant, retourner un user demo (ID 1)
        // Plus tard : vérifier session/JWT
        let user = await prisma.user.findUnique({
            where: { id: 1 }
        });

        // Si l'user demo n'existe pas, le créer
        if (!user) {
            user = await prisma.user.create({
                data: {
                    username: 'demo',
                    email: 'demo@example.com',
                    password: 'demo' // En vrai il faudra hasher !
                }
            });

            // Créer les crédits initiaux
            await prisma.userCredit.create({
                data: {
                    user_id: user.id,
                    credits: 10 // 10 crédits de départ
                }
            });
        }

        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// POST /api/auth/login - Login (TODO)
router.post('/login', async (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' });
});

// POST /api/auth/register - Register (TODO)
router.post('/register', async (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' });
});

// POST /api/auth/logout - Logout (TODO)
router.post('/logout', async (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
