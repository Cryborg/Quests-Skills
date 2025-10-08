const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Détecter l'environnement via APP_ENV (local ou production)
const isProduction = process.env.APP_ENV === 'production';
const isLocal = !isProduction;

// Utiliser Turso en production, SQLite local en dev
const dbUrl = isProduction
    ? process.env.TURSO_DATABASE_URL
    : 'file:./database/dev.db';

const dbConfig = {
    url: dbUrl
};

// Ajouter le token seulement en production
if (isProduction && process.env.TURSO_AUTH_TOKEN) {
    dbConfig.authToken = process.env.TURSO_AUTH_TOKEN;
}

console.log(`💾 Using database: ${isProduction ? `Turso (${dbUrl})` : 'SQLite (local dev)'}`);
if (isProduction) {
    console.log(`🔑 Auth token present: ${!!process.env.TURSO_AUTH_TOKEN}`);
}

// Create database client
const db = createClient(dbConfig);

// Helper function to execute SQL queries
async function query(sql, args = []) {
    try {
        const result = await db.execute({ sql, args });
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Helper function to get a single row
async function get(sql, args = []) {
    const result = await query(sql, args);
    return result.rows[0] || null;
}

// Helper function to get all rows
async function all(sql, args = []) {
    const result = await query(sql, args);
    return result.rows;
}

// Helper function to run INSERT/UPDATE/DELETE
async function run(sql, args = []) {
    return await query(sql, args);
}

module.exports = {
    db,
    query,
    get,
    all,
    run
};
