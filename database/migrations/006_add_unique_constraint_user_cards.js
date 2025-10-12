const { query } = require('../../server/turso-db');

/**
 * Migration: Ajouter une contrainte UNIQUE sur (user_id, card_id) dans user_cards
 *
 * Raison: Permettre l'utilisation de UPSERT (INSERT ... ON CONFLICT) pour optimiser les performances
 * Cette contrainte évite qu'un utilisateur ait plusieurs lignes pour la même carte
 */

async function up() {
    console.log('📝 Adding UNIQUE constraint on user_cards (user_id, card_id)...');

    try {
        await query(`
            CREATE UNIQUE INDEX IF NOT EXISTS user_cards_user_id_card_id_key
            ON user_cards(user_id, card_id)
        `);
        console.log('✅ UNIQUE constraint added to user_cards');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('⚠️  UNIQUE constraint already exists');
        } else {
            throw error;
        }
    }
}

async function down() {
    console.log('📝 Removing UNIQUE constraint from user_cards...');

    try {
        await query(`DROP INDEX IF EXISTS user_cards_user_id_card_id_key`);
        console.log('✅ UNIQUE constraint removed from user_cards');
    } catch (error) {
        console.error('⚠️  Error removing UNIQUE constraint:', error.message);
    }
}

module.exports = { up, down };
