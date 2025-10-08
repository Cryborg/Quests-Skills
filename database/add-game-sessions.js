const { query } = require('../server/turso-db');

async function addGameSessionsTable() {
    try {
        console.log('🚀 Adding game_sessions table...');

        // Créer la table game_sessions
        await query(`
            CREATE TABLE IF NOT EXISTS game_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                game_type TEXT NOT NULL,
                errors INTEGER DEFAULT 0,
                success INTEGER DEFAULT 0,
                cards_earned INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table game_sessions created');

        // Créer les index
        await query('CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at)');
        await query('CREATE INDEX IF NOT EXISTS idx_game_sessions_type ON game_sessions(game_type)');
        console.log('✅ Indexes created');

        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addGameSessionsTable();
