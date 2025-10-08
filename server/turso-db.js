const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

// Load environment variables
if (!process.env.TURSO_DATABASE_URL) {
    dotenv.config();
}

// Détecter l'environnement - si TURSO_DATABASE_URL existe, on utilise Turso
const useTurso = !!process.env.TURSO_DATABASE_URL;

// Utiliser Turso si configuré, sinon SQLite local en dev
const dbUrl = useTurso
    ? process.env.TURSO_DATABASE_URL
    : 'file:./database/dev.db';

const dbConfig = {
    url: dbUrl
};

// Ajouter le token seulement si on utilise Turso
if (useTurso && process.env.TURSO_AUTH_TOKEN) {
    dbConfig.authToken = process.env.TURSO_AUTH_TOKEN;
}

console.log(`💾 Using database: ${useTurso ? `Turso (${dbUrl})` : 'SQLite (local dev)'}`);
console.log(`🔑 Auth token present: ${!!process.env.TURSO_AUTH_TOKEN}`);

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
