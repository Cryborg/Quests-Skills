const { query } = require('../../server/turso-db');

/**
 * Migration: Create game_ratings table
 * Created: 2025-10-12
 *
 * Cette table stocke les notations des jeux par les utilisateurs
 * - interest_rating: note de 1 à 5 étoiles pour l'intérêt du jeu
 * - difficulty_rating: note de 1 à 5 étoiles pour la difficulté
 */

async function up() {
    console.log('Running migration: 009_create_game_ratings');

    // Create game_ratings table
    await query(`
        CREATE TABLE IF NOT EXISTS game_ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            game_type TEXT NOT NULL,
            interest_rating INTEGER NOT NULL CHECK(interest_rating >= 1 AND interest_rating <= 5),
            difficulty_rating INTEGER NOT NULL CHECK(difficulty_rating >= 1 AND difficulty_rating <= 5),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(user_id, game_type)
        )
    `);
    console.log('  ✓ game_ratings table created');

    // Create indexes for better query performance
    await query('CREATE INDEX IF NOT EXISTS idx_game_ratings_user_id ON game_ratings(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_game_ratings_game_type ON game_ratings(game_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_game_ratings_created_at ON game_ratings(created_at)');
    console.log('  ✓ Indexes created');

    console.log('✅ Migration 009_create_game_ratings completed');
}

async function down() {
    console.log('Rolling back migration: 009_create_game_ratings');

    await query('DROP INDEX IF EXISTS idx_game_ratings_created_at');
    await query('DROP INDEX IF EXISTS idx_game_ratings_game_type');
    await query('DROP INDEX IF EXISTS idx_game_ratings_user_id');
    await query('DROP TABLE IF EXISTS game_ratings');

    console.log('✅ Migration 009_create_game_ratings rolled back');
}

module.exports = { up, down };
