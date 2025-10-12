/**
 * Script de test pour vérifier le tracking automatique des connexions
 */
require('dotenv').config();
const { query, run } = require('../server/turso-db');

async function testAutoLoginTracking() {
    console.log('🧪 Test du tracking automatique de connexion\n');

    try {
        // 1. Supprimer les logs de login d'aujourd'hui pour l'utilisateur 1
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

        await run(
            "DELETE FROM user_activity_logs WHERE user_id = 1 AND action_type = 'login' AND created_at >= ?",
            [todayStart]
        );
        console.log('✅ Logs de login d\'aujourd\'hui supprimés pour user 1');

        // 2. Vérifier qu'il n'y a plus de log aujourd'hui
        const logsBeforeResult = await query(
            "SELECT * FROM user_activity_logs WHERE user_id = 1 AND action_type = 'login' AND created_at >= ?",
            [todayStart]
        );
        console.log(`📊 Logs avant requête: ${logsBeforeResult.rows.length}`);

        // 3. Faire une requête authentifiée (simuler le middleware)
        console.log('\n🔄 Simulation d\'une requête authentifiée...');
        console.log('ℹ️  Le middleware devrait créer automatiquement un log de login\n');

        // Simuler ce que fait le middleware
        const { logActivity } = require('../server/utils/activity-logger');
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        const { get } = require('../server/turso-db');
        const existingLogin = await get(
            `SELECT id FROM user_activity_logs
             WHERE user_id = ?
             AND action_type = 'login'
             AND created_at >= ?
             AND created_at <= ?
             LIMIT 1`,
            [1, todayStart, todayEnd]
        );

        if (!existingLogin) {
            console.log('✅ Aucun login aujourd\'hui détecté, création d\'un log...');
            await logActivity(1, 'login', {
                source: 'auto_tracked_test',
                ip: '127.0.0.1'
            });
        } else {
            console.log('⚠️  Un login existe déjà aujourd\'hui');
        }

        // 4. Vérifier qu'un log a bien été créé
        const logsAfterResult = await query(
            "SELECT * FROM user_activity_logs WHERE user_id = 1 AND action_type = 'login' AND created_at >= ? ORDER BY created_at DESC",
            [todayStart]
        );

        console.log(`\n📊 Logs après middleware: ${logsAfterResult.rows.length}`);
        if (logsAfterResult.rows.length > 0) {
            console.log('📝 Dernier log créé:');
            const lastLog = logsAfterResult.rows[0];
            console.log(`   - Action: ${lastLog.action_type}`);
            console.log(`   - Date: ${lastLog.created_at}`);
            if (lastLog.details) {
                const details = JSON.parse(lastLog.details);
                console.log(`   - Source: ${details.source || 'N/A'}`);
                console.log(`   - IP: ${details.ip || 'N/A'}`);
            }
        }

        // 5. Faire une 2ème requête pour vérifier qu'on ne crée PAS de doublon
        console.log('\n🔄 2ème requête (ne devrait PAS créer de nouveau log)...\n');

        const existingLogin2 = await get(
            `SELECT id FROM user_activity_logs
             WHERE user_id = ?
             AND action_type = 'login'
             AND created_at >= ?
             AND created_at <= ?
             LIMIT 1`,
            [1, todayStart, todayEnd]
        );

        if (!existingLogin2) {
            console.log('❌ ERREUR: Aucun login détecté alors qu\'on vient d\'en créer un !');
            await logActivity(1, 'login', {
                source: 'auto_tracked_test_2',
                ip: '127.0.0.1'
            });
        } else {
            console.log('✅ Login existant détecté, pas de nouveau log créé');
        }

        const logsFinalResult = await query(
            "SELECT * FROM user_activity_logs WHERE user_id = 1 AND action_type = 'login' AND created_at >= ? ORDER BY created_at DESC",
            [todayStart]
        );

        console.log(`\n📊 Logs finaux: ${logsFinalResult.rows.length}`);

        if (logsFinalResult.rows.length === 1) {
            console.log('\n✅ TEST RÉUSSI: Un seul log de login créé pour aujourd\'hui');
        } else {
            console.log(`\n⚠️  ATTENTION: ${logsFinalResult.rows.length} logs trouvés (devrait être 1)`);
        }

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        console.error(error);
    }
}

testAutoLoginTracking().then(() => {
    console.log('\n🏁 Test terminé\n');
    process.exit(0);
});
