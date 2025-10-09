/**
 * Schémas des tables de la base de données
 */

const { query } = require('../../server/turso-db');

async function createTables() {
    console.log('📦 Creating database tables...');

    // Table users
    await query(`
        CREATE TABLE IF NOT EXISTS users
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT UNIQUE NOT NULL,
            email      TEXT UNIQUE NOT NULL,
            password   TEXT        NOT NULL,
            credits    INTEGER DEFAULT 100,
            is_admin   INTEGER DEFAULT 0,
            created_at TEXT        NOT NULL,
            updated_at TEXT        NOT NULL
        )
    `);
    console.log('  ✓ users');

    // Table card_themes
    await query(`
        CREATE TABLE IF NOT EXISTS card_themes
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            slug       TEXT UNIQUE NOT NULL,
            name       TEXT        NOT NULL,
            icon       TEXT        NOT NULL,
            created_at TEXT        NOT NULL,
            updated_at TEXT        NOT NULL
        )
    `);
    console.log('  ✓ card_themes');

    // Table cards
    await query(`
        CREATE TABLE IF NOT EXISTS cards
        (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            description TEXT    NOT NULL,
            category    TEXT    NOT NULL,
            rarity      TEXT    NOT NULL,
            image_url   TEXT    NOT NULL,
            created_at  TEXT    NOT NULL,
            updated_at  TEXT    NOT NULL,
            FOREIGN KEY (category) REFERENCES card_themes (slug) ON DELETE CASCADE
        )
    `);
    console.log('  ✓ cards');

    // Table user_credits (historique des crédits)
    await query(`
        CREATE TABLE IF NOT EXISTS user_credits
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            amount     INTEGER NOT NULL,
            reason     TEXT,
            created_at TEXT    NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);
    console.log('  ✓ user_credits');

    // Table user_cards (collection de cartes des utilisateurs)
    await query(`
        CREATE TABLE IF NOT EXISTS user_cards
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            card_id    INTEGER NOT NULL,
            obtained_at TEXT   NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE
        )
    `);
    console.log('  ✓ user_cards');

    // Table bonus_operations (opérations de bonus mathématiques)
    await query(`
        CREATE TABLE IF NOT EXISTS bonus_operations
        (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            operation        TEXT    NOT NULL,
            correct_answer   INTEGER NOT NULL,
            difficulty_level INTEGER DEFAULT 1,
            credits_reward   INTEGER DEFAULT 10,
            created_at       TEXT    NOT NULL
        )
    `);
    console.log('  ✓ bonus_operations');

    // Table bonus_history (historique des bonus)
    await query(`
        CREATE TABLE IF NOT EXISTS bonus_history
        (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id           INTEGER NOT NULL,
            operation_id      INTEGER NOT NULL,
            user_answer       INTEGER,
            is_correct        INTEGER NOT NULL,
            credits_earned    INTEGER DEFAULT 0,
            created_at        TEXT    NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (operation_id) REFERENCES bonus_operations (id) ON DELETE CASCADE
        )
    `);
    console.log('  ✓ bonus_history');

    // Table operation_attempts (tentatives d'opérations par jour)
    await query(`
        CREATE TABLE IF NOT EXISTS operation_attempts
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            date       TEXT    NOT NULL,
            attempts   INTEGER DEFAULT 0,
            created_at TEXT    NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE (user_id, date)
        )
    `);
    console.log('  ✓ operation_attempts');

    // Table user_themes (thèmes de collection choisis par l'utilisateur)
    await query(`
        CREATE TABLE IF NOT EXISTS user_themes
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            theme_slug TEXT    NOT NULL,
            created_at TEXT    NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (theme_slug) REFERENCES card_themes (slug) ON DELETE CASCADE,
            UNIQUE (user_id, theme_slug)
        )
    `);
    console.log('  ✓ user_themes');

    // Table game_sessions (sessions de jeu)
    await query(`
        CREATE TABLE IF NOT EXISTS game_sessions
        (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id      INTEGER NOT NULL,
            game_type    TEXT    NOT NULL,
            errors       INTEGER DEFAULT 0,
            success      INTEGER DEFAULT 0,
            cards_earned INTEGER DEFAULT 0,
            created_at   TEXT    NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);
    console.log('  ✓ game_sessions');

    // Table word_search_words (mots pour les mots mêlés)
    await query(`
        CREATE TABLE IF NOT EXISTS word_search_words
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            theme_slug TEXT,
            word       TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (theme_slug) REFERENCES card_themes (slug) ON DELETE CASCADE
        )
    `);
    console.log('  ✓ word_search_words');

    // Table user_activity_logs (logs d'activité des utilisateurs)
    await query(`
        CREATE TABLE IF NOT EXISTS user_activity_logs
        (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            action_type TEXT    NOT NULL,
            details     TEXT,
            created_at  TEXT    NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);
    console.log('  ✓ user_activity_logs');

    console.log('✅ All tables created');
}

async function createIndexes() {
    console.log('📑 Creating indexes...');

    try {
        await query('CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON user_cards(user_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_user_cards_card_id ON user_cards(card_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_bonus_history_user_id ON bonus_history(user_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_bonus_history_created_at ON bonus_history(created_at)');
        await query('CREATE INDEX IF NOT EXISTS idx_operation_attempts_user_id ON operation_attempts(user_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_operation_attempts_created_at ON operation_attempts(created_at)');
        await query('CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON user_themes(user_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at)');
        await query('CREATE INDEX IF NOT EXISTS idx_game_sessions_type ON game_sessions(game_type)');
        await query('CREATE INDEX IF NOT EXISTS idx_word_search_words_theme ON word_search_words(theme_slug)');
        await query('CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at)');
        await query('CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON user_activity_logs(action_type)');
        console.log('  ✓ Indexes created');
    } catch (error) {
        console.log('  ⚠️  Some indexes may already exist');
    }
}

module.exports = {
    createTables,
    createIndexes
};
