const { createTables, createIndexes } = require('./schemas');
const { seedThemes } = require('./seed-themes');
const { seedAdmin } = require('./seed-admin');
const { seedCards } = require('./seed-cards');
const { seedBonusOperations } = require('./seed-bonus-operations');
const { seedWords } = require('./seed-words');

/**
 * Seed des données initiales
 * Orchestre tous les seeders dans le bon ordre
 *
 * PROTECTION: En production, ne seed QUE si explicitement autorisé via ALLOW_SEED=true
 * EXCEPTION: Les mots et thèmes sont toujours seedés (update uniquement)
 */
async function seedInitialData() {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    const allowSeed = process.env.ALLOW_SEED === 'true';

    console.log('🌱 Seeding initial data...');

    // 1. Seed Card Themes (toujours exécuté, ajoute seulement les nouveaux)
    const themes = await seedThemes();

    // 5. Seed Word Search Words (toujours exécuté, met à jour les définitions)
    await seedWords();

    if (isProduction && !allowSeed) {
        console.log('⚠️  PRODUCTION: Limited seeding (themes + words only). Set ALLOW_SEED=true for full seed.');
        return;
    }

    // 2. Seed Admin User (dépend de themes pour user_themes)
    await seedAdmin(themes);

    // 3. Seed Cards (indépendant)
    await seedCards();

    // 4. Seed Bonus Operations (indépendant)
    await seedBonusOperations();

    console.log('✅ Initial data seeded');
}

/**
 * Initialisation complète de la base de données
 */
async function initialize() {
    try {
        console.log('🚀 Starting database initialization...');

        // 1. Créer les tables
        await createTables();

        // 2. Créer les index
        await createIndexes();

        // 3. Seed les données initiales
        await seedInitialData();

        console.log('✅ Database initialization completed');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

module.exports = {
    initialize,
    createTables,
    createIndexes,
    seedInitialData
};
