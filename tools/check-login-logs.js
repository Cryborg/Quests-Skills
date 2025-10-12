/**
 * Script pour vérifier les logs de connexion en production
 */
require('dotenv').config();
const { query, get } = require('../server/turso-db');

async function checkLoginLogs() {
    try {
        console.log('🔍 Vérification des logs de connexion...\n');

        // Vérifier si la table existe
        const tables = await query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='user_activity_logs'"
        );

        if (tables.rows.length === 0) {
            console.error('❌ La table user_activity_logs n\'existe pas !');
            return;
        }

        console.log('✅ La table user_activity_logs existe\n');

        // Vérifier les logs pour l'utilisateur 3 (Aloy)
        const aloyLogs = await query(
            'SELECT * FROM user_activity_logs WHERE user_id = 3 ORDER BY created_at DESC LIMIT 10'
        );

        console.log(`📊 Logs pour Aloy (user_id=3): ${aloyLogs.rows.length} entrées`);
        if (aloyLogs.rows.length > 0) {
            console.log('\nDerniers logs:');
            aloyLogs.rows.forEach(log => {
                console.log(`  - ${log.action_type} à ${log.created_at}`);
            });
        } else {
            console.log('  ⚠️  Aucun log trouvé !');
        }

        // Vérifier tous les logs de login
        const allLogins = await query(
            "SELECT user_id, COUNT(*) as count, MAX(created_at) as last_login FROM user_activity_logs WHERE action_type = 'login' GROUP BY user_id"
        );

        console.log(`\n📈 Total des utilisateurs avec logs de login: ${allLogins.rows.length}`);
        if (allLogins.rows.length > 0) {
            console.log('\nRésumé par utilisateur:');
            allLogins.rows.forEach(row => {
                console.log(`  - User ${row.user_id}: ${row.count} connexions, dernière: ${row.last_login}`);
            });
        }

        // Compter le total de logs
        const totalLogs = await get('SELECT COUNT(*) as count FROM user_activity_logs');
        console.log(`\n📋 Total de logs dans la table: ${totalLogs.count}`);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error(error);
    }
}

checkLoginLogs().then(() => process.exit(0));
