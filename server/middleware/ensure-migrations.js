const { runMigrations } = require('../../database/migrate');

let migrationsRun = false;
let migrationPromise = null;

/**
 * Middleware qui s'assure que les migrations ont été exécutées
 * avant de traiter toute requête API.
 *
 * Exécute les migrations une seule fois au premier appel,
 * puis laisse passer toutes les requêtes suivantes.
 */
async function ensureMigrations(req, res, next) {
    // Si les migrations ont déjà été exécutées, continuer
    if (migrationsRun) {
        return next();
    }

    // Si une migration est déjà en cours, attendre qu'elle se termine
    if (migrationPromise) {
        try {
            await migrationPromise;
            return next();
        } catch (error) {
            console.error('Migration failed:', error);
            return res.status(503).json({
                error: 'Database migration in progress, please retry'
            });
        }
    }

    // Lancer les migrations
    migrationPromise = runMigrations()
        .then(() => {
            migrationsRun = true;
            migrationPromise = null;
        })
        .catch(error => {
            console.error('Migration failed:', error);
            migrationPromise = null;
            throw error;
        });

    try {
        await migrationPromise;
        next();
    } catch (error) {
        res.status(503).json({
            error: 'Database migration failed',
            details: error.message
        });
    }
}

module.exports = ensureMigrations;
