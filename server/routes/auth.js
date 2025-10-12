const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { get, run, all } = require('../turso-db');
const { authenticateAndTrack } = require('../middleware/activity-tracker');
const { validateRequired, validateEmail, validateThemes } = require('../middleware/validators');
const DBHelpers = require('../utils/db-helpers');

const router = express.Router();

// POST /api/auth/register - Inscription
router.post('/register',
    validateRequired(['username', 'password']),
    validateEmail,
    async (req, res) => {
    try {
        const { username, email, password, birth_date, theme_slugs } = req.body;

        // Validation du mot de passe (spécifique)
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

        // Créer l'utilisateur avec crédits initiaux
        const now = DBHelpers.now();
        await run(
            'INSERT INTO users (username, email, password, birth_date, is_admin, credits, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, birth_date || null, 0, 10, now, now]
        );

        const user = await get('SELECT * FROM users WHERE email = ?', [email]);

        // Assigner les thèmes seulement si fournis
        if (theme_slugs && Array.isArray(theme_slugs)) {
            // Valider le nombre de thèmes
            if (theme_slugs.length < 3 || theme_slugs.length > 10) {
                return res.status(400).json({ error: 'You must select between 3 and 10 themes' });
            }
            // Vérifier que tous les thèmes existent
            const allThemes = await all('SELECT slug FROM card_themes');
            const validSlugs = allThemes.map(t => t.slug);
            const validThemeSlugs = theme_slugs.filter(slug => validSlugs.includes(slug));

            if (validThemeSlugs.length >= 3 && validThemeSlugs.length <= 10) {
                // Batch INSERT pour tous les thèmes en une seule requête
                const { placeholders, values } = DBHelpers.buildBatchInsert(
                    validThemeSlugs.map(slug => ({ user_id: user.id, theme_slug: slug, created_at: now })),
                    ['user_id', 'theme_slug', 'created_at']
                );
                await run(
                    `INSERT INTO user_themes (user_id, theme_slug, created_at) VALUES ${placeholders}`,
                    values
                );
            }
        }
        // Sinon, aucun thème n'est assigné et l'utilisateur devra les choisir à sa première connexion

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
router.post('/login',
    validateRequired(['email', 'password']),
    async (req, res) => {
    try {
        const { email, password } = req.body;

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
router.get('/me', authenticateAndTrack, async (req, res) => {
    try {
        const user = await DBHelpers.getUserOrFail(req.user.id);
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err) {
        return res.status(err.status || 500).json({ error: err.error || 'Failed to fetch user' });
    }
});

// POST /api/auth/logout - Déconnexion
router.post('/logout', (req, res) => {
    // Avec JWT, le logout se fait côté client en supprimant le token
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
