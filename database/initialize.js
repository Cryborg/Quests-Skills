const { query } = require('../server/turso-db');
const { initialize } = require('./initialize/index');
const fs = require('fs');
const path = require('path');

// Variable pour éviter les initialisations répétées
let databaseInitialized = false;

// Détecter l'environnement
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

/**
 * Initialisation complète de la base de données
 * Crée les tables et seed les données initiales
 */
async function initializeDatabase() {
    if (databaseInitialized) {
        console.log('✅ Database already initialized in this process');
        return;
    }

    try {
        // Créer le répertoire database/ en dev si nécessaire
        if (!isProduction) {
            const dbDir = path.join(process.cwd(), 'database');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, {recursive: true});
                console.log('📁 Created database directory');
            }
        }

        // Lancer l'initialisation modulaire
        await initialize();

        databaseInitialized = true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

/**
 * Vérification légère de l'existence de la base
 * Utilisée par les routes API
 */
async function ensureDatabaseExists() {
    if (databaseInitialized) {
        return;
    }

    try {
        // Tester si les tables principales existent
        const result = await query(
            "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name IN ('users', 'cards', 'user_credits', 'card_themes', 'user_themes', 'word_search_words', 'game_sessions', 'user_activity_logs')"
        );
        const tableCount = result.rows[0]?.count || 0;

        console.log(`📊 Found ${tableCount}/8 required tables`);

        if (tableCount < 8) {
            console.log('⚠️  Missing core tables, initializing database...');
            await initializeDatabase();
        } else {
            console.log('✅ Database tables verified (8/8)');

            // En production, toujours exécuter le seeding partiel (thèmes + mots)
            // pour s'assurer que les nouvelles définitions sont ajoutées
            if (isProduction) {
                console.log('🌱 Running partial seeding (themes + words)...');
                const { seedInitialData } = require('./initialize/index');
                await seedInitialData();
            }

            databaseInitialized = true;
        }
    } catch (error) {
        console.log('⚠️  Database check failed, attempting initialization...');
        console.error('Check error:', error);
        try {
            await initializeDatabase();
        } catch (initError) {
            console.error('❌ Failed to auto-initialize database:', initError);
            throw new Error('Database not initialized. Please run the initialization script.');
        }
    }
}


module.exports = {
    initializeDatabase,
    ensureDatabaseExists
};
