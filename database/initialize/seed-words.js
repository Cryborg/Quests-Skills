const { get, run } = require('../../server/turso-db');

/**
 * Seed Word Search Words
 */
async function seedWords() {
    console.log('🔤 Seeding word search words...');

    // Mots génériques (disponibles pour tous - theme_slug = NULL)
    const genericWords = [
        // Nature
        'SOLEIL', 'ARBRE', 'FLEUR', 'NUAGE', 'PLUIE', 'NEIGE', 'VENT', 'ORAGE',
        'MONTAGNE', 'RIVIERE', 'FORET', 'PLAGE', 'JARDIN', 'PRAIRIE', 'LAC', 'MER',

        // Animaux
        'CHAT', 'CHIEN', 'OISEAU', 'POISSON', 'PAPILLON', 'ABEILLE', 'FOURMI', 'COCCINELLE',
        'SOURIS', 'LAPIN', 'OURS', 'LION', 'TIGRE', 'ELEPHANT', 'GIRAFE', 'ZEBRE',
        'SINGE', 'SERPENT', 'TORTUE', 'BALEINE', 'REQUIN', 'DAUPHIN', 'CRABE', 'CREVETTE',
        'GRENOUILLE', 'CANARD', 'POULE', 'COQ', 'VACHE', 'MOUTON', 'CHEVAL', 'ANE',

        // Nourriture
        'POMME', 'BANANE', 'ORANGE', 'FRAISE', 'CERISE', 'RAISIN', 'MELON', 'POIRE',
        'CAROTTE', 'TOMATE', 'SALADE', 'PAIN', 'FROMAGE', 'LAIT', 'CHOCOLAT', 'GATEAU',
        'BONBON', 'GLACE', 'JUS', 'BISCUIT', 'CONFITURE', 'MIEL', 'SOUPE', 'PIZZA',

        // Objets du quotidien
        'MAISON', 'ECOLE', 'LIVRE', 'JOUET', 'BALLON', 'VELO', 'POUPEE', 'ROBOT',
        'CRAYON', 'STYLO', 'CAHIER', 'SAC', 'CHAISE', 'TABLE', 'LIT', 'PORTE',
        'FENETRE', 'LAMPE', 'HORLOGE', 'TELEPHONE', 'ORDINATEUR', 'TELEVISION', 'RADIO',

        // Transports
        'VOITURE', 'TRAIN', 'AVION', 'BATEAU', 'BUS', 'CAMION', 'MOTO', 'TRACTEUR',
        'HELICOPTERE', 'FUSEE', 'METRO', 'TRAMWAY', 'SKATE', 'TROTTINETTE',

        // Couleurs
        'ROUGE', 'BLEU', 'VERT', 'JAUNE', 'NOIR', 'BLANC', 'ROSE', 'VIOLET',
        'ORANGE', 'MARRON', 'GRIS', 'BEIGE',

        // Adjectifs
        'GRAND', 'PETIT', 'CHAUD', 'FROID', 'HAUT', 'BAS', 'RAPIDE', 'LENT',
        'HEUREUX', 'TRISTE', 'JOYEUX', 'CONTENT', 'DROLE', 'GENTIL', 'SAGE', 'CALME',
        'FORT', 'FAIBLE', 'LEGER', 'LOURD', 'DUR', 'MOU', 'DOUX', 'RUGUEUX',

        // Corps et sentiments
        'TETE', 'MAIN', 'PIED', 'BRAS', 'JAMBE', 'OEIL', 'NEZ', 'BOUCHE',
        'OREILLE', 'COEUR', 'AMOUR', 'AMITIE', 'PEUR', 'COURAGE', 'FORCE', 'JOIE',

        // Eléments
        'EAU', 'FEU', 'TERRE', 'AIR', 'PIERRE', 'SABLE', 'BOIS', 'METAL',

        // Famille et personnes
        'FAMILLE', 'AMI', 'PAPA', 'MAMAN', 'FRERE', 'SOEUR', 'BEBE', 'ENFANT',
        'MAITRE', 'DOCTEUR', 'POMPIER', 'POLICIER', 'CUISINIER', 'ARTISTE',

        // Activités
        'JOUER', 'COURIR', 'SAUTER', 'NAGER', 'DANSER', 'CHANTER', 'LIRE', 'ECRIRE',
        'DESSINER', 'PEINDRE', 'CONSTRUIRE', 'DORMIR', 'MANGER', 'BOIRE',

        // Moments
        'JOUR', 'NUIT', 'MATIN', 'SOIR', 'PRINTEMPS', 'ETE', 'AUTOMNE', 'HIVER',
        'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'
    ];

    // Mots par thème de cartes
    const wordLists = {
        minecraft: ['CREEPER', 'DIAMANT', 'PIOCHE', 'COFFRE', 'TNT', 'PORTAIL', 'VILLAGEOIS', 'FERME', 'WITHER', 'GOLEM', 'EMERAUDE', 'BIOME', 'REDSTONE', 'ENDERMAN', 'ZOMBIE', 'SQUELETTE', 'ARAIGNEE', 'SLIME', 'BLOC', 'CRAFT', 'MINE', 'ENCHANTEMENT', 'POTION', 'FOURNEAU', 'ENCLUME', 'EPEE', 'ARMURE', 'ARC', 'FLECHE', 'BOUCLIER', 'CHARBON', 'FER', 'OBSIDIENNE', 'BEDROCK', 'LAVE', 'BOIS', 'PIERRE', 'SABLE', 'GRAVIER', 'NEIGE', 'GLACE', 'CACTUS', 'CHAMPIGNON', 'BLE', 'POULET', 'VACHE', 'MOUTON', 'COCHON', 'CHEVAL', 'LOUP', 'PERROQUET', 'PANDA', 'RENARD'],
        space: ['PLANETE', 'ETOILE', 'FUSEE', 'GALAXIE', 'COMETE', 'SATELLITE', 'ASTRONAUTE', 'TELESCOPE', 'NEBULEUSE', 'ESPACE', 'ASTEROIDE', 'ORBITE', 'LUNE', 'SOLEIL', 'MARS', 'VENUS', 'JUPITER', 'SATURNE', 'MERCURE', 'URANUS', 'NEPTUNE', 'PLUTON', 'TERRE', 'COSMOS', 'CONSTELLATION', 'UNIVERS', 'GRAVITE', 'ROVER', 'STATION', 'HUBBLE', 'APOLLO', 'NASA', 'CASQUE', 'SCAPHANDRE', 'NAVETTE', 'MODULE', 'CRATERE', 'ECLIPSE', 'METEORITE', 'PULSAR', 'QUASAR', 'SUPERNOVA', 'ANNEAU', 'PHASE', 'ECLIPSE'],
        dinosaurs: ['TREX', 'FOSSILE', 'JURASSIQUE', 'HERBIVORE', 'CARNIVORE', 'EXTINCTION', 'PREDATEUR', 'PREHISTOIRE', 'VELOCIRAPTOR', 'TRICERATOPS', 'STEGOSAURE', 'DIPLODOCUS', 'BRACHIOSAURE', 'ANKYLOSAURE', 'PTERODACTYLE', 'SPINOSAURE', 'ALLOSAURUS', 'IGUANODON', 'ARCHEOPTERYX', 'TYRANNOSAURE', 'RAPTOR', 'DENT', 'GRIFFE', 'ECAILLE', 'OEUFS', 'CRANE', 'SQUELETTE', 'OS', 'CRETACE', 'TRIAS', 'FOUILLES', 'MUSEE', 'PLUMES', 'REPTILE', 'VOLCAN', 'METEORITE', 'EMPREINTE'],
        monuments: ['PYRAMIDE', 'SPHINX', 'COLISEE', 'LOUVRE', 'VERSAILLES', 'TOWER', 'KREMLIN', 'PARTHENON', 'ACROPOLE', 'TEMPLE', 'CATHEDRALE', 'BASILIQUE', 'CHAPELLE', 'EGLISE', 'MOSQUE', 'PAGODE', 'CHATEAU', 'PALAIS', 'FORTERESSE', 'CITADELLE', 'MURAILLE', 'PONT', 'ARC', 'OBELISQUE', 'STATUE', 'LIBERTE', 'COLONNE', 'FORUM', 'ARENE', 'AMPHITHEATRE', 'RUINES', 'SANCTUAIRE', 'MEMORIAL', 'MAUSOLEE', 'TOMBEAU', 'ZIGGURAT', 'STONEHENGE', 'ANGKOR', 'MACHU', 'PICCHU', 'TAJ', 'MAHAL', 'PETRA', 'ALHAMBRA', 'SAGRADA', 'FAMILIA', 'DAME', 'WESTMINSTER', 'PANTHEON', 'REICHSTAG']
    };

    let wordCount = 0;
    const now = new Date().toISOString();

    // Insérer les mots génériques (theme_slug = NULL)
    for (const word of genericWords) {
        const existing = await get(
            'SELECT * FROM word_search_words WHERE word = ? AND theme_slug IS NULL',
            [word]
        );

        if (!existing) {
            await run(
                'INSERT INTO word_search_words (theme_slug, word, created_at) VALUES (NULL, ?, ?)',
                [word, now]
            );
            wordCount++;
        }
    }

    // Insérer les mots par thème
    for (const [themeSlug, words] of Object.entries(wordLists)) {
        for (const word of words) {
            const existing = await get(
                'SELECT * FROM word_search_words WHERE theme_slug = ? AND word = ?',
                [themeSlug, word]
            );

            if (!existing) {
                await run(
                    'INSERT INTO word_search_words (theme_slug, word, created_at) VALUES (?, ?, ?)',
                    [themeSlug, word, now]
                );
                wordCount++;
            }
        }
    }
    console.log(`  ✅ ${wordCount} new words seeded (${genericWords.length} generic + ${Object.keys(wordLists).length} themes)`);
}

module.exports = { seedWords };
