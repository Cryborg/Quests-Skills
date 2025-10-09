/**
 * Script pour reseeder UNIQUEMENT les mots en production
 * Usage: APP_ENV=production node tools/reseed-words-production.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { seedWords } = require('../database/initialize/seed-words');

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
