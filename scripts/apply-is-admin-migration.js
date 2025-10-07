const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    console.log('Applying is_admin migration...');
    
    try {
        await client.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false');
        console.log('✅ is_admin field added successfully!');
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('✅ is_admin field already exists');
        } else {
            throw error;
        }
    }

    client.close();
}

main();
