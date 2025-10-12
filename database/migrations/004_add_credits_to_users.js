const { query, all, run } = require('../../server/turso-db');

/**
 * Migration: Ajouter la colonne credits directement dans la table users
 *
 * Raison: Simplifier l'accès aux crédits en évitant une table séparée
 * Les crédits sont maintenant stockés directement dans users.credits
 *
 * Note: On garde user_credits pour compatibilité mais on va migrer les données
 */

async function up() {
    console.log('📝 Adding credits column to users table...');

    // Étape 1 : Ajouter la colonne si elle n'existe pas
    try {
        await query(`
            ALTER TABLE users
            ADD COLUMN credits INTEGER NOT NULL DEFAULT 5
        `);
        console.log('✅ Credits column added to users');
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('⚠️  Credits column already exists');
        } else {
            throw error;
        }
    }

    // Étape 2 : Migrer les crédits existants depuis user_credits vers users
    // Cette étape s'exécute TOUJOURS, même si la colonne existait déjà
    console.log('🔄 Migrating existing credits from user_credits to users...');

    const userCredits = await all('SELECT user_id, credits FROM user_credits');

    for (const uc of userCredits) {
        await run(
            'UPDATE users SET credits = ? WHERE id = ?',
            [uc.credits, uc.user_id]
        );
    }

    console.log(`✅ Migrated credits for ${userCredits.length} users`);
}

async function down() {
    console.log('📝 Removing credits column from users table...');

    // SQLite ne supporte pas DROP COLUMN directement
    // Il faudrait recréer la table sans la colonne
    console.log('⚠️  Rollback not fully supported in SQLite (DROP COLUMN)');
    console.log('   Please restore from backup if needed');
}

module.exports = { up, down };
