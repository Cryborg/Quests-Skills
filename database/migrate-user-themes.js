const { db, query, get, run, all } = require('../server/turso-db');

/**
 * Migration: Activer tous les thèmes pour les utilisateurs existants
 */
async function migrateUserThemes() {
  try {
    console.log('🔧 Starting user themes migration...');

    // Récupérer tous les utilisateurs
    const users = await all('SELECT id, username FROM users');
    console.log(`👥 Found ${users.length} users`);

    // Récupérer tous les thèmes
    const themes = await all('SELECT slug FROM card_themes');
    console.log(`🎨 Found ${themes.length} themes`);

    const now = new Date().toISOString();
    let migratedUsers = 0;

    for (const user of users) {
      // Vérifier si l'utilisateur a déjà des thèmes
      const existingThemes = await all(
        'SELECT * FROM user_themes WHERE user_id = ?',
        [user.id]
      );

      if (existingThemes.length === 0) {
        // Activer tous les thèmes par défaut
        for (const theme of themes) {
          await run(
            'INSERT INTO user_themes (user_id, theme_slug, created_at) VALUES (?, ?, ?)',
            [user.id, theme.slug, now]
          );
        }
        console.log(`  ✅ Migrated user: ${user.username} (${themes.length} themes)`);
        migratedUsers++;
      } else {
        console.log(`  ⏭️  Skipped user: ${user.username} (already has ${existingThemes.length} themes)`);
      }
    }

    console.log(`✅ Migration complete! ${migratedUsers} users migrated.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateUserThemes();
