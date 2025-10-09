const { query } = require('../../server/turso-db');

/**
 * Migration: Add user_activity_logs table
 * Created: 2025-10-09
 */

async function up() {
    console.log('Running migration: 001_add_user_activity_logs');

    // Create user_activity_logs table
    await query(`
        CREATE TABLE IF NOT EXISTS user_activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action_type TEXT NOT NULL,
            details TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);
    console.log('  ✓ user_activity_logs table created');

    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON user_activity_logs(action_type)');
    console.log('  ✓ Indexes created');

    console.log('✅ Migration 001_add_user_activity_logs completed');
}

async function down() {
    console.log('Rolling back migration: 001_add_user_activity_logs');

    await query('DROP INDEX IF EXISTS idx_user_activity_logs_action_type');
    await query('DROP INDEX IF EXISTS idx_user_activity_logs_created_at');
    await query('DROP INDEX IF EXISTS idx_user_activity_logs_user_id');
    await query('DROP TABLE IF EXISTS user_activity_logs');

    console.log('✅ Migration 001_add_user_activity_logs rolled back');
}

module.exports = { up, down };
