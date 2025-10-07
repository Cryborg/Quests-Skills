const { createClient } = require('@libsql/client');
const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🚀 Migrating Turso database...');

// Vérifie que les variables d'environnement Turso sont présentes
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env');
    console.error('Décommente les lignes TURSO_* dans ton .env');
    process.exit(1);
}

async function main() {
    try {
        console.log('📤 Connecting to Turso...');
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        // Test de connexion
        await client.execute('SELECT 1');
        console.log('✅ Connected to Turso!');

        // Lire les migrations
        console.log('📜 Reading migrations...');
        const migrationsDir = join(__dirname, '../database/migrations');
        const migrations = readdirSync(migrationsDir)
            .filter(f => f.match(/^\d{14}_/))
            .sort();

        console.log(`Found ${migrations.length} migrations`);

        // Exécuter chaque migration
        for (const migration of migrations) {
            console.log(`⚡ Applying ${migration}...`);
            const sqlPath = join(migrationsDir, migration, 'migration.sql');
            let sql = readFileSync(sqlPath, 'utf-8');

            // Supprimer tous les commentaires multi-lignes
            sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');

            // Nettoyer le SQL ligne par ligne
            sql = sql
                .split('\n')
                .filter(line => {
                    const trimmed = line.trim();
                    return trimmed && !trimmed.startsWith('--');
                })
                .join('\n');

            // Split en statements
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const statement of statements) {
                try {
                    await client.execute(statement);
                } catch (error) {
                    // Ignore les erreurs "table already exists"
                    if (!error.message.includes('already exists')) {
                        throw error;
                    }
                    console.log(`  ⚠️  Skipping (already applied)`);
                }
            }
            console.log(`  ✅ Applied ${migration}`);
        }

        console.log('🎉 All migrations applied successfully!');
        client.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

main();
