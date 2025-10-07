const express = require('express');
const { get, run } = require('../turso-db');

const router = express.Router();

// GET /api/auth/me - Récupérer l'user courant (pour l'instant user demo)
router.get('/me', async (req, res) => {
    try {
        // Pour l'instant, retourner un user demo (ID 1)
        // Plus tard : vérifier session/JWT
        let user = await get('SELECT * FROM users WHERE id = ?', [1]);

        // Si l'user demo n'existe pas, le créer
        if (!user) {
            await run(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                ['demo', 'demo@example.com', 'demo'] // En vrai il faudra hasher !
            );

            user = await get('SELECT * FROM users WHERE id = ?', [1]);

            // Créer les crédits initiaux
            await run(
                'INSERT INTO user_credits (user_id, credits) VALUES (?, ?)',
                [user.id, 10] // 10 crédits de départ
            );
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
