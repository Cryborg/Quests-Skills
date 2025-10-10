const { runMigrations } = require('../../database/migrate');
const { seedInitialData } = require('../../database/initialize/index');

let migrationsRun = false;
let migrationPromise = null;

/**
 * Middleware qui s'assure que les migrations et le seeding ont été exécutés
 * avant de traiter toute requête API.
 *
 * Exécute les migrations et seeding une seule fois au premier appel,
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

    // Lancer les migrations puis le seeding (optionnel)
    migrationPromise = runMigrations()
        .then(async () => {
            // Seeding uniquement si ENABLE_AUTO_SEED=true en production
            const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
            const enableAutoSeed = process.env.ENABLE_AUTO_SEED === 'true';

            if (!isProduction || enableAutoSeed) {
                console.log('🌱 Running initial data seeding...');
                await seedInitialData();
            } else {
                console.log('⏭️  Auto-seeding disabled in production (set ENABLE_AUTO_SEED=true to enable)');
            }

            migrationsRun = true;
            migrationPromise = null;
        })
        .catch(error => {
            console.error('Migration/Seeding failed:', error);
            migrationPromise = null;
            throw error;
        });

    try {
        await migrationPromise;
        next();
    } catch (error) {
        res.status(503).json({
            error: 'Database initialization failed',
            details: error.message
        });
    }
}

module.exports = ensureMigrations;
