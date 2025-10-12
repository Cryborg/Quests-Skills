const { query } = require('../../server/turso-db');

/**
 * Migration: Ajouter des index pour optimiser les performances
 *
 * Raison: Améliorer les temps de réponse des requêtes fréquentes
 * - Index sur user_activity_logs pour les recherches de last_login
 * - Index sur word_search_words pour les recherches par thème
 * - Index sur game_sessions pour les stats quotidiennes
 * - Index sur operation_attempts pour les stats par utilisateur
 * - Index sur cards pour les recherches par catégorie
 */

async function up() {
    console.log('📝 Adding performance indexes...');

    const indexes = [
        {
            name: 'idx_activity_logs_user_action_date',
            table: 'user_activity_logs',
            columns: 'user_id, action_type, created_at DESC',
            reason: 'Optimise last_login queries'
        },
        {
            name: 'idx_word_search_theme_slug',
            table: 'word_search_words',
            columns: 'theme_slug',
            reason: 'Optimise word searches by theme'
        },
        {
            name: 'idx_game_sessions_user_type_date',
            table: 'game_sessions',
            columns: 'user_id, game_type, created_at DESC',
            reason: 'Optimise daily game stats'
        },
        {
            name: 'idx_operation_attempts_user_date',
            table: 'operation_attempts',
            columns: 'user_id, created_at DESC',
            reason: 'Optimise operation attempts queries'
        },
        {
            name: 'idx_cards_category',
            table: 'cards',
            columns: 'category',
            reason: 'Optimise card searches by category'
        }
    ];

    for (const index of indexes) {
        try {
            await query(`
                CREATE INDEX IF NOT EXISTS ${index.name}
                ON ${index.table}(${index.columns})
            `);
            console.log(`  ✅ ${index.name} created (${index.reason})`);
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log(`  ⚠️  ${index.name} already exists`);
            } else {
                throw error;
            }
        }
    }

    console.log('✅ Performance indexes added');
}

async function down() {
    console.log('📝 Removing performance indexes...');

    const indexes = [
        'idx_activity_logs_user_action_date',
        'idx_word_search_theme_slug',
        'idx_game_sessions_user_type_date',
        'idx_operation_attempts_user_date',
        'idx_cards_category'
    ];

    for (const indexName of indexes) {
        try {
            await query(`DROP INDEX IF EXISTS ${indexName}`);
            console.log(`  ✅ ${indexName} removed`);
        } catch (error) {
            console.error(`  ⚠️  Error removing ${indexName}:`, error.message);
        }
    }

    console.log('✅ Performance indexes removed');
}

module.exports = { up, down };
