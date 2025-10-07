const { createClient } = require('@libsql/client');
require('dotenv').config();

const USE_TURSO = process.env.USE_TURSO === 'true';
const client = USE_TURSO
    ? createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    })
    : createClient({
        url: 'file:./database/quests_and_skills.db'
    });

const cards = [
    // MINECRAFT
    {
        name: 'Creeper',
        image: '../../shared/images/creeper.webp',
        category: 'minecraft',
        base_rarity: 'common',
        description: 'Une créature explosive qui détruit tout sur son passage.'
    },
    {
        name: 'Enderman',
        image: '../../shared/images/enderman.webp',
        category: 'minecraft',
        base_rarity: 'rare',
        description: 'Être mystérieux capable de téléportation.'
    },
    {
        name: 'Diamant',
        image: '../../shared/images/diamant.webp',
        category: 'minecraft',
        base_rarity: 'very_rare',
        description: 'Le minerai le plus précieux du monde de Minecraft.'
    },
    {
        name: 'Ender Dragon',
        image: '../../shared/images/ender_dragon.webp',
        category: 'minecraft',
        base_rarity: 'epic',
        description: 'Le boss final qui règne sur l\'End.'
    },
    {
        name: 'Steve',
        image: '../../shared/images/steve.webp',
        category: 'minecraft',
        base_rarity: 'legendary',
        description: 'Le héros légendaire de Minecraft.'
    },
    {
        name: 'Zombie',
        image: '../../shared/images/zombie.webp',
        category: 'minecraft',
        base_rarity: 'common',
        description: 'Mort-vivant qui erre dans la nuit.'
    },
    {
        name: 'Wither',
        image: '../../shared/images/wither.webp',
        category: 'minecraft',
        base_rarity: 'epic',
        description: 'Boss destructeur aux trois têtes.'
    },
    {
        name: 'Émeraude',
        image: '../../shared/images/emeraude.webp',
        category: 'minecraft',
        base_rarity: 'rare',
        description: 'Gemme précieuse pour le commerce.'
    },

    // ASTRONOMIE
    {
        name: 'Soleil',
        image: '../../shared/images/soleil.jpg',
        category: 'space',
        base_rarity: 'legendary',
        description: 'Notre étoile, source de toute vie sur Terre.'
    },
    {
        name: 'Lune',
        image: '../../shared/images/lune.jpg',
        category: 'space',
        base_rarity: 'common',
        description: 'Satellite naturel de la Terre.'
    },
    {
        name: 'Mars',
        image: '../../shared/images/mars.jpg',
        category: 'space',
        base_rarity: 'rare',
        description: 'La planète rouge, future destination humaine.'
    },
    {
        name: 'Saturne',
        image: '../../shared/images/saturne.jpg',
        category: 'space',
        base_rarity: 'very_rare',
        description: 'Planète aux magnifiques anneaux.'
    },
    {
        name: 'Trou Noir',
        image: '../../shared/images/trou_noir.webp',
        category: 'space',
        base_rarity: 'epic',
        description: 'Objet cosmique d\'une densité infinie.'
    },
    {
        name: 'Galaxie',
        image: '../../shared/images/galaxie.jpg',
        category: 'space',
        base_rarity: 'epic',
        description: 'Amas de milliards d\'étoiles.'
    },
    {
        name: 'Comète',
        image: '../../shared/images/comete.jpg',
        category: 'space',
        base_rarity: 'rare',
        description: 'Voyageuse glacée des confins du système solaire.'
    },
    {
        name: 'Nébuleuse',
        image: '../../shared/images/nebuleuse.webp',
        category: 'space',
        base_rarity: 'very_rare',
        description: 'Nuage cosmique où naissent les étoiles.'
    },

    // DINOSAURES
    {
        name: 'T-Rex',
        image: '../../shared/images/t_rex.png',
        category: 'dinosaurs',
        base_rarity: 'legendary',
        description: 'Le roi des prédateurs du Crétacé.'
    },
    {
        name: 'Tricératops',
        image: '../../shared/images/triceratops.webp',
        category: 'dinosaurs',
        base_rarity: 'rare',
        description: 'Herbivore aux trois cornes impressionnantes.'
    },
    {
        name: 'Vélociraptor',
        image: '../../shared/images/velociraptor.webp',
        category: 'dinosaurs',
        base_rarity: 'very_rare',
        description: 'Chasseur intelligent et redoutable.'
    },
    {
        name: 'Diplodocus',
        image: '../../shared/images/diplodocus.jpg',
        category: 'dinosaurs',
        base_rarity: 'common',
        description: 'Géant au long cou et à la longue queue.'
    },
    {
        name: 'Ptérodactyle',
        image: '../../shared/images/pterodactyle.jpg',
        category: 'dinosaurs',
        base_rarity: 'rare',
        description: 'Reptile volant des temps préhistoriques.'
    },
    {
        name: 'Spinosaure',
        image: '../../shared/images/spinosaure.webp',
        category: 'dinosaurs',
        base_rarity: 'epic',
        description: 'Prédateur aquatique à la voile dorsale.'
    },
    {
        name: 'Ankylosaure',
        image: '../../shared/images/ankylosaure.jpg',
        category: 'dinosaurs',
        base_rarity: 'common',
        description: 'Herbivore blindé comme un tank.'
    },
    {
        name: 'Archéoptéryx',
        image: '../../shared/images/archeopteryx.jpg',
        category: 'dinosaurs',
        base_rarity: 'epic',
        description: 'Lien évolutif entre dinosaures et oiseaux.'
    }
];

async function seedCards() {
    try {
        console.log('🃏 Seeding cards...');

        // Vérifier si des cartes existent déjà
        const existingCards = await client.execute('SELECT COUNT(*) as count FROM cards');
        const count = existingCards.rows[0].count;

        if (count > 0) {
            console.log(`⚠️  ${count} cartes existent déjà. Suppression...`);
            await client.execute('DELETE FROM cards');
        }

        // Insérer toutes les cartes
        const now = new Date().toISOString();
        for (const card of cards) {
            await client.execute({
                sql: 'INSERT INTO cards (name, image, category, base_rarity, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                args: [card.name, card.image, card.category, card.base_rarity, card.description, now, now]
            });
        }

        console.log(`✅ ${cards.length} cartes insérées avec succès !`);

        // Afficher les cartes insérées
        const allCards = await client.execute('SELECT id, name, category, base_rarity FROM cards ORDER BY id');
        console.log('\n📋 Cartes dans la base :');
        console.table(allCards.rows.map(row => ({
            id: row.id,
            name: row.name,
            category: row.category,
            base_rarity: row.base_rarity
        })));

    } catch (error) {
        console.error('❌ Erreur lors du seed:', error);
        process.exit(1);
    }
}

seedCards().then(() => {
    console.log('\n🎉 Seed terminé !');
    process.exit(0);
});
