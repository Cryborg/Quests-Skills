const { all, run } = require('../server/turso-db');

async function fixImagePaths() {
  console.log('🔧 Fixing image paths in database...');

  try {
    // Get all cards
    const cards = await all('SELECT id, name, image FROM cards');

    console.log(`Found ${cards.length} cards to check`);

    let fixed = 0;
    for (const card of cards) {
      // Si l'image commence par /shared/, on enlève ce préfixe
      if (card.image.startsWith('/shared/')) {
        const newImage = card.image.replace('/shared/', '');
        await run('UPDATE cards SET image = ? WHERE id = ?', [newImage, card.id]);
        console.log(`✅ Fixed: ${card.name} - ${card.image} → ${newImage}`);
        fixed++;
      }
    }

    console.log(`\n✅ Fixed ${fixed} image paths`);
  } catch (error) {
    console.error('❌ Error fixing image paths:', error);
    process.exit(1);
  }
}

fixImagePaths()
  .then(() => {
    console.log('✅ Migration complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
