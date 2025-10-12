/**
 * Script pour migrer les paths d'images en base de données
 * Enlève le préfixe "images/" de tous les champs image
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { all, run } = require('../server/turso-db');

async function migrateImagePaths() {
    console.log('🔄 Migration des paths d\'images...\n');

    try {
        // Récupérer toutes les cartes
        const cards = await all('SELECT id, name, image, category FROM cards');
        console.log(`📊 ${cards.length} cartes trouvées\n`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const card of cards) {
            // Si l'image commence par "images/", on l'enlève
            if (card.image && card.image.startsWith('images/')) {
                const newImage = card.image.replace('images/', '');
                await run(
                    'UPDATE cards SET image = ? WHERE id = ?',
                    [newImage, card.id]
                );
                console.log(`✅ ${card.name}: "${card.image}" → "${newImage}"`);
                updatedCount++;
            } else {
                console.log(`⏭️  ${card.name}: déjà au bon format (${card.image})`);
                skippedCount++;
            }
        }

        console.log(`\n✨ Migration terminée !`);
        console.log(`   ${updatedCount} cartes mises à jour`);
        console.log(`   ${skippedCount} cartes déjà à jour`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        process.exit(1);
    }
}

migrateImagePaths();
