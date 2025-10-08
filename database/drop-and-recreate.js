const { query } = require('../server/turso-db');
const { initializeDatabase } = require('./initialize');

async function dropAndRecreate() {
  console.log('🗑️  Dropping all tables...');

  try {
    // Supprimer toutes les tables dans l'ordre (à cause des foreign keys)
    const tables = [
      'operation_attempts',
      'bonus_history',
      'bonus_operations',
      'user_cards',
      'user_credits',
      'cards',
      'card_themes',
      'users'
    ];

    for (const table of tables) {
      try {
        await query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`  ✓ Dropped ${table}`);
      } catch (error) {
        console.log(`  ⚠️  Could not drop ${table}: ${error.message}`);
      }
    }

    console.log('\n🔨 Recreating database...');
    await initializeDatabase();

    console.log('\n✅ Database recreated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropAndRecreate()
  .then(() => {
    console.log('✅ Complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
  });
