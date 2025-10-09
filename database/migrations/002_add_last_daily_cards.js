const { query } = require('../../server/turso-db');

/**
 * Migration: Add last_daily_cards field to users table
 * Created: 2025-10-09
 */

async function up() {
    console.log('Running migration: 002_add_last_daily_cards');

    try {
        // Tente d'ajouter la colonne (ignore l'erreur si elle existe déjà)
        await query(`
            ALTER TABLE users
            ADD COLUMN last_daily_cards TEXT
        `);
        console.log('  ✓ last_daily_cards column added');
    } catch (alterError) {
        if (alterError.message && alterError.message.includes('duplicate column')) {
            console.log('  ℹ️  last_daily_cards column already exists');
        } else {
            throw alterError;
        }
    }

    console.log('✅ Migration 002_add_last_daily_cards completed');
}

async function down() {
    console.log('Rolling back migration: 002_add_last_daily_cards');

    // SQLite ne supporte pas DROP COLUMN avant la version 3.35.0
    // On ne fait rien pour le rollback
    console.log('  ⚠️  Cannot drop column in SQLite (not supported in older versions)');

    console.log('✅ Migration 002_add_last_daily_cards rolled back (no-op)');
}

module.exports = { up, down };
