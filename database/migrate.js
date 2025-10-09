const fs = require('fs');
const path = require('path');
const { query, run } = require('../server/turso-db');

/**
 * Système de migrations automatique
 * Exécute toutes les migrations qui n'ont pas encore été appliquées
 */

async function createMigrationsTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            executed_at TEXT NOT NULL
        )
    `);
}

async function getExecutedMigrations() {
    try {
        const result = await query('SELECT name FROM migrations ORDER BY name');
        return result.rows.map(row => row.name);
    } catch (error) {
        // Table doesn't exist yet
        return [];
    }
}

async function recordMigration(name) {
    const now = new Date().toISOString();
    await run('INSERT INTO migrations (name, executed_at) VALUES (?, ?)', [name, now]);
}

async function runMigrations() {
    console.log('🔄 Running database migrations...');

    // Create migrations table if it doesn't exist
    await createMigrationsTable();

    // Get list of executed migrations
    const executed = await getExecutedMigrations();
    console.log(`📊 ${executed.length} migration(s) already executed`);

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');

    if (!fs.existsSync(migrationsDir)) {
        console.log('📁 No migrations directory found');
        return;
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.js'))
        .sort();

    if (files.length === 0) {
        console.log('📁 No migration files found');
        return;
    }

    console.log(`📁 Found ${files.length} migration file(s)`);

    // Run pending migrations
    let ranCount = 0;
    for (const file of files) {
        const name = file.replace('.js', '');

        if (executed.includes(name)) {
            console.log(`⏭️  Skipping ${name} (already executed)`);
            continue;
        }

        console.log(`▶️  Running migration: ${name}`);

        try {
            const migration = require(path.join(migrationsDir, file));
            await migration.up();
            await recordMigration(name);
            ranCount++;
            console.log(`✅ Migration ${name} completed`);
        } catch (error) {
            console.error(`❌ Migration ${name} failed:`, error);
            throw error;
        }
    }

    if (ranCount === 0) {
        console.log('✅ All migrations up to date');
    } else {
        console.log(`✅ ${ranCount} migration(s) executed successfully`);
    }
}

// Export for use in other files
module.exports = { runMigrations };

// Allow running directly
if (require.main === module) {
    runMigrations()
        .then(() => {
            console.log('🎉 Migrations completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}
