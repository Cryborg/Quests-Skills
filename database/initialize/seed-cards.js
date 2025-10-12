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
        },

        // JEUX VIDÉO (8 cartes)
        {
            name: 'Mario',
            image: 'images/mario.webp',
            category: 'jeux-videos',
            base_rarity: 'legendary',
            description: 'Le plombier le plus célèbre du monde.'
        },
        {
            name: 'Link',
            image: 'images/link.webp',
            category: 'jeux-videos',
            base_rarity: 'epic',
            description: 'Héros légendaire de Hyrule.'
        },
        {
            name: 'Pikachu',
            image: 'images/pikachu.webp',
            category: 'jeux-videos',
            base_rarity: 'very_rare',
            description: 'La souris électrique la plus mignonne.'
        },
        {
            name: 'Sonic',
            image: 'images/sonic.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Le hérisson bleu plus rapide que le son.'
        },
        {
            name: 'Master Chief',
            image: 'images/master_chief.webp',
            category: 'jeux-videos',
            base_rarity: 'epic',
            description: 'Spartan légendaire de Halo.'
        },
        {
            name: 'Pac-Man',
            image: 'images/pacman.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'La légende jaune des salles d\'arcade.'
        },
        {
            name: 'Lara Croft',
            image: 'images/lara_croft.webp',
            category: 'jeux-videos',
            base_rarity: 'common',
            description: 'Aventurière intrépide et chasseuse de trésors.'
        },
        {
            name: 'Kratos',
            image: 'images/kratos.webp',
            category: 'jeux-videos',
            base_rarity: 'common',
            description: 'Le Dieu de la Guerre spartiate.'
        },
        {
            name: 'Samus Aran',
            image: 'images/samus_aran.webp',
            category: 'jeux-videos',
            base_rarity: 'epic',
            description: 'Chasseuse de primes intergalactique.'
        },
        {
            name: 'Cloud Strife',
            image: 'images/cloud_strife.webp',
            category: 'jeux-videos',
            base_rarity: 'very_rare',
            description: 'Mercenaire à l\'épée démesurée.'
        },
        {
            name: 'Geralt',
            image: 'images/geralt.webp',
            category: 'jeux-videos',
            base_rarity: 'epic',
            description: 'Sorceleur chasseur de monstres.'
        },
        {
            name: 'Ezio Auditore',
            image: 'images/ezio.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Maître assassin de la Renaissance.'
        },
        {
            name: 'Gordon Freeman',
            image: 'images/gordon_freeman.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Scientifique devenu héros malgré lui.'
        },
        {
            name: 'Doom Slayer',
            image: 'images/doom_slayer.webp',
            category: 'jeux-videos',
            base_rarity: 'legendary',
            description: 'Tueur de démons implacable.'
        },
        {
            name: 'Solid Snake',
            image: 'images/solid_snake.webp',
            category: 'jeux-videos',
            base_rarity: 'very_rare',
            description: 'Agent infiltré légendaire.'
        },
        {
            name: 'Marcus Fenix',
            image: 'images/marcus_fenix.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Soldat emblématique de Gears of War.'
        },
        {
            name: 'Commander Shepard',
            image: 'images/commander_shepard.webp',
            category: 'jeux-videos',
            base_rarity: 'epic',
            description: 'Sauveur de la galaxie.'
        },
        {
            name: 'Sora',
            image: 'images/sora.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Porteur de la Keyblade.'
        },
        {
            name: 'Aerith',
            image: 'images/aerith.webp',
            category: 'jeux-videos',
            base_rarity: 'very_rare',
            description: 'Ancienne au destin tragique.'
        },
        {
            name: 'Aloy',
            image: 'images/aloy.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Chasseuse dans un monde post-apocalyptique.'
        },
        {
            name: 'Ellie',
            image: 'images/ellie.webp',
            category: 'jeux-videos',
            base_rarity: 'very_rare',
            description: 'Survivante courageuse de The Last of Us.'
        },
        {
            name: 'Arthur Morgan',
            image: 'images/arthur_morgan.webp',
            category: 'jeux-videos',
            base_rarity: 'epic',
            description: 'Hors-la-loi au grand cœur.'
        },
        {
            name: 'Ryu',
            image: 'images/ryu.webp',
            category: 'jeux-videos',
            base_rarity: 'common',
            description: 'Maître du Hadouken.'
        },
        {
            name: 'Scorpion',
            image: 'images/scorpion.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Ninja vengeur aux enfers.'
        },
        {
            name: 'Kazuya Mishima',
            image: 'images/kazuya.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Combattant possédé par le démon.'
        },
        {
            name: 'Kirby',
            image: 'images/kirby.webp',
            category: 'jeux-videos',
            base_rarity: 'common',
            description: 'Boule rose adorable et redoutable.'
        },
        {
            name: 'Mega Man',
            image: 'images/mega_man.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Robot combattant le mal.'
        },
        {
            name: 'Crash Bandicoot',
            image: 'images/crash.webp',
            category: 'jeux-videos',
            base_rarity: 'common',
            description: 'Bandicoot tournoyant déjanté.'
        },
        {
            name: 'Spyro',
            image: 'images/spyro.webp',
            category: 'jeux-videos',
            base_rarity: 'common',
            description: 'Petit dragon violet intrépide.'
        },
        {
            name: 'Nathan Drake',
            image: 'images/nathan_drake.webp',
            category: 'jeux-videos',
            base_rarity: 'rare',
            description: 'Aventurier et chasseur de trésors.'
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
