const { query, all, run } = require('../../server/turso-db');

/**
 * Migration: Ajouter la colonne last_daily_claim directement dans la table users
 *
 * Raison: Simplifier l'accès aux données de réclamation quotidienne
 * Avant : last_daily_claim était dans user_credits
 * Après : last_daily_claim est dans users
 */

async function up() {
    console.log('📝 Adding last_daily_claim column to users table...');

    // Étape 1 : Ajouter la colonne si elle n'existe pas
    try {
        await query(`
            ALTER TABLE users
            ADD COLUMN last_daily_claim TEXT
        `);
        console.log('✅ last_daily_claim column added to users');
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('⚠️  last_daily_claim column already exists');
        } else {
            throw error;
        }
    }

    // Étape 2 : Migrer les données existantes depuis user_credits vers users
    // Cette étape s'exécute TOUJOURS, même si la colonne existait déjà
    console.log('🔄 Migrating existing last_daily_claim from user_credits to users...');

    try {
        const userCredits = await all('SELECT user_id, last_daily_claim FROM user_credits WHERE last_daily_claim IS NOT NULL');

        for (const uc of userCredits) {
            await run(
                'UPDATE users SET last_daily_claim = ? WHERE id = ?',
                [uc.last_daily_claim, uc.user_id]
            );
        }

        console.log(`✅ Migrated last_daily_claim for ${userCredits.length} users`);
    } catch (error) {
        // Si la table user_credits n'existe pas ou n'a pas la colonne, ignorer
        console.log('⚠️  Could not migrate last_daily_claim from user_credits:', error.message);
    }
}

async function down() {
    console.log('📝 Removing last_daily_claim column from users table...');

    // SQLite ne supporte pas DROP COLUMN directement
    console.log('⚠️  Rollback not fully supported in SQLite (DROP COLUMN)');
    console.log('   Please restore from backup if needed');
}

module.exports = { up, down };
