const { query } = require('../server/turso-db');

async function checkSchema() {
  console.log('🔍 Checking operation_attempts table schema...');

  try {
    // Vérifier la structure de la table
    const schema = await query("PRAGMA table_info(operation_attempts)");

    console.log('\n📋 operation_attempts columns:');
    schema.rows.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    // Vérifier si la colonne operation_type existe
    const hasOperationType = schema.rows.some(col => col.name === 'operation_type');

    if (!hasOperationType) {
      console.log('\n❌ Missing column: operation_type');
      console.log('💡 Need to add the column with:');
      console.log('   ALTER TABLE operation_attempts ADD COLUMN operation_type TEXT NOT NULL;');
    } else {
      console.log('\n✅ Column operation_type exists');
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema()
  .then(() => {
    console.log('\n✅ Schema check complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Schema check failed:', err);
    process.exit(1);
  });
