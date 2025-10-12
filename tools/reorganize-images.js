/**
 * Script pour réorganiser les images par thème
 */
const fs = require('fs');
const path = require('path');

// Mapping des images vers leur thème basé sur le seed
const imageMapping = {
    // MINECRAFT
    'creeper.webp': 'minecraft',
    'enderman.webp': 'minecraft',
    'diamant.webp': 'minecraft',
    'ender_dragon.webp': 'minecraft',
    'steve.webp': 'minecraft',
    'zombie.webp': 'minecraft',
    'wither.webp': 'minecraft',
    'emeraude.webp': 'minecraft',

    // SPACE
    'soleil.jpg': 'space',
    'lune.jpg': 'space',
    'mars.jpg': 'space',
    'saturne.jpg': 'space',
    'trou_noir.webp': 'space',
    'galaxie.jpg': 'space',
    'comete.jpg': 'space',
    'nebuleuse.webp': 'space',

    // DINOSAURS
    't_rex.png': 'dinosaurs',
    'triceratops.webp': 'dinosaurs',
    'velociraptor.webp': 'dinosaurs',
    'diplodocus.jpg': 'dinosaurs',
    'pterodactyle.jpg': 'dinosaurs',
    'spinosaure.webp': 'dinosaurs',
    'ankylosaure.jpg': 'dinosaurs',
    'archeopteryx.jpg': 'dinosaurs',

    // MONUMENTS
    'pyramide_gizeh.jpg': 'monuments',
    'tour_eiffel.jpg': 'monuments',
    'grande_muraille.jpeg': 'monuments',
    'colisee.jpg': 'monuments',
    'taj_mahal.jpg': 'monuments',
    'statue_liberte.jpg': 'monuments',
    'opera_sydney.webp': 'monuments',
    'burj_khalifa.jpg': 'monuments',
    'chateau_versailles.jpg': 'monuments',
    'chateau_neuschwanstein.jpg': 'monuments',
    'chateau_himeji.jpg': 'monuments',
    'chateau_alhambra.jpg': 'monuments',
    'chateau_prague.jpg': 'monuments',
    'chateau_segovie.webp': 'monuments',
    'chateau_chambord.jpg': 'monuments',
    'chateau_bran.webp': 'monuments',

    // JEUX VIDÉO
    'mario.webp': 'jeux-videos',
    'link.webp': 'jeux-videos',
    'pikachu.webp': 'jeux-videos',
    'sonic.webp': 'jeux-videos',
    'master_chief.webp': 'jeux-videos',
    'pacman.webp': 'jeux-videos',
    'lara_croft.webp': 'jeux-videos',
    'kratos.webp': 'jeux-videos',
    'samus_aran.webp': 'jeux-videos',
    'cloud_strife.webp': 'jeux-videos',
    'geralt.webp': 'jeux-videos',
    'ezio.webp': 'jeux-videos',
    'gordon_freeman.webp': 'jeux-videos',
    'doom_slayer.webp': 'jeux-videos',
    'solid_snake.webp': 'jeux-videos',
    'marcus_fenix.webp': 'jeux-videos',
    'commander_shepard.webp': 'jeux-videos',
    'sora.webp': 'jeux-videos',
    'aerith.webp': 'jeux-videos',
    'aloy.webp': 'jeux-videos',
    'aloy.png': 'jeux-videos',
    'ellie.webp': 'jeux-videos',
    'arthur_morgan.webp': 'jeux-videos',
    'ryu.webp': 'jeux-videos',
    'scorpion.webp': 'jeux-videos',
    'kazuya.webp': 'jeux-videos',
    'kirby.webp': 'jeux-videos',
    'mega_man.webp': 'jeux-videos',
    'crash.webp': 'jeux-videos',
    'spyro.webp': 'jeux-videos',
    'nathan_drake.webp': 'jeux-videos'
};

const imagesDir = path.join(__dirname, '../shared/images');

let movedCount = 0;
let skippedCount = 0;

console.log('🔄 Réorganisation des images par thème...\n');

// Parcourir toutes les images du mapping
for (const [filename, theme] of Object.entries(imageMapping)) {
    const sourcePath = path.join(imagesDir, filename);
    const destPath = path.join(imagesDir, theme, filename);

    if (fs.existsSync(sourcePath)) {
        try {
            fs.renameSync(sourcePath, destPath);
            console.log(`✅ ${filename} → ${theme}/`);
            movedCount++;
        } catch (error) {
            console.error(`❌ Erreur pour ${filename}:`, error.message);
        }
    } else {
        console.log(`⚠️  ${filename} n'existe pas, ignoré`);
        skippedCount++;
    }
}

console.log(`\n✨ Terminé !`);
console.log(`   ${movedCount} images déplacées`);
console.log(`   ${skippedCount} images non trouvées`);
