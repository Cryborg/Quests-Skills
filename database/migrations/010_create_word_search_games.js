const { query } = require('../../server/turso-db');

/**
 * Migration: Create word_search_games table
 * Created: 2025-10-13
 *
 * Cette table stocke les parties de mots mêlés en cours
 * Permet de reprendre une partie non terminée
 */

async function up() {
    console.log('Running migration: 010_create_word_search_games');

    // Create word_search_games table
    await query(`
        CREATE TABLE IF NOT EXISTS word_search_games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            grid TEXT NOT NULL,
            words TEXT NOT NULL,
            found_words TEXT NOT NULL,
            timer INTEGER NOT NULL DEFAULT 0,
            hints_used INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);
    console.log('  ✓ word_search_games table created');

    // Create index for better query performance
    await query('CREATE INDEX IF NOT EXISTS idx_word_search_games_user_id ON word_search_games(user_id)');
    console.log('  ✓ Index created');

    console.log('✅ Migration 010_create_word_search_games completed');
}

async function down() {
    console.log('Rolling back migration: 010_create_word_search_games');

    await query('DROP INDEX IF EXISTS idx_word_search_games_user_id');
    await query('DROP TABLE IF EXISTS word_search_games');

    console.log('✅ Migration 010_create_word_search_games rolled back');
}

module.exports = { up, down };
