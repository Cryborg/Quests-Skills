require('dotenv').config();

const { seedInitialData } = require('./database/initialize/index');

/**
 * Script pour seeder la base de données de production
 * Usage: node seed-production.js
 */
async function main() {
    console.log('🚀 Starting production seeding...');
    console.log('📊 Environment:', process.env.APP_ENV || 'production');

    try {
        await seedInitialData();
        console.log('✅ Production seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Production seeding failed:', error);
        process.exit(1);
    }
}

main();
