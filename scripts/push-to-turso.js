const { execSync } = require('child_process');

console.log('🚀 Setting up Turso database...\n');

try {
    // 1. Appliquer les migrations
    console.log('Step 1/2: Applying migrations...');
    execSync('node scripts/migrate-turso.js', { stdio: 'inherit' });

    console.log('\n');

    // 2. Seed la base de données
    console.log('Step 2/2: Seeding database...');
    execSync('node scripts/seed-turso.js', { stdio: 'inherit' });

    console.log('\n🎉 Turso database is fully set up and ready!');

} catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
}
