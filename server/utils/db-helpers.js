const { get, run } = require('../turso-db');

/**
 * Helpers pour faciliter les opérations SQL courantes et éviter la duplication
 */
class DBHelpers {
    /**
     * Construit une clause IN avec des placeholders
     * @param {Array} array - Tableau de valeurs
     * @returns {string} - Placeholders séparés par des virgules (ex: "?, ?, ?")
     *
     * @example
     * const ids = [1, 2, 3];
     * const placeholders = DBHelpers.buildInClause(ids);
     * // placeholders = "?, ?, ?"
     * query(`SELECT * FROM users WHERE id IN (${placeholders})`, ids);
     */
    static buildInClause(array) {
        if (!Array.isArray(array) || array.length === 0) {
            throw new Error('buildInClause requires a non-empty array');
        }
        return array.map(() => '?').join(',');
    }

    /**
     * Construit un batch INSERT avec placeholders et valeurs aplaties
     * @param {Array} items - Tableau d'objets à insérer
     * @param {Array} columns - Noms des colonnes dans l'ordre
     * @returns {Object} - { placeholders, values }
     *
     * @example
     * const items = [
     *   { user_id: 1, theme_slug: 'space', created_at: '2024-01-01' },
     *   { user_id: 1, theme_slug: 'dinos', created_at: '2024-01-01' }
     * ];
     * const { placeholders, values } = DBHelpers.buildBatchInsert(items, ['user_id', 'theme_slug', 'created_at']);
     * // placeholders = "(?, ?, ?), (?, ?, ?)"
     * // values = [1, 'space', '2024-01-01', 1, 'dinos', '2024-01-01']
     * run(`INSERT INTO user_themes (user_id, theme_slug, created_at) VALUES ${placeholders}`, values);
     */
    static buildBatchInsert(items, columns) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('buildBatchInsert requires a non-empty array of items');
        }
        if (!Array.isArray(columns) || columns.length === 0) {
            throw new Error('buildBatchInsert requires a non-empty array of columns');
        }

        const placeholders = items
            .map(() => `(${columns.map(() => '?').join(',')})`)
            .join(',');

        const values = items.flatMap(item =>
            columns.map(col => item[col])
        );

        return { placeholders, values };
    }

    /**
     * Retourne les timestamps de début et fin pour "aujourd'hui"
     * Permet d'utiliser des range comparisons au lieu de DATE()
     * @returns {Object} - { start, end }
     *
     * @example
     * const { start, end } = DBHelpers.getTodayRange();
     * query(
     *   'SELECT * FROM logs WHERE created_at >= ? AND created_at <= ?',
     *   [start, end]
     * );
     */
    static getTodayRange() {
        const today = new Date();
        return {
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString(),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString()
        };
    }

    /**
     * Récupère un utilisateur par ID ou lance une erreur 404
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} - Utilisateur
     * @throws {Object} - { status: 404, error: 'User not found' }
     *
     * @example
     * try {
     *   const user = await DBHelpers.getUserOrFail(userId);
     *   // ... utiliser user
     * } catch (err) {
     *   return res.status(err.status).json({ error: err.error });
     * }
     */
    static async getUserOrFail(userId) {
        const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            throw { status: 404, error: 'User not found' };
        }
        return user;
    }

    /**
     * Récupère une carte par ID ou lance une erreur 404
     * @param {number} cardId - ID de la carte
     * @returns {Promise<Object>} - Carte
     * @throws {Object} - { status: 404, error: 'Card not found' }
     */
    static async getCardOrFail(cardId) {
        const card = await get('SELECT * FROM cards WHERE id = ?', [cardId]);
        if (!card) {
            throw { status: 404, error: 'Card not found' };
        }
        return card;
    }

    /**
     * Retourne un timestamp ISO actuel
     * @returns {string} - Timestamp au format ISO
     *
     * @example
     * const now = DBHelpers.now();
     * run('INSERT INTO logs (message, created_at) VALUES (?, ?)', ['test', now]);
     */
    static now() {
        return new Date().toISOString();
    }

    /**
     * Ajoute des crédits à un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @param {number} amount - Montant à ajouter
     * @returns {Promise<void>}
     *
     * @example
     * await DBHelpers.addCredits(userId, 5);
     */
    static async addCredits(userId, amount) {
        if (!userId || amount <= 0) {
            throw new Error('Invalid userId or amount');
        }
        await run(
            'UPDATE users SET credits = credits + ? WHERE id = ?',
            [amount, userId]
        );
    }

    /**
     * Construit une clause WHERE dynamique avec des conditions
     * @param {Object} conditions - Objet avec les conditions { field: value, ... }
     * @returns {Object} - { whereClause, values }
     *
     * @example
     * const conditions = { user_id: 1, status: 'active' };
     * const { whereClause, values } = DBHelpers.buildWhereClause(conditions);
     * // whereClause = "user_id = ? AND status = ?"
     * // values = [1, 'active']
     * query(`SELECT * FROM table WHERE ${whereClause}`, values);
     */
    static buildWhereClause(conditions) {
        const keys = Object.keys(conditions).filter(key => conditions[key] !== undefined);
        if (keys.length === 0) {
            return { whereClause: '1=1', values: [] };
        }

        const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
        const values = keys.map(key => conditions[key]);

        return { whereClause, values };
    }
}

module.exports = DBHelpers;
