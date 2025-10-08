#!/usr/bin/env node
/**
 * Script pour forcer l'initialisation de la base de données Turso en production
 * Usage: APP_ENV=production node init-production-db.js
 */

require('dotenv').config();
const { initializeDatabase } = require('./database/initialize');

async function main() {
    console.log('🚀 Starting production database initialization...');
    console.log('Environment:', process.env.APP_ENV || process.env.NODE_ENV || 'development');
    console.log('Database URL:', process.env.TURSO_DATABASE_URL ? 'Set ✓' : 'Missing ✗');
    console.log('Auth Token:', process.env.TURSO_AUTH_TOKEN ? 'Set ✓' : 'Missing ✗');

    try {
        await initializeDatabase();
        console.log('✅ Database initialization completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

main();
