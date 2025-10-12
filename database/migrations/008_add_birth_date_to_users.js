const { query } = require('../../server/turso-db');

/**
 * Migration: Add birth_date column to users table
 * Created: 2025-10-12
 */

async function up() {
    console.log('Running migration: 008_add_birth_date_to_users');

    // Add birth_date column to users table (format: YYYY-MM-DD)
    await query(`
        ALTER TABLE users
        ADD COLUMN birth_date TEXT
    `);
    console.log('  ✓ birth_date column added to users table');

    console.log('✅ Migration 008_add_birth_date_to_users completed');
}

async function down() {
    console.log('Rolling back migration: 008_add_birth_date_to_users');

    // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    // For simplicity in rollback, we'll just warn - in production you'd want to backup and recreate
    console.log('⚠️  Warning: SQLite doesn\'t support DROP COLUMN. Manual intervention required for rollback.');

    console.log('✅ Migration 008_add_birth_date_to_users rollback noted');
}

module.exports = { up, down };
