const { get } = require('../turso-db');
const { logActivity } = require('../utils/activity-logger');
const { authenticateToken } = require('./auth');

/**
 * Middleware qui track automatiquement la première activité du jour comme un "login"
 * Permet de capturer les connexions même si l'utilisateur utilise un JWT persistant
 *
 * IMPORTANT: Ce middleware doit être appliqué APRÈS authenticateToken
 * Il vérifie si req.user existe (injecté par authenticateToken)
 */
async function trackDailyLogin(req, res, next) {
    // Uniquement pour les requêtes authentifiées
    // Si pas de req.user, on passe sans faire de tracking (routes publiques)
    if (!req.user || !req.user.id) {
        return next();
    }

    try {
        // Vérifier si l'utilisateur a déjà un log de login aujourd'hui
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        const existingLogin = await get(
            `SELECT id FROM user_activity_logs
             WHERE user_id = ?
             AND action_type = 'login'
             AND created_at >= ?
             AND created_at <= ?
             LIMIT 1`,
            [req.user.id, todayStart, todayEnd]
        );

        // Si pas de login aujourd'hui, créer un log
        if (!existingLogin) {
            await logActivity(req.user.id, 'login', {
                source: 'auto_tracked',
                ip: req.ip,
                userAgent: req.get('user-agent')
            });
        }
    } catch (error) {
        // Ne pas bloquer la requête si le tracking échoue
        console.error('Failed to track daily login:', error);
    }

    next();
}

/**
 * Middleware combiné: authentifie ET track le login quotidien
 * Équivalent à: authenticateToken + trackDailyLogin
 */
function authenticateAndTrack(req, res, next) {
    authenticateToken(req, res, (err) => {
        if (err) return next(err);
        trackDailyLogin(req, res, next);
    });
}

module.exports = {
    trackDailyLogin,
    authenticateAndTrack
};
