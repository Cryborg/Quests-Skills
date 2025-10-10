const { get, run } = require('./server/turso-db');

async function deleteUserThemes(email) {
    try {
        // Trouver l'utilisateur
        const user = await get('SELECT id, email FROM users WHERE email = ?', [email]);

        if (!user) {
            console.log(`❌ Utilisateur ${email} introuvable`);
            return;
        }

        console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);

        // Compter les thèmes actuels
        const themes = await get('SELECT COUNT(*) as count FROM user_themes WHERE user_id = ?', [user.id]);
        console.log(`📊 Nombre de thèmes actuels: ${themes.count}`);

        // Supprimer tous les thèmes
        await run('DELETE FROM user_themes WHERE user_id = ?', [user.id]);

        console.log(`🗑️  Tous les thèmes ont été supprimés pour ${user.email}`);
        console.log(`✨ Reconnecte-toi pour voir la modale de sélection de thèmes !`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

// Récupérer l'email depuis les arguments
const email = process.argv[2];

if (!email) {
    console.log('Usage: node delete-user-themes.js <email>');
    process.exit(1);
}

deleteUserThemes(email);
