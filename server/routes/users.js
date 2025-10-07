const express = require('express');
const bcrypt = require('bcryptjs');
const { all, get, run } = require('../turso-db');
const { authenticateToken, checkOwnership, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/users - Récupérer tous les utilisateurs (admin seulement)
router.get('/', requireAdmin, async (req, res) => {
    try {
        const users = await all(`
            SELECT u.*,
                   COALESCE(uc.credits, 0) as credits
            FROM users u
            LEFT JOIN user_credits uc ON u.id = uc.user_id
            ORDER BY u.created_at DESC
        `);

        // Ne pas retourner les passwords
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.json(usersWithoutPasswords);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/users - Créer un utilisateur (admin seulement)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { username, email, password, is_admin } = req.body;

        // Valider les champs requis
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email and password are required' });
        }

        // Vérifier si l'email existe déjà
        const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const result = await run(
            'INSERT INTO users (username, email, password, is_admin, created_at) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, is_admin ? 1 : 0, new Date().toISOString()]
        );

        // Initialiser les crédits à 0
        await run(
            'INSERT INTO user_credits (user_id, credits) VALUES (?, ?)',
            [result.lastID, 0]
        );

        const newUser = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/users/:id - Modifier un utilisateur (admin ou propriétaire)
router.put('/:id', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { username, email, password, is_admin } = req.body;

        // Vérifier que l'utilisateur existe
        const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Préparer les champs à mettre à jour
        const updates = [];
        const values = [];

        if (username !== undefined) {
            updates.push('username = ?');
            values.push(username);
        }

        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        // Seul un admin peut modifier le statut admin
        if (is_admin !== undefined && req.user.is_admin) {
            updates.push('is_admin = ?');
            values.push(is_admin ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(userId);
        await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        const updatedUser = await get('SELECT * FROM users WHERE id = ?', [userId]);
        const { password: _, ...userWithoutPassword } = updatedUser;

        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/users/:id - Supprimer un utilisateur (admin seulement)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Vérifier que l'utilisateur existe
        const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Empêcher de se supprimer soi-même
        if (req.user.id === userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Supprimer l'utilisateur (les suppressions en cascade devraient gérer le reste)
        await run('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

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

// POST /api/users/:id/credits - Ajouter ou définir des crédits
router.post('/:id/credits', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { amount, action } = req.body;

        const existing = await get(
            'SELECT * FROM user_credits WHERE user_id = ?',
            [userId]
        );

        if (existing) {
            // Si action = 'set', définir la valeur exacte, sinon ajouter
            if (action === 'set') {
                await run(
                    'UPDATE user_credits SET credits = ? WHERE user_id = ?',
                    [amount, userId]
                );
            } else {
                await run(
                    'UPDATE user_credits SET credits = credits + ? WHERE user_id = ?',
                    [amount, userId]
                );
            }
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
        console.error('Error modifying credits:', error);
        res.status(500).json({ error: 'Failed to modify credits' });
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
            SELECT oa.*, bo.reward, bo.type
            FROM operation_attempts oa
            LEFT JOIN bonus_operations bo ON oa.operation_type = bo.type
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
        const { operation_type, exercise, user_answers, success, cards_earned } = req.body;

        await run(
            `INSERT INTO operation_attempts
             (user_id, operation_type, exercise, user_answers, success, cards_earned, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                operation_type,
                JSON.stringify(exercise),
                JSON.stringify(user_answers),
                success ? 1 : 0,
                cards_earned || 0,
                new Date().toISOString()
            ]
        );

        const attempt = await get(
            `SELECT oa.*, bo.reward, bo.type
             FROM operation_attempts oa
             LEFT JOIN bonus_operations bo ON oa.operation_type = bo.type
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
