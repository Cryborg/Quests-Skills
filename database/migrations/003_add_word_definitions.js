const { query } = require('../../server/turso-db');

/**
 * Migration: Add definition column to word_search_words
 * Created: 2025-10-10
 */

async function up() {
    console.log('Running migration: 003_add_word_definitions');

    // Add definition column
    await query(`
        ALTER TABLE word_search_words ADD COLUMN definition TEXT
    `);
    console.log('  ✓ definition column added to word_search_words');

    console.log('✅ Migration 003_add_word_definitions completed');
}

async function down() {
    console.log('Rolling back migration: 003_add_word_definitions');

    // SQLite doesn't support DROP COLUMN, so we need to recreate the table
    await query(`
        CREATE TABLE word_search_words_backup AS
        SELECT id, theme_slug, word, created_at
        FROM word_search_words
    `);

    await query('DROP TABLE word_search_words');

    await query(`
        CREATE TABLE word_search_words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            theme_slug TEXT NOT NULL,
            word TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (theme_slug) REFERENCES card_themes(slug) ON DELETE CASCADE
        )
    `);

    await query(`
        INSERT INTO word_search_words (id, theme_slug, word, created_at)
        SELECT id, theme_slug, word, created_at
        FROM word_search_words_backup
    `);

    await query('DROP TABLE word_search_words_backup');

    console.log('✅ Migration 003_add_word_definitions rolled back');
}

module.exports = { up, down };
