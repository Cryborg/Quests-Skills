/**
 * Middlewares de validation pour éviter la duplication de code
 */

/**
 * Valide que certains champs sont présents dans req.body
 * @param {string[]} fields - Liste des champs requis
 * @returns {Function} Middleware Express
 *
 * @example
 * router.post('/cards',
 *   authenticateToken,
 *   validateRequired(['name', 'description', 'base_rarity']),
 *   async (req, res) => { ... }
 * );
 */
const validateRequired = (fields) => {
    return (req, res, next) => {
        if (!Array.isArray(fields) || fields.length === 0) {
            return next(new Error('validateRequired: fields must be a non-empty array'));
        }

        const missing = fields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || value === '';
        });

        if (missing.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missing.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Valide que la rareté est valide
 * Vérifie req.body.base_rarity ou req.body.rarity
 * @returns {Function} Middleware Express
 *
 * @example
 * router.post('/cards',
 *   authenticateToken,
 *   validateRarity,
 *   async (req, res) => { ... }
 * );
 */
const validateRarity = (req, res, next) => {
    const validRarities = ['common', 'rare', 'very_rare', 'epic', 'legendary'];
    const rarity = req.body.base_rarity || req.body.rarity;

    if (rarity && !validRarities.includes(rarity)) {
        return res.status(400).json({
            error: `Invalid rarity. Must be one of: ${validRarities.join(', ')}`
        });
    }

    next();
};

/**
 * Valide qu'un tableau de theme_slugs est présent et valide
 * Vérifie que c'est un tableau de 3 à 10 éléments
 * @returns {Function} Middleware Express
 *
 * @example
 * router.post('/register',
 *   validateThemes,
 *   async (req, res) => { ... }
 * );
 */
const validateThemes = (req, res, next) => {
    const { theme_slugs } = req.body;

    if (!Array.isArray(theme_slugs)) {
        return res.status(400).json({
            error: 'theme_slugs must be an array'
        });
    }

    if (theme_slugs.length < 3 || theme_slugs.length > 10) {
        return res.status(400).json({
            error: 'You must select between 3 and 10 themes'
        });
    }

    next();
};

/**
 * Valide qu'un email est présent et a un format valide
 * @returns {Function} Middleware Express
 *
 * @example
 * router.post('/register',
 *   validateEmail,
 *   async (req, res) => { ... }
 * );
 */
const validateEmail = (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    next();
};

/**
 * Valide qu'un mot pour word-search est valide
 * - Entre 3 et 15 caractères
 * - Uniquement des lettres (avec accents)
 * @returns {Function} Middleware Express
 */
const validateWord = (req, res, next) => {
    const { word } = req.body;

    if (!word) {
        return res.status(400).json({ error: 'Word is required' });
    }

    const cleanWord = word.toUpperCase().trim();

    if (cleanWord.length < 3 || cleanWord.length > 15) {
        return res.status(400).json({
            error: 'Word must be between 3 and 15 characters'
        });
    }

    if (!/^[A-ZÀ-ÿ\s]+$/.test(cleanWord)) {
        return res.status(400).json({
            error: 'Word must contain only letters'
        });
    }

    // Ajouter le mot nettoyé pour éviter de le recalculer
    req.cleanWord = cleanWord;
    next();
};

/**
 * Valide que l'utilisateur accède à ses propres données
 * Vérifie req.params.userId contre req.user.id
 * Les admins peuvent accéder aux données de tous les utilisateurs
 * @returns {Function} Middleware Express
 *
 * @example
 * router.get('/users/:userId/cards',
 *   authenticateToken,
 *   validateOwnership,
 *   async (req, res) => { ... }
 * );
 */
const validateOwnership = (req, res, next) => {
    const { userId } = req.params;

    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    if (parseInt(userId) !== req.user.id && !req.user.is_admin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    next();
};

/**
 * Valide qu'un nombre positif est présent
 * @param {string} fieldName - Nom du champ à valider
 * @returns {Function} Middleware Express
 *
 * @example
 * router.post('/credits',
 *   validatePositiveNumber('amount'),
 *   async (req, res) => { ... }
 * );
 */
const validatePositiveNumber = (fieldName) => {
    return (req, res, next) => {
        const value = req.body[fieldName];

        if (value === undefined || value === null) {
            return res.status(400).json({
                error: `${fieldName} is required`
            });
        }

        const num = Number(value);
        if (isNaN(num) || num <= 0) {
            return res.status(400).json({
                error: `${fieldName} must be a positive number`
            });
        }

        next();
    };
};

/**
 * Valide qu'une image path est présente et a une extension valide
 * @returns {Function} Middleware Express
 */
const validateImage = (req, res, next) => {
    const { image } = req.body;

    if (!image) {
        return res.status(400).json({ error: 'Image is required' });
    }

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const hasValidExtension = validExtensions.some(ext => image.toLowerCase().endsWith(ext));

    if (!hasValidExtension) {
        return res.status(400).json({
            error: `Invalid image format. Must be one of: ${validExtensions.join(', ')}`
        });
    }

    next();
};

module.exports = {
    validateRequired,
    validateRarity,
    validateThemes,
    validateEmail,
    validateWord,
    validateOwnership,
    validatePositiveNumber,
    validateImage
};
