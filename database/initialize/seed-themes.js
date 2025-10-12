const { get, run } = require('../../server/turso-db');

/**
 * Seed Card Themes
 */
async function seedThemes() {
    console.log('🎨 Seeding card themes...');

    const themes = [
        { slug: 'minecraft', name: 'Minecraft', icon: '🟫' },
        { slug: 'space', name: 'Astronomie', icon: '🌌' },
        { slug: 'dinosaurs', name: 'Dinosaures', icon: '🦕' },
        { slug: 'monuments', name: 'Monuments', icon: '🏛️' },
        { slug: 'jeux-videos', name: 'Jeux Vidéo', icon: '🎮' }
    ];

    let themeCount = 0;
    for (const theme of themes) {
        const existing = await get('SELECT * FROM card_themes WHERE slug = ?', [theme.slug]);
        const now = new Date().toISOString();

        if (!existing) {
            await run(
                'INSERT INTO card_themes (slug, name, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                [theme.slug, theme.name, theme.icon, now, now]
            );
            themeCount++;
        }
    }
    console.log(`  ✅ ${themeCount} new themes seeded (${themes.length} total)`);

    return themes;
}

module.exports = { seedThemes };
