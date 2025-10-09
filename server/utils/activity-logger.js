const { run } = require('../turso-db');
const { runMigrations } = require('../../database/migrate');

/**
 * Logger d'activité utilisateur
 * Types d'actions disponibles:
 * - 'login' : Connexion
 * - 'draw_cards' : Tirage de cartes
 * - 'game_played' : Partie jouée
 * - 'credits_earned' : Crédits gagnés
 * - 'credits_spent' : Crédits dépensés
 */

let migrationAttempted = false;

async function logActivity(userId, actionType, details = null) {
    try {
        const now = new Date().toISOString();
        const detailsJson = details ? JSON.stringify(details) : null;

        await run(
            'INSERT INTO user_activity_logs (user_id, action_type, details, created_at) VALUES (?, ?, ?, ?)',
            [userId, actionType, detailsJson, now]
        );
    } catch (error) {
        // Si la table n'existe pas et qu'on n'a pas encore tenté de migration
        if (error.message?.includes('no such table') && !migrationAttempted) {
            console.log('⚠️  Activity table missing, running migrations...');
            migrationAttempted = true;

            try {
                await runMigrations();
                // Réessayer après migration
                await run(
                    'INSERT INTO user_activity_logs (user_id, action_type, details, created_at) VALUES (?, ?, ?, ?)',
                    [userId, actionType, detailsJson, new Date().toISOString()]
                );
            } catch (retryError) {
                console.error('Failed to log activity after migration:', retryError);
            }
        } else {
            console.error('Failed to log activity:', error);
        }
        // Ne pas faire planter l'application si le log échoue
    }
}

module.exports = {
    logActivity
};
