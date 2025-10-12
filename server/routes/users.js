const express = require('express');
const bcrypt = require('bcryptjs');
const { all, get, run } = require('../turso-db');
const { checkOwnership, requireAdmin } = require('../middleware/auth');
const { authenticateAndTrack } = require('../middleware/activity-tracker');
const { validateRequired, validateEmail, validateThemes, validatePositiveNumber, validateOwnership } = require('../middleware/validators');
const DBHelpers = require('../utils/db-helpers');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateAndTrack);

// GET /api/users - Récupérer tous les utilisateurs (admin seulement)
router.get('/', requireAdmin, async (req, res) => {
    try {
        // Récupérer tous les utilisateurs
        const users = await all(`
            SELECT u.*
            FROM users u
            ORDER BY u.created_at DESC
        `);

        // Récupérer TOUS les derniers logins en une seule requête
        const lastLogins = await all(`
            SELECT ual.user_id, MAX(ual.created_at) as created_at
            FROM user_activity_logs ual
            WHERE ual.action_type = 'login'
            GROUP BY ual.user_id
        `);

        // Créer un map pour un accès O(1)
        const lastLoginMap = new Map(lastLogins.map(l => [l.user_id, l.created_at]));

        // Fusionner les données
        const usersWithLastLogin = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                last_login_at: lastLoginMap.get(user.id) || null
            };
        });

        res.json(usersWithLastLogin);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET /api/users/:id/profile - Récupérer le profil complet avec historique (admin only)
// IMPORTANT: Cette route doit être AVANT /:id pour éviter que /:id ne la matche
router.get('/:id/profile', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Infos de base de l'utilisateur (avec crédits depuis users)
        const user = await get(`
            SELECT u.id, u.username, u.email, u.is_admin, u.created_at, u.updated_at,
                   COALESCE(u.credits, 0) as credits
            FROM users u
            WHERE u.id = ?
        `, [userId]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Statistiques générales
        const stats = {
            totalCards: await get('SELECT COUNT(*) as count FROM user_cards WHERE user_id = ?', [userId]),
            totalGames: await get('SELECT COUNT(*) as count FROM game_sessions WHERE user_id = ?', [userId]),
            totalLogins: await get('SELECT COUNT(*) as count FROM user_activity_logs WHERE user_id = ? AND action_type = ?', [userId, 'login'])
        };

        // Historique d'activité récente (50 dernières)
        const activityLogs = await all(
            `SELECT action_type, details, created_at
             FROM user_activity_logs
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 50`,
            [userId]
        );

        // Historique des sessions de jeu (20 dernières)
        const gameSessions = await all(
            `SELECT game_type, errors, success, cards_earned, created_at
             FROM game_sessions
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 20`,
            [userId]
        );

        // Thèmes sélectionnés
        const themes = await all(
            `SELECT ct.slug, ct.name, ct.icon
             FROM user_themes ut
             JOIN card_themes ct ON ut.theme_slug = ct.slug
             WHERE ut.user_id = ?`,
            [userId]
        );

        // Enrichir les thèmes avec les stats de collection par rareté
        // Récupérer TOUTES les stats owned en une seule requête
        const themeSlugs = themes.map(t => t.slug);
        const placeholders = DBHelpers.buildInClause(themeSlugs);

        const allRarityStats = await all(`
            SELECT
                c.category as theme_slug,
                uc.current_rarity as rarity,
                COUNT(DISTINCT uc.card_id) as owned
            FROM user_cards uc
            JOIN cards c ON uc.card_id = c.id
            WHERE uc.user_id = ? AND c.category IN (${placeholders})
            GROUP BY c.category, uc.current_rarity
        `, [userId, ...themeSlugs]);

        // Récupérer TOUS les totaux en une seule requête
        const allTotalsByRarity = await all(`
            SELECT
                category as theme_slug,
                base_rarity as rarity,
                COUNT(*) as total
            FROM cards
            WHERE category IN (${placeholders})
            GROUP BY category, base_rarity
        `, themeSlugs);

        // Créer des maps pour regrouper par thème
        const ownedByTheme = {};
        const totalsByTheme = {};

        allRarityStats.forEach(stat => {
            if (!ownedByTheme[stat.theme_slug]) ownedByTheme[stat.theme_slug] = [];
            ownedByTheme[stat.theme_slug].push(stat);
        });

        allTotalsByRarity.forEach(stat => {
            if (!totalsByTheme[stat.theme_slug]) totalsByTheme[stat.theme_slug] = [];
            totalsByTheme[stat.theme_slug].push(stat);
        });

        // Enrichir les thèmes
        for (const theme of themes) {
            const rarityStats = ownedByTheme[theme.slug] || [];
            const totalByRarity = totalsByTheme[theme.slug] || [];

            theme.rarityStats = {};
            for (const t of totalByRarity) {
                theme.rarityStats[t.rarity] = {
                    total: t.total,
                    owned: 0
                };
            }
            for (const owned of rarityStats) {
                if (theme.rarityStats[owned.rarity]) {
                    theme.rarityStats[owned.rarity].owned = owned.owned;
                }
            }
        }

        res.json({
            user,
            stats: {
                totalCards: stats.totalCards.count,
                totalGames: stats.totalGames.count,
                totalLogins: stats.totalLogins.count
            },
            themes,
            activityLogs,
            gameSessions
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// POST /api/users - Créer un utilisateur (admin seulement)
router.post('/',
    requireAdmin,
    validateRequired(['username', 'email', 'password']),
    validateEmail,
    async (req, res) => {
    try {
        const { username, email, password, is_admin } = req.body;

        console.log('========================================');
        console.log('👤 POST /api/users - Create user');
        console.log('📝 Request body:', { username, email, is_admin, password: '***' });

        // Vérifier si l'email existe déjà
        console.log('🔍 Checking if email exists:', email);
        const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            console.error('❌ Email already exists');
            return res.status(409).json({ error: 'Email already exists' });
        }
        console.log('✅ Email is available');

        // Hasher le mot de passe
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Password hashed');

        // Créer l'utilisateur
        console.log('📝 Creating user in database...');
        const now = DBHelpers.now();
        const result = await run(
            'INSERT INTO users (username, email, password, is_admin, credits, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, is_admin ? 1 : 0, 10, now, now]
        );
        const userId = Number(result.lastInsertRowid);
        console.log('✅ User created with ID:', userId);

        // Initialiser les crédits à 10 (directement dans users)
        console.log('💰 Credits initialized to 10');

        // Assigner 3 thèmes aléatoires par défaut
        console.log('🎨 Adding 3 random themes...');
        const allThemes = await all('SELECT slug FROM card_themes');
        console.log(`📊 Found ${allThemes.length} themes`);
        const shuffled = allThemes.sort(() => 0.5 - Math.random());
        const selectedThemes = shuffled.slice(0, 3);

        // Batch INSERT pour tous les thèmes en une seule requête
        const { placeholders, values } = DBHelpers.buildBatchInsert(
            selectedThemes.map(theme => ({ user_id: userId, theme_slug: theme.slug, created_at: now })),
            ['user_id', 'theme_slug', 'created_at']
        );
        await run(
            `INSERT INTO user_themes (user_id, theme_slug, created_at) VALUES ${placeholders}`,
            values
        );
        console.log('✅ 3 random themes added:', selectedThemes.map(t => t.slug).join(', '));

        const newUser = await get('SELECT * FROM users WHERE id = ?', [userId]);
        const { password: _, ...userWithoutPassword } = newUser;

        console.log('✅ User created successfully:', userWithoutPassword.id);
        console.log('========================================');
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('❌❌❌ ERROR creating user:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        console.error('========================================');
        res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
});

// PUT /api/users/:id - Modifier un utilisateur (admin ou propriétaire)
router.put('/:id', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { username, email, password, birth_date, is_admin } = req.body;

        // Vérifier que l'utilisateur existe
        const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (email !== undefined && email !== user.email) {
            const existingEmail = await get('SELECT * FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (existingEmail) {
                return res.status(409).json({ error: 'Email already in use' });
            }
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

        if (birth_date !== undefined) {
            updates.push('birth_date = ?');
            values.push(birth_date || null);
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

// GET /api/users/:id/cards - Récupérer les cartes d'un user (filtrées par thèmes sélectionnés)
router.get('/:id/cards', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Récupérer les thèmes sélectionnés de l'utilisateur
        const userThemes = await all(
            'SELECT theme_slug FROM user_themes WHERE user_id = ?',
            [userId]
        );

        // Si l'utilisateur n'a pas de thèmes sélectionnés, retourner toutes ses cartes
        let userCards;
        if (userThemes.length === 0) {
            userCards = await all(
                `SELECT uc.*, c.*
                 FROM user_cards uc
                 JOIN cards c ON uc.card_id = c.id
                 WHERE uc.user_id = ?`,
                [userId]
            );
        } else {
            // Filtrer les cartes par thèmes sélectionnés
            const themeSlugs = userThemes.map(t => t.theme_slug);
            const placeholders = DBHelpers.buildInClause(themeSlugs);

            userCards = await all(
                `SELECT uc.*, c.*
                 FROM user_cards uc
                 JOIN cards c ON uc.card_id = c.id
                 WHERE uc.user_id = ? AND c.category IN (${placeholders})`,
                [userId, ...themeSlugs]
            );
        }

        // Transformer les chemins d'images avec la structure par catégorie
        const CardsService = require('../services/cards-service');
        const cardsWithFullPaths = CardsService.transformImagePaths(userCards);

        res.json(cardsWithFullPaths);
    } catch (error) {
        console.error('Error fetching user cards:', error);
        res.status(500).json({ error: 'Failed to fetch user cards' });
    }
});

// POST /api/users/:id/cards - Ajouter une ou plusieurs cartes (batch endpoint)
router.post('/:id/cards', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { cards } = req.body; // [{card_id: '...', count: 1}, ...] ou {card_id: '...'} pour une seule

        console.log('========================================');
        console.log('📝 POST /users/:id/cards - User ID:', userId);
        console.log('📝 Request Body:', JSON.stringify(req.body, null, 2));
        console.log('📝 Cards field:', cards);
        console.log('📝 Cards type:', typeof cards);
        console.log('📝 Is Array?', Array.isArray(cards));

        // Supporte aussi le format single card {card_id: '...'}
        let cardsArray;
        if (Array.isArray(cards)) {
            cardsArray = cards;
            console.log('✅ Using cards array');
        } else if (req.body.card_id) {
            // Format legacy : {card_id: '...'}
            cardsArray = [{ card_id: req.body.card_id, count: 1 }];
            console.log('✅ Using legacy format with card_id:', req.body.card_id);
        } else {
            console.error('❌ No cards array or card_id provided');
            return res.status(400).json({ error: 'Cards array or card_id is required' });
        }

        if (cardsArray.length === 0) {
            console.error('❌ Cards array is empty');
            return res.status(400).json({ error: 'Cards array cannot be empty' });
        }

        console.log('📊 Cards array length:', cardsArray.length);
        console.log('📊 First 3 cards:', JSON.stringify(cardsArray.slice(0, 3), null, 2));

        // Compte les occurrences de chaque card_id
        const cardCounts = {};
        for (const card of cardsArray) {
            if (!card || !card.card_id) {
                console.error('❌ Invalid card object:', card);
                continue;
            }
            cardCounts[card.card_id] = (cardCounts[card.card_id] || 0) + (card.count || 1);
        }

        console.log('🔢 Card counts:', cardCounts);
        console.log('🔢 Unique cards to process:', Object.keys(cardCounts).length);

        // Pour chaque carte unique, update ou insert
        for (const [cardId, count] of Object.entries(cardCounts)) {
            console.log(`🔍 Processing card ${cardId} (type: ${typeof cardId}, count: ${count})`);

            // Vérifier si la carte existe dans la table cards
            const cardExists = await get('SELECT id FROM cards WHERE id = ?', [cardId]);
            if (!cardExists) {
                console.error(`❌ Card ${cardId} not found in cards table`);
                continue;
            }
            console.log(`✅ Card ${cardId} exists in cards table`);

            const existing = await get(
                'SELECT * FROM user_cards WHERE user_id = ? AND card_id = ?',
                [userId, cardId]
            );

            if (existing) {
                console.log(`📝 Updating existing user_card ${existing.id}: ${existing.quantity} + ${count}`);
                await run(
                    'UPDATE user_cards SET quantity = ? WHERE id = ?',
                    [existing.quantity + count, existing.id]
                );
                console.log(`✅ Updated to ${existing.quantity + count}`);
            } else {
                // Insère avec current_rarity = 'common' par défaut
                const now = DBHelpers.now();
                console.log(`📝 Inserting new user_card: user=${userId}, card=${cardId}, qty=${count}`);
                const result = await run(
                    'INSERT INTO user_cards (user_id, card_id, quantity, current_rarity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, cardId, count, 'common', now, now]
                );
                console.log(`✅ Inserted with ID ${result.lastInsertRowid}`);
            }
        }

        console.log('📦 Fetching updated collection...');
        // Retourne la collection complète
        const userCards = await all(
            `SELECT uc.*, c.*
             FROM user_cards uc
             JOIN cards c ON uc.card_id = c.id
             WHERE uc.user_id = ?`,
            [userId]
        );

        // Transformer les chemins d'images avec la structure par catégorie
        const CardsService = require('../services/cards-service');
        const cardsWithFullPaths = CardsService.transformImagePaths(userCards);

        console.log(`✅ Collection has ${cardsWithFullPaths.length} cards`);
        console.log('========================================');
        res.json({ added: Object.keys(cardCounts).length, collection: cardsWithFullPaths });
    } catch (error) {
        console.error('❌❌❌ ERROR IN /users/:id/cards:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('========================================');
        res.status(500).json({ error: 'Failed to add cards', details: error.message });
    }
});

// POST /api/users/:id/cards/:cardId/upgrade - Upgrader une carte
router.post('/:id/cards/:cardId/upgrade', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const cardId = parseInt(req.params.cardId);
        const { to_rarity, cost } = req.body;

        console.log('🔺 UPGRADE REQUEST:', { userId, cardId, to_rarity, cost });

        // Vérifier que l'user a la carte
        const userCard = await get(
            `SELECT uc.id as user_card_id, uc.user_id, uc.card_id, uc.quantity, uc.current_rarity, c.*
             FROM user_cards uc
             JOIN cards c ON uc.card_id = c.id
             WHERE uc.user_id = ? AND uc.card_id = ?`,
            [userId, cardId]
        );

        console.log('🔍 Found user_card:', userCard);

        if (!userCard) {
            console.log('❌ Card not found');
            return res.status(404).json({ error: 'Card not owned' });
        }

        // Vérifier que l'user a assez de cartes pour l'upgrade
        if (userCard.quantity < cost) {
            console.log('❌ Not enough cards:', userCard.quantity, '<', cost);
            return res.status(400).json({ error: 'Not enough cards to upgrade' });
        }

        let creditsEarned = 0;
        let excessCards = 0;
        let newQuantity = userCard.quantity - cost;

        console.log('📊 Calculating new values:', { currentQuantity: userCard.quantity, cost, newQuantity });

        // Si on atteint Légendaire, convertit les cartes en excès en crédits
        if (to_rarity === 'legendary') {
            excessCards = Math.max(0, newQuantity);
            creditsEarned = excessCards * 1; // 1 crédit par carte en excès
            newQuantity = 1; // Garde seulement 1 exemplaire Légendaire

            console.log('💎 Legendary upgrade:', { excessCards, creditsEarned, newQuantity });

            // Ajoute les crédits gagnés si nécessaire
            if (creditsEarned > 0) {
                await DBHelpers.addCredits(userId, creditsEarned);
            }
        }

        // Upgrade: déduire le coût et changer la rareté
        console.log('💾 Executing UPDATE:', {
            user_card_id: userCard.user_card_id,
            to_rarity,
            newQuantity,
            currentRarity: userCard.current_rarity
        });

        const result = await run(
            'UPDATE user_cards SET current_rarity = ?, quantity = ?, updated_at = ? WHERE id = ?',
            [to_rarity, newQuantity, DBHelpers.now(), userCard.user_card_id]
        );

        console.log('✅ UPDATE result:', result);

        const updated = await get(
            `SELECT uc.*, c.*
             FROM user_cards uc
             JOIN cards c ON uc.card_id = c.id
             WHERE uc.id = ?`,
            [userCard.user_card_id]
        );

        // Transformer le chemin d'image avec la structure par catégorie
        const CardsService = require('../services/cards-service');
        const updatedWithFullPath = CardsService.transformImagePath(updated);

        console.log('🔄 Updated card:', updatedWithFullPath);

        res.json({
            card: updatedWithFullPath,
            creditsEarned,
            excessCards
        });
    } catch (error) {
        console.error('❌❌❌ Error upgrading card:', error);
        res.status(500).json({ error: 'Failed to upgrade card' });
    }
});

// GET /api/users/:id/credits - Récupérer les crédits d'un user
router.get('/:id/credits', checkOwnership, async (req, res) => {
    try {
        const user = await get(
            'SELECT id, credits FROM users WHERE id = ?',
            [parseInt(req.params.id)]
        );

        // S'assurer que les crédits ne sont jamais négatifs
        const safeCredits = user ? { credits: Math.max(0, user.credits || 0) } : { credits: 0 };

        // Empêcher le cache pour les crédits
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        res.json(safeCredits);
    } catch (error) {
        console.error('Error fetching user credits:', error);
        res.status(500).json({ error: 'Failed to fetch credits' });
    }
});

// POST /api/users/:id/credits/claim-daily - Réclamer les crédits quotidiens
router.post('/:id/credits/claim-daily', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const DAILY_BONUS = 5;
        const MAX_CREDITS = 99;

        const user = await get(
            'SELECT id, credits, last_daily_claim FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const today = new Date().toISOString().split('T')[0];
        const lastClaim = user.last_daily_claim;

        // Si c'est la première connexion, marque aujourd'hui sans donner de crédits
        if (!lastClaim) {
            await run(
                'UPDATE users SET last_daily_claim = ?, updated_at = ? WHERE id = ?',
                [today, DBHelpers.now(), userId]
            );
            return res.json({
                success: false,
                message: 'Première connexion - crédits quotidiens disponibles demain',
                creditsAdded: 0,
                daysAwarded: 0,
                totalCredits: user.credits
            });
        }

        // Calcule le nombre de jours d'absence
        const lastDate = new Date(lastClaim);
        const currentDate = new Date(today);
        const daysDifference = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

        if (daysDifference === 0) {
            return res.json({
                success: false,
                message: 'Crédits quotidiens déjà réclamés aujourd\'hui',
                creditsAdded: 0,
                daysAwarded: 0,
                totalCredits: user.credits
            });
        }

        // Calcule les crédits à ajouter
        const creditsToAdd = daysDifference * DAILY_BONUS;
        const newCredits = Math.min(user.credits + creditsToAdd, MAX_CREDITS);

        // Met à jour les crédits et la date de claim
        await run(
            'UPDATE users SET credits = ?, last_daily_claim = ?, updated_at = ? WHERE id = ?',
            [newCredits, today, DBHelpers.now(), userId]
        );

        const dayText = daysDifference === 1 ? 'jour' : 'jours';
        const creditText = creditsToAdd === 1 ? 'crédit' : 'crédits';

        res.json({
            success: true,
            creditsAdded: creditsToAdd,
            daysAwarded: daysDifference,
            totalCredits: newCredits,
            message: daysDifference === 1
                ? `+${creditsToAdd} ${creditText} quotidien !`
                : `+${creditsToAdd} ${creditText} pour ${daysDifference} ${dayText} d'absence !`
        });
    } catch (error) {
        console.error('Error claiming daily credits:', error);
        res.status(500).json({ error: 'Failed to claim daily credits' });
    }
});

// POST /api/users/:id/credits - Ajouter ou définir des crédits
router.post('/:id/credits',
    checkOwnership,
    validatePositiveNumber('amount'),
    async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { amount, action } = req.body;
        const MAX_CREDITS = 99; // Maximum de crédits stockables

        const user = await get(
            'SELECT id, credits FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let newCredits;
        const now = DBHelpers.now();

        // Si action = 'set', définir la valeur exacte, sinon ajouter
        if (action === 'set') {
            newCredits = Math.min(amount, MAX_CREDITS);
        } else {
            newCredits = Math.min(user.credits + amount, MAX_CREDITS);
        }

        await run(
            'UPDATE users SET credits = ?, updated_at = ? WHERE id = ?',
            [newCredits, now, userId]
        );

        const updatedUser = await get(
            'SELECT id, credits FROM users WHERE id = ?',
            [userId]
        );

        res.json({ credits: updatedUser.credits });
    } catch (error) {
        console.error('Error modifying credits:', error);
        res.status(500).json({ error: 'Failed to modify credits' });
    }
});

// POST /api/users/:id/credits/use - Utiliser des crédits
router.post('/:id/credits/use',
    checkOwnership,
    validatePositiveNumber('amount'),
    async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { amount } = req.body;

        console.log('💰 POST /users/:id/credits/use - User:', userId, 'Amount:', amount);

        const user = await get(
            'SELECT id, credits FROM users WHERE id = ?',
            [userId]
        );

        console.log('💰 Current credits:', user ? user.credits : 'NOT FOUND');

        if (!user || user.credits < amount) {
            console.error('❌ Insufficient credits:', user?.credits, '<', amount);
            return res.status(400).json({ error: 'Insufficient credits' });
        }

        // Calculer les nouveaux crédits et s'assurer qu'ils ne descendent jamais en dessous de 0
        const newCredits = Math.max(0, user.credits - amount);
        console.log('💰 New credits will be:', newCredits);

        await run(
            'UPDATE users SET credits = ? WHERE id = ?',
            [newCredits, userId]
        );

        const updated = await get(
            'SELECT id, credits FROM users WHERE id = ?',
            [userId]
        );

        console.log('✅ Credits updated successfully:', updated.credits);
        res.json({ credits: updated.credits });
    } catch (error) {
        console.error('❌ Error using credits:', error);
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

        // S'assurer que JSON.stringify ne retourne jamais undefined
        const exerciseStr = exercise !== undefined ? JSON.stringify(exercise) : null;
        const answersStr = user_answers !== undefined ? JSON.stringify(user_answers) : null;

        await run(
            `INSERT INTO operation_attempts
             (user_id, operation_type, exercise, user_answers, success, cards_earned, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                operation_type || null,
                exerciseStr,
                answersStr,
                success ? 1 : 0,
                cards_earned || 0,
                DBHelpers.now()
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

// PUT /api/users/:id/password - Changer le mot de passe
router.put('/:id/password',
    checkOwnership,
    validateRequired(['current_password', 'new_password']),
    async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { current_password, new_password } = req.body;

        if (new_password.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        // Récupérer l'utilisateur
        const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Vérifier le mot de passe actuel
        const isValid = await bcrypt.compare(current_password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Mettre à jour le mot de passe
        await run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// GET /api/users/:id/themes - Récupérer les thèmes sélectionnés par l'utilisateur
router.get('/:id/themes', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        const themes = await all(
            `SELECT ct.*
             FROM user_themes ut
             JOIN card_themes ct ON ut.theme_slug = ct.slug
             WHERE ut.user_id = ?
             ORDER BY ct.name`,
            [userId]
        );

        res.json(themes);
    } catch (error) {
        console.error('Error fetching user themes:', error);
        res.status(500).json({ error: 'Failed to fetch user themes' });
    }
});

// POST /api/users/:id/themes - Ajouter/remplacer les thèmes d'un utilisateur
router.post('/:id/themes',
    checkOwnership,
    validateThemes,
    async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { theme_slugs } = req.body;

        // Vérifier que tous les thèmes existent
        const allThemes = await all('SELECT slug FROM card_themes');
        const validSlugs = allThemes.map(t => t.slug);
        const invalidSlugs = theme_slugs.filter(slug => !validSlugs.includes(slug));

        if (invalidSlugs.length > 0) {
            return res.status(400).json({ error: `Invalid theme slugs: ${invalidSlugs.join(', ')}` });
        }

        // Supprimer les anciens thèmes
        await run('DELETE FROM user_themes WHERE user_id = ?', [userId]);

        // Ajouter les nouveaux thèmes avec batch INSERT
        const now = DBHelpers.now();
        const { placeholders, values } = DBHelpers.buildBatchInsert(
            theme_slugs.map(slug => ({ user_id: userId, theme_slug: slug, created_at: now })),
            ['user_id', 'theme_slug', 'created_at']
        );
        await run(
            `INSERT INTO user_themes (user_id, theme_slug, created_at) VALUES ${placeholders}`,
            values
        );

        res.json({ success: true, message: 'Themes updated successfully' });
    } catch (error) {
        console.error('Error updating user themes:', error);
        res.status(500).json({ error: 'Failed to update user themes' });
    }
});

// GET /api/users/:id/themes/stats - Récupérer les stats de cartes par thème
router.get('/:id/themes/stats', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        const stats = await all(
            `SELECT c.category as theme_slug, COUNT(DISTINCT uc.card_id) as card_count
             FROM user_cards uc
             JOIN cards c ON uc.card_id = c.id
             WHERE uc.user_id = ?
             GROUP BY c.category`,
            [userId]
        );

        res.json(stats);
    } catch (error) {
        console.error('Error fetching theme stats:', error);
        res.status(500).json({ error: 'Failed to fetch theme stats' });
    }
});

// PUT /api/users/:id/themes - Mettre à jour les thèmes sélectionnés (remplace tout)
router.put('/:id/themes',
    checkOwnership,
    validateThemes,
    async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { theme_slugs } = req.body;

        // Vérifier que tous les slugs existent
        const allThemes = await all('SELECT slug FROM card_themes');
        const validSlugs = allThemes.map(t => t.slug);

        for (const slug of theme_slugs) {
            if (!validSlugs.includes(slug)) {
                return res.status(400).json({ error: `Theme "${slug}" does not exist` });
            }
        }

        // Supprimer tous les thèmes existants
        await run('DELETE FROM user_themes WHERE user_id = ?', [userId]);

        // Ajouter les nouveaux thèmes avec batch INSERT
        const now = DBHelpers.now();
        const { placeholders, values } = DBHelpers.buildBatchInsert(
            theme_slugs.map(slug => ({ user_id: userId, theme_slug: slug, created_at: now })),
            ['user_id', 'theme_slug', 'created_at']
        );
        await run(
            `INSERT INTO user_themes (user_id, theme_slug, created_at) VALUES ${placeholders}`,
            values
        );

        // Retourner les thèmes actualisés
        const updatedThemes = await all(
            `SELECT ct.*
             FROM user_themes ut
             JOIN card_themes ct ON ut.theme_slug = ct.slug
             WHERE ut.user_id = ?
             ORDER BY ct.name`,
            [userId]
        );

        res.json(updatedThemes);
    } catch (error) {
        console.error('Error updating user themes:', error);
        res.status(500).json({ error: 'Failed to update user themes' });
    }
});

// POST /api/users/:id/daily-cards - Récupère les cartes quotidiennes automatiques
router.post('/:id/daily-cards', checkOwnership, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        const DAILY_CARDS = 5;

        // Récupère l'utilisateur
        const user = await get('SELECT id, last_daily_cards FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Première connexion : marque la date mais ne donne rien
        if (!user.last_daily_cards) {
            await run('UPDATE users SET last_daily_cards = ? WHERE id = ?', [today, userId]);

            // Log l'action
            await run(
                `INSERT INTO user_activity_logs (user_id, action_type, details, created_at)
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [userId, 'daily_cards', JSON.stringify({ firstConnection: true, cards: 0 })]
            );

            return res.json({
                success: false,
                message: 'Première connexion - cartes quotidiennes disponibles demain',
                cardsGiven: 0,
                daysAwarded: 0
            });
        }

        // Même jour = déjà réclamé
        if (user.last_daily_cards === today) {
            return res.json({
                success: false,
                message: 'Cartes quotidiennes déjà réclamées aujourd\'hui',
                cardsGiven: 0,
                daysAwarded: 0
            });
        }

        // Calcule le nombre de jours d'absence
        const lastDate = new Date(user.last_daily_cards);
        const currentDate = new Date(today);
        const daysDifference = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

        // Donne 5 cartes par jour d'absence
        const cardsToGive = daysDifference * DAILY_CARDS;

        // Récupère les crédits actuels
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + cardsToGive;

        // Met à jour les crédits
        await run('UPDATE users SET credits = ? WHERE id = ?', [newCredits, userId]);

        // Met à jour la date de dernière réclamation
        await run('UPDATE users SET last_daily_cards = ? WHERE id = ?', [today, userId]);

        // Log l'action
        await run(
            `INSERT INTO user_activity_logs (user_id, action_type, details, created_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [userId, 'daily_cards', JSON.stringify({
                daysAwarded: daysDifference,
                cardsGiven: cardsToGive,
                previousCredits: currentCredits,
                newCredits: newCredits
            })]
        );

        const dayText = daysDifference === 1 ? 'jour' : 'jours';
        const cardText = cardsToGive === 1 ? 'carte' : 'cartes';

        res.json({
            success: true,
            cardsGiven: cardsToGive,
            daysAwarded: daysDifference,
            totalCredits: newCredits,
            message: daysDifference === 1
                ? `+${cardsToGive} ${cardText} quotidienne !`
                : `+${cardsToGive} ${cardText} pour ${daysDifference} ${dayText} d'absence !`
        });
    } catch (error) {
        console.error('Error claiming daily cards:', error);
        res.status(500).json({ error: 'Failed to claim daily cards' });
    }
});

module.exports = router;
