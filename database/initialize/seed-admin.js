const { get, run } = require('../../server/turso-db');
const bcrypt = require('bcrypt');

/**
 * Seed Admin User (Cryborg)
 */
async function seedAdmin(themes) {
    console.log('👤 Seeding admin user...');

    let adminUser = await get('SELECT * FROM users WHERE email = ?', ['cryborg.live@gmail.com']);

    if (!adminUser) {
        const now = new Date().toISOString();
        const hashedPassword = await bcrypt.hash('Célibataire1979$', 10);
        await run(
            'INSERT INTO users (username, email, password, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            ['Cryborg', 'cryborg.live@gmail.com', hashedPassword, 1, now, now]
        );
        adminUser = await get('SELECT * FROM users WHERE email = ?', ['cryborg.live@gmail.com']);

        // Créer les crédits initiaux pour l'admin (5 crédits de départ)
        await run(
            'INSERT INTO user_credits (user_id, credits, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [adminUser.id, 5, now, now]
        );

        // Activer tous les thèmes par défaut pour l'admin
        for (const theme of themes) {
            await run(
                'INSERT OR IGNORE INTO user_themes (user_id, theme_slug, created_at) VALUES (?, ?, ?)',
                [adminUser.id, theme.slug, now]
            );
        }

        console.log('  ✅ Admin user created with 5 credits and all themes enabled');
    } else {
        console.log('  ✅ Admin user already exists');
    }
}

module.exports = { seedAdmin };
