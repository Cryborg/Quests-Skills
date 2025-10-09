const { createTables, createIndexes } = require('./schemas');
const { seedThemes } = require('./seed-themes');
const { seedAdmin } = require('./seed-admin');
const { seedCards } = require('./seed-cards');
const { seedBonusOperations } = require('./seed-bonus-operations');
const { seedWords } = require('./seed-words');

/**
 * Seed des données initiales
 * Orchestre tous les seeders dans le bon ordre
 */
async function seedInitialData() {
    console.log('🌱 Seeding initial data...');

    // 1. Seed Card Themes (obligatoire en premier car référencé par d'autres tables)
    const themes = await seedThemes();

    // 2. Seed Admin User (dépend de themes pour user_themes)
    await seedAdmin(themes);

    // 3. Seed Cards (indépendant)
    await seedCards();

    // 4. Seed Bonus Operations (indépendant)
    await seedBonusOperations();

    // 5. Seed Word Search Words (dépend de themes)
    await seedWords();

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
