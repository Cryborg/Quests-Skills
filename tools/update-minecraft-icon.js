require('dotenv').config();
const { run } = require('../server/turso-db');

async function main() {
    console.log('🔄 Updating Minecraft icon...');
    
    try {
        await run(
            'UPDATE card_themes SET icon = ? WHERE slug = ?',
            ['💎', 'minecraft']
        );
        console.log('✅ Minecraft icon updated to 💎');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to update icon:', error);
        process.exit(1);
    }
}

main();
