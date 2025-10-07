const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

// Load environment variables
if (!process.env.TURSO_DATABASE_URL) {
    dotenv.config();
}

// Détecter l'environnement
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const isDevelopment = !isProduction;

// Utiliser Turso en prod, SQLite local en dev
const dbUrl = isProduction && process.env.TURSO_DATABASE_URL
    ? process.env.TURSO_DATABASE_URL
    : 'file:./database/dev.db';

const dbConfig = {
    url: dbUrl
};

// Ajouter le token seulement si on utilise Turso
if (isProduction && process.env.TURSO_AUTH_TOKEN) {
    dbConfig.authToken = process.env.TURSO_AUTH_TOKEN;
}

console.log(`💾 Using database: ${isProduction ? 'Turso (production)' : 'SQLite (local dev)'}`);

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
