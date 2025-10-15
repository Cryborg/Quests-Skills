const { get, run } = require('../../server/turso-db');

/**
 * Seed Cards
 */
async function seedCards() {
    console.log('📦 Seeding cards...');

    const cards = [
        // MINECRAFT (8 cartes)
        {
            name: 'Creeper',
            image: 'creeper.webp',
            category: 'minecraft',
            base_rarity: 'common',
            description: 'Une créature explosive qui détruit tout sur son passage.'
        },
        {
            name: 'Enderman',
            image: 'enderman.webp',
            category: 'minecraft',
            base_rarity: 'rare',
            description: 'Être mystérieux capable de téléportation.'
        },
        {
            name: 'Diamant',
            image: 'diamant.webp',
            category: 'minecraft',
            base_rarity: 'very_rare',
            description: 'Le minerai le plus précieux du monde de Minecraft.'
        },
        {
            name: 'Ender Dragon',
            image: 'ender_dragon.webp',
            category: 'minecraft',
            base_rarity: 'epic',
            description: 'Le boss final qui règne sur l\'End.'
        },
        {
            name: 'Steve',
            image: 'steve.webp',
            category: 'minecraft',
            base_rarity: 'legendary',
            description: 'Le héros légendaire de Minecraft.'
        },
        {
            name: 'Zombie',
            image: 'zombie.webp',
            category: 'minecraft',
            base_rarity: 'common',
            description: 'Mort-vivant qui erre dans la nuit.'
        },
        {
            name: 'Wither',
            image: 'wither.webp',
            category: 'minecraft',
            base_rarity: 'epic',
            description: 'Boss destructeur aux trois têtes.'
        },
        {
            name: 'Émeraude',
            image: 'emeraude.webp',
            category: 'minecraft',
            base_rarity: 'rare',
            description: 'Gemme précieuse pour le commerce.'
        },

        // ESPACE (8 cartes)
        {
            name: 'Soleil',
            image: 'soleil.jpg',
            category: 'space',
            base_rarity: 'legendary',
            description: 'Notre étoile, source de toute vie sur Terre.'
        },
        {
            name: 'Lune',
            image: 'lune.jpg',
            category: 'space',
            base_rarity: 'common',
            description: 'Satellite naturel de la Terre.'
        },
        {
            name: 'Mars',
            image: 'mars.jpg',
            category: 'space',
            base_rarity: 'rare',
            description: 'La planète rouge, future destination humaine.'
        },
        {
            name: 'Saturne',
            image: 'saturne.jpg',
            category: 'space',
            base_rarity: 'very_rare',
            description: 'Planète aux magnifiques anneaux.'
        },
        {
            name: 'Trou Noir',
            image: 'trou_noir.webp',
            category: 'space',
            base_rarity: 'epic',
            description: 'Objet cosmique d\'une densité infinie.'
        },
        {
            name: 'Galaxie',
            image: 'galaxie.jpg',
            category: 'space',
            base_rarity: 'epic',
            description: 'Amas de milliards d\'étoiles.'
        },
        {
            name: 'Comète',
            image: 'comete.jpg',
            category: 'space',
            base_rarity: 'rare',
            description: 'Voyageuse glacée des confins du système solaire.'
        },
        {
            name: 'Nébuleuse',
            image: 'nebuleuse.webp',
            category: 'space',
            base_rarity: 'very_rare',
            description: 'Nuage cosmique où naissent les étoiles.'
        },

        // DINOSAURES (8 cartes)
        {
            name: 'T-Rex',
            image: 't_rex.png',
            category: 'dinosaurs',
            base_rarity: 'legendary',
            description: 'Le roi des prédateurs du Crétacé.'
        },
        {
            name: 'Tricératops',
            image: 'triceratops.webp',
            category: 'dinosaurs',
            base_rarity: 'rare',
            description: 'Herbivore aux trois cornes impressionnantes.'
        },
        {
            name: 'Vélociraptor',
            image: 'velociraptor.webp',
            category: 'dinosaurs',
            base_rarity: 'very_rare',
            description: 'Chasseur intelligent et redoutable.'
        },
        {
            name: 'Diplodocus',
            image: 'diplodocus.jpg',
            category: 'dinosaurs',
            base_rarity: 'common',
            description: 'Géant au long cou et à la longue queue.'
        },
        {
            name: 'Ptérodactyle',
            image: 'pterodactyle.jpg',
            category: 'dinosaurs',
            base_rarity: 'rare',
            description: 'Reptile volant des temps préhistoriques.'
        },
        {
            name: 'Spinosaure',
            image: 'spinosaure.webp',
            category: 'dinosaurs',
            base_rarity: 'epic',
            description: 'Prédateur aquatique à la voile dorsale.'
        },
        {
            name: 'Ankylosaure',
            image: 'ankylosaure.jpg',
            category: 'dinosaurs',
            base_rarity: 'common',
            description: 'Herbivore blindé comme un tank.'
        },
        {
            name: 'Archéoptéryx',
            image: 'archeopteryx.jpg',
            category: 'dinosaurs',
            base_rarity: 'epic',
            description: 'Lien évolutif entre dinosaures et oiseaux.'
        },

        // JEUX VIDÉO (12 cartes)
        {
            name: 'Mario',
            image: 'mario.webp',
            category: 'jeux-videos',
            base_rarity: 'legendary',
            description: 'Le plombier le plus célèbre du monde.'
        },
        {
            name: 'Link',
            image: 'link.webp',
            category: 'jeux-videos',
            base_rarity: 'epic',
            description: 'Héros légendaire de Hyrule.'
        },
        {
            name: 'Pikachu',
            image: 'pikachu.webp',
            category: 'jeux-videos',
            base_rarity: 'very_rare',
            description: 'La souris électrique la plus mignonne.'
        },
        {
            name: 'Sonic',
            image: 'sonic.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Le hérisson bleu plus rapide que le son.'
        },
        {
            name: 'Pac-Man',
            image: 'pacman.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'La légende jaune des salles d\'arcade.'
        },
        {
            name: 'Lara Croft',
            image: 'lara_croft.webp',
            category: 'jeux-videos',
            base_rarity: 'common',
            description: 'Aventurière intrépide et chasseuse de trésors.'
        },
        {
            name: 'Cloud Strife',
            image: 'cloud_strife.webp',
            category: 'jeux-videos',
            base_rarity: 'very_rare',
            description: 'Mercenaire à l\'épée démesurée.'
        },
        {
            name: 'Aerith',
            image: 'aerith.webp',
            category: 'jeux-videos',
            base_rarity: 'very_rare',
            description: 'Ancienne au destin tragique.'
        },
        {
            name: 'Aloy',
            image: 'aloy.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Chasseuse dans un monde post-apocalyptique.'
        },
        {
            name: 'Kirby',
            image: 'kirby.webp',
            category: 'jeux-videos',
            base_rarity: 'common',
            description: 'Boule rose adorable et redoutable.'
        },
        {
            name: 'Crash Bandicoot',
            image: 'crash.webp',
            category: 'jeux-videos',
            base_rarity: 'common',
            description: 'Bandicoot tournoyant déjanté.'
        },
        {
            name: 'Spyro',
            image: 'spyro.webp',
            category: 'jeux-videos',
            base_rarity: 'common',
            description: 'Petit dragon violet intrépide.'
        }
    ];

    let cardCount = 0;
    for (const card of cards) {
        const existing = await get('SELECT * FROM cards WHERE name = ?', [card.name]);
        const now = new Date().toISOString();

        if (!existing) {
            await run(
                'INSERT INTO cards (name, image, category, base_rarity, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [card.name, card.image, card.category, card.base_rarity, card.description, now, now]
            );
            cardCount++;
        }
    }
    console.log(`  ✅ ${cardCount} new cards seeded (${cards.length} total)`);
}

module.exports = { seedCards };
