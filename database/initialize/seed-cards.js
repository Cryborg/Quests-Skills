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
            image: 'images/creeper.webp',
            category: 'minecraft',
            base_rarity: 'common',
            description: 'Une créature explosive qui détruit tout sur son passage.'
        },
        {
            name: 'Enderman',
            image: 'images/enderman.webp',
            category: 'minecraft',
            base_rarity: 'rare',
            description: 'Être mystérieux capable de téléportation.'
        },
        {
            name: 'Diamant',
            image: 'images/diamant.webp',
            category: 'minecraft',
            base_rarity: 'very_rare',
            description: 'Le minerai le plus précieux du monde de Minecraft.'
        },
        {
            name: 'Ender Dragon',
            image: 'images/ender_dragon.webp',
            category: 'minecraft',
            base_rarity: 'epic',
            description: 'Le boss final qui règne sur l\'End.'
        },
        {
            name: 'Steve',
            image: 'images/steve.webp',
            category: 'minecraft',
            base_rarity: 'legendary',
            description: 'Le héros légendaire de Minecraft.'
        },
        {
            name: 'Zombie',
            image: 'images/zombie.webp',
            category: 'minecraft',
            base_rarity: 'common',
            description: 'Mort-vivant qui erre dans la nuit.'
        },
        {
            name: 'Wither',
            image: 'images/wither.webp',
            category: 'minecraft',
            base_rarity: 'epic',
            description: 'Boss destructeur aux trois têtes.'
        },
        {
            name: 'Émeraude',
            image: 'images/emeraude.webp',
            category: 'minecraft',
            base_rarity: 'rare',
            description: 'Gemme précieuse pour le commerce.'
        },

        // ESPACE (8 cartes)
        {
            name: 'Soleil',
            image: 'images/soleil.jpg',
            category: 'space',
            base_rarity: 'legendary',
            description: 'Notre étoile, source de toute vie sur Terre.'
        },
        {
            name: 'Lune',
            image: 'images/lune.jpg',
            category: 'space',
            base_rarity: 'common',
            description: 'Satellite naturel de la Terre.'
        },
        {
            name: 'Mars',
            image: 'images/mars.jpg',
            category: 'space',
            base_rarity: 'rare',
            description: 'La planète rouge, future destination humaine.'
        },
        {
            name: 'Saturne',
            image: 'images/saturne.jpg',
            category: 'space',
            base_rarity: 'very_rare',
            description: 'Planète aux magnifiques anneaux.'
        },
        {
            name: 'Trou Noir',
            image: 'images/trou_noir.webp',
            category: 'space',
            base_rarity: 'epic',
            description: 'Objet cosmique d\'une densité infinie.'
        },
        {
            name: 'Galaxie',
            image: 'images/galaxie.jpg',
            category: 'space',
            base_rarity: 'epic',
            description: 'Amas de milliards d\'étoiles.'
        },
        {
            name: 'Comète',
            image: 'images/comete.jpg',
            category: 'space',
            base_rarity: 'rare',
            description: 'Voyageuse glacée des confins du système solaire.'
        },
        {
            name: 'Nébuleuse',
            image: 'images/nebuleuse.webp',
            category: 'space',
            base_rarity: 'very_rare',
            description: 'Nuage cosmique où naissent les étoiles.'
        },

        // DINOSAURES (8 cartes)
        {
            name: 'T-Rex',
            image: 'images/t_rex.png',
            category: 'dinosaurs',
            base_rarity: 'legendary',
            description: 'Le roi des prédateurs du Crétacé.'
        },
        {
            name: 'Tricératops',
            image: 'images/triceratops.webp',
            category: 'dinosaurs',
            base_rarity: 'rare',
            description: 'Herbivore aux trois cornes impressionnantes.'
        },
        {
            name: 'Vélociraptor',
            image: 'images/velociraptor.webp',
            category: 'dinosaurs',
            base_rarity: 'very_rare',
            description: 'Chasseur intelligent et redoutable.'
        },
        {
            name: 'Diplodocus',
            image: 'images/diplodocus.jpg',
            category: 'dinosaurs',
            base_rarity: 'common',
            description: 'Géant au long cou et à la longue queue.'
        },
        {
            name: 'Ptérodactyle',
            image: 'images/pterodactyle.jpg',
            category: 'dinosaurs',
            base_rarity: 'rare',
            description: 'Reptile volant des temps préhistoriques.'
        },
        {
            name: 'Spinosaure',
            image: 'images/spinosaure.webp',
            category: 'dinosaurs',
            base_rarity: 'epic',
            description: 'Prédateur aquatique à la voile dorsale.'
        },
        {
            name: 'Ankylosaure',
            image: 'images/ankylosaure.jpg',
            category: 'dinosaurs',
            base_rarity: 'common',
            description: 'Herbivore blindé comme un tank.'
        },
        {
            name: 'Archéoptéryx',
            image: 'images/archeopteryx.jpg',
            category: 'dinosaurs',
            base_rarity: 'epic',
            description: 'Lien évolutif entre dinosaures et oiseaux.'
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
