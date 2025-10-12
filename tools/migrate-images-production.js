/**
 * Script pour migrer les images en production
 * 1. Met à jour les paths en base de données
 * 2. Note: Les images doivent être réorganisées manuellement sur le serveur
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { all, run } = require('../server/turso-db');

async function migrateImagesProduction() {
    console.log('🚀 Migration des images en PRODUCTION...\n');

    if (process.env.APP_ENV !== 'production') {
        console.error('❌ Ce script doit être lancé avec APP_ENV=production');
        console.log('💡 Usage: APP_ENV=production node tools/migrate-images-production.js');
        process.exit(1);
    }

    try {
        // Récupérer toutes les cartes
        const cards = await all('SELECT id, name, image, category FROM cards');
        console.log(`📊 ${cards.length} cartes trouvées en production\n`);

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

        console.log(`\n✨ Migration de la base de données terminée !`);
        console.log(`   ${updatedCount} cartes mises à jour`);
        console.log(`   ${skippedCount} cartes déjà à jour\n`);

        console.log('📝 IMPORTANT: N\'oubliez pas de :');
        console.log('   1. Créer les dossiers sur le serveur:');
        console.log('      - shared/images/minecraft/');
        console.log('      - shared/images/space/');
        console.log('      - shared/images/dinosaurs/');
        console.log('      - shared/images/monuments/');
        console.log('      - shared/images/jeux-videos/');
        console.log('   2. Déplacer les images dans leurs dossiers respectifs');
        console.log('   3. Ou utiliser le script tools/reorganize-images.js en local');
        console.log('      puis uploader les dossiers organisés');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        process.exit(1);
    }
}

migrateImagesProduction();
