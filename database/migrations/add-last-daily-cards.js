/**
 * Migration: Ajouter le champ last_daily_cards à la table users
 */

const { query } = require('../../server/turso-db');

async function addLastDailyCardsColumn() {
    console.log('🔄 Migration: Ajout du champ last_daily_cards...');

    try {
        // Tente d'ajouter la colonne (ignore l'erreur si elle existe déjà)
        try {
            await query(`
                ALTER TABLE users
                ADD COLUMN last_daily_cards TEXT
            `);
            console.log('  ✅ Colonne last_daily_cards ajoutée avec succès');
        } catch (alterError) {
            if (alterError.message.includes('duplicate column')) {
                console.log('  ℹ️  La colonne last_daily_cards existe déjà');
            } else {
                throw alterError;
            }
        }
    } catch (error) {
        console.error('  ❌ Erreur lors de l\'ajout de la colonne:', error);
        throw error;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    addLastDailyCardsColumn()
        .then(() => {
            console.log('✅ Migration terminée');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur de migration:', error);
            process.exit(1);
        });
}

module.exports = { addLastDailyCardsColumn };
