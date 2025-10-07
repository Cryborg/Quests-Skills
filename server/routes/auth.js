const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { get, run } = require('../turso-db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register - Inscription
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Vérifier si l'email existe déjà
        const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Vérifier si le username existe déjà
        const existingUsername = await get('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsername) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const now = new Date().toISOString();
        await run(
            'INSERT INTO users (username, email, password, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, 0, now, now]
        );

        const user = await get('SELECT * FROM users WHERE email = ?', [email]);

        // Créer les crédits initiaux
        await run(
            'INSERT INTO user_credits (user_id, credits, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [user.id, 10, now, now]
        );

        // Créer le token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username, is_admin: user.is_admin },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Retourner l'user et le token
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// POST /api/auth/login - Connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Récupérer l'utilisateur
        const user = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Créer le token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username, is_admin: user.is_admin },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Retourner l'user et le token
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

// GET /api/auth/me - Récupérer l'utilisateur connecté
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// POST /api/auth/logout - Déconnexion
router.post('/logout', (req, res) => {
    // Avec JWT, le logout se fait côté client en supprimant le token
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
