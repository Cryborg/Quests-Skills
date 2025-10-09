const { run } = require('../turso-db');

/**
 * Logger d'activité utilisateur
 * Types d'actions disponibles:
 * - 'login' : Connexion
 * - 'draw_cards' : Tirage de cartes
 * - 'game_played' : Partie jouée
 * - 'credits_earned' : Crédits gagnés
 * - 'credits_spent' : Crédits dépensés
 */

async function logActivity(userId, actionType, details = null) {
    try {
        const now = new Date().toISOString();
        const detailsJson = details ? JSON.stringify(details) : null;

        await run(
            'INSERT INTO user_activity_logs (user_id, action_type, details, created_at) VALUES (?, ?, ?, ?)',
            [userId, actionType, detailsJson, now]
        );
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Ne pas faire planter l'application si le log échoue
    }
}

module.exports = {
    logActivity
};
