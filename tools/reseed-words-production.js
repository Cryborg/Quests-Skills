/**
 * Script pour reseeder UNIQUEMENT les mots en production
 * Usage: APP_ENV=production node database/reseed-words-production.js
 */

require('dotenv').config();
const { seedWords } = require('./initialize/seed-words');

async function main() {
    console.log('🔄 Reseeding words in production...');
    console.log(`📍 Database: ${process.env.TURSO_DATABASE_URL}`);

    try {
        await seedWords();
        console.log('✅ Words reseeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to reseed words:', error);
        process.exit(1);
    }
}

main();
