/**
 * Script pour reseeder UNIQUEMENT les cartes en production
 * Usage: APP_ENV=production node tools/reseed-cards-production.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { seedCards } = require('../database/initialize/seed-cards');

async function main() {
    console.log('🔄 Reseeding cards in production...');
    console.log(`📍 Database: ${process.env.TURSO_DATABASE_URL}`);

    try {
        await seedCards();
        console.log('✅ Cards reseeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to reseed cards:', error);
        process.exit(1);
    }
}

main();
