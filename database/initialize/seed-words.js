const { get, run } = require('../../server/turso-db');

/**
 * Seed Word Search Words
 */
async function seedWords() {
    console.log('🔤 Seeding word search words...');

    // Mots génériques (disponibles pour tous - theme_slug = NULL)
    // Format: [mot, définition]
    const genericWords = [
        // Nature
        ['SOLEIL', 'Étoile au centre du système solaire'],
        ['ARBRE', 'Plante avec un tronc et des branches'],
        ['FLEUR', 'Partie colorée d\'une plante'],
        ['NUAGE', 'Amas de vapeur d\'eau dans le ciel'],
        ['PLUIE', 'Eau qui tombe du ciel'],
        ['NEIGE', 'Cristaux de glace qui tombent'],
        ['VENT', 'Mouvement de l\'air'],
        ['ORAGE', 'Pluie avec tonnerre et éclairs'],
        ['MONTAGNE', 'Très grande élévation de terre'],
        ['RIVIERE', 'Cours d\'eau qui coule'],
        ['FORET', 'Grand espace plein d\'arbres'],
        ['PLAGE', 'Bord de mer avec du sable'],
        ['JARDIN', 'Terrain avec des plantes'],
        ['PRAIRIE', 'Grande étendue d\'herbe'],
        ['LAC', 'Grande étendue d\'eau douce'],
        ['MER', 'Grande étendue d\'eau salée'],

        // Animaux
        ['CHAT', 'Petit félin domestique'],
        ['CHIEN', 'Animal fidèle de l\'homme'],
        ['OISEAU', 'Animal avec des plumes qui vole'],
        ['POISSON', 'Animal qui vit dans l\'eau'],
        ['PAPILLON', 'Insecte aux ailes colorées'],
        ['ABEILLE', 'Insecte qui fait du miel'],
        ['FOURMI', 'Petit insecte très travailleur'],
        ['COCCINELLE', 'Petit insecte rouge à pois noirs'],
        ['SOURIS', 'Petit rongeur gris'],
        ['LAPIN', 'Animal aux longues oreilles'],
        ['OURS', 'Grand mammifère poilu'],
        ['LION', 'Grand félin, roi des animaux'],
        ['TIGRE', 'Grand félin rayé'],
        ['ELEPHANT', 'Gros animal avec une trompe'],
        ['GIRAFE', 'Animal au très long cou'],
        ['ZEBRE', 'Cheval rayé noir et blanc'],
        ['SINGE', 'Animal qui grimpe aux arbres'],
        ['SERPENT', 'Reptile sans pattes'],
        ['TORTUE', 'Reptile avec une carapace'],
        ['BALEINE', 'Plus gros animal marin'],
        ['REQUIN', 'Gros poisson avec des dents'],
        ['DAUPHIN', 'Mammifère marin intelligent'],
        ['CRABE', 'Crustacé avec des pinces'],
        ['CREVETTE', 'Petit crustacé marin'],
        ['GRENOUILLE', 'Petit amphibien qui saute'],
        ['CANARD', 'Oiseau aquatique qui fait coin'],
        ['POULE', 'Oiseau de basse-cour'],
        ['COQ', 'Mâle de la poule'],
        ['VACHE', 'Animal qui donne du lait'],
        ['MOUTON', 'Animal avec de la laine'],
        ['CHEVAL', 'Animal qu\'on peut monter'],
        ['ANE', 'Animal avec de longues oreilles'],

        // Nourriture
        ['POMME', 'Fruit rouge ou vert'],
        ['BANANE', 'Fruit jaune et courbé'],
        ['ORANGE', 'Fruit rond et orange'],
        ['FRAISE', 'Petit fruit rouge sucré'],
        ['CERISE', 'Petit fruit rouge à noyau'],
        ['RAISIN', 'Petits fruits en grappe'],
        ['MELON', 'Gros fruit d\'été sucré'],
        ['POIRE', 'Fruit jaune en forme de cloche'],
        ['CAROTTE', 'Légume orange et croquant'],
        ['TOMATE', 'Fruit rouge qu\'on mange'],
        ['SALADE', 'Feuilles vertes à manger'],
        ['PAIN', 'Aliment fait avec de la farine'],
        ['FROMAGE', 'Produit fait avec du lait'],
        ['LAIT', 'Boisson blanche des vaches'],
        ['CHOCOLAT', 'Friandise marron sucrée'],
        ['GATEAU', 'Pâtisserie sucrée'],
        ['BONBON', 'Petite friandise sucrée'],
        ['GLACE', 'Dessert glacé et sucré'],
        ['JUS', 'Boisson de fruits pressés'],
        ['BISCUIT', 'Petit gâteau sec'],
        ['CONFITURE', 'Fruits cuits avec du sucre'],
        ['MIEL', 'Substance sucrée des abeilles'],
        ['SOUPE', 'Plat liquide et chaud'],
        ['PIZZA', 'Plat italien avec de la pâte'],

        // Objets du quotidien
        ['MAISON', 'Bâtiment où on habite'],
        ['ECOLE', 'Lieu où on apprend'],
        ['LIVRE', 'Objet pour lire des histoires'],
        ['JOUET', 'Objet pour s\'amuser'],
        ['BALLON', 'Objet rond pour jouer'],
        ['VELO', 'Véhicule à deux roues'],
        ['POUPEE', 'Jouet en forme de bébé'],
        ['ROBOT', 'Machine qui peut bouger'],
        ['CRAYON', 'Outil pour dessiner'],
        ['STYLO', 'Outil pour écrire'],
        ['CAHIER', 'Livret pour écrire'],
        ['SAC', 'Objet pour transporter'],
        ['CHAISE', 'Meuble pour s\'asseoir'],
        ['TABLE', 'Meuble plat sur pieds'],
        ['LIT', 'Meuble pour dormir'],
        ['PORTE', 'Ouverture pour entrer'],
        ['FENETRE', 'Ouverture avec du verre'],
        ['LAMPE', 'Objet qui fait de la lumière'],
        ['HORLOGE', 'Objet qui donne l\'heure'],
        ['TELEPHONE', 'Appareil pour appeler'],
        ['ORDINATEUR', 'Machine électronique'],
        ['TELEVISION', 'Écran pour regarder'],
        ['RADIO', 'Appareil pour écouter'],

        // Transports
        ['VOITURE', 'Véhicule à quatre roues'],
        ['TRAIN', 'Transport sur des rails'],
        ['AVION', 'Appareil qui vole'],
        ['BATEAU', 'Véhicule qui flotte'],
        ['BUS', 'Grand transport collectif'],
        ['CAMION', 'Gros véhicule pour transporter'],
        ['MOTO', 'Véhicule à deux roues motorisé'],
        ['TRACTEUR', 'Véhicule agricole'],
        ['HELICOPTERE', 'Appareil volant à hélices'],
        ['FUSEE', 'Engin qui va dans l\'espace'],
        ['METRO', 'Train sous terre'],
        ['TRAMWAY', 'Train de ville sur rails'],
        ['SKATE', 'Planche à roulettes'],
        ['TROTTINETTE', 'Planche avec guidon'],

        // Couleurs
        ['ROUGE', 'Couleur du sang'],
        ['BLEU', 'Couleur du ciel'],
        ['VERT', 'Couleur de l\'herbe'],
        ['JAUNE', 'Couleur du soleil'],
        ['NOIR', 'Couleur de la nuit'],
        ['BLANC', 'Couleur de la neige'],
        ['ROSE', 'Couleur claire et douce'],
        ['VIOLET', 'Mélange de rouge et bleu'],
        ['ORANGE', 'Mélange de rouge et jaune'],
        ['MARRON', 'Couleur du chocolat'],
        ['GRIS', 'Mélange de noir et blanc'],
        ['BEIGE', 'Couleur sable clair'],

        // Adjectifs
        ['GRAND', 'De grande taille'],
        ['PETIT', 'De petite taille'],
        ['CHAUD', 'À haute température'],
        ['FROID', 'À basse température'],
        ['HAUT', 'En hauteur'],
        ['BAS', 'Vers le sol'],
        ['RAPIDE', 'Qui va vite'],
        ['LENT', 'Qui va doucement'],
        ['HEUREUX', 'Qui ressent de la joie'],
        ['TRISTE', 'Qui a du chagrin'],
        ['JOYEUX', 'Plein de joie'],
        ['CONTENT', 'Satisfait et heureux'],
        ['DROLE', 'Qui fait rire'],
        ['GENTIL', 'Bon et agréable'],
        ['SAGE', 'Qui se comporte bien'],
        ['CALME', 'Tranquille et paisible'],
        ['FORT', 'Qui a de la puissance'],
        ['FAIBLE', 'Qui manque de force'],
        ['LEGER', 'Qui pèse peu'],
        ['LOURD', 'Qui pèse beaucoup'],
        ['DUR', 'Qui résiste au toucher'],
        ['MOU', 'Qui se déforme facilement'],
        ['DOUX', 'Agréable au toucher'],
        ['RUGUEUX', 'Qui racle la peau'],

        // Corps et sentiments
        ['TETE', 'Partie haute du corps'],
        ['MAIN', 'Partie au bout du bras'],
        ['PIED', 'Partie au bout de la jambe'],
        ['BRAS', 'Membre supérieur du corps'],
        ['JAMBE', 'Membre inférieur du corps'],
        ['OEIL', 'Organe pour voir'],
        ['NEZ', 'Organe pour sentir'],
        ['BOUCHE', 'Organe pour manger et parler'],
        ['OREILLE', 'Organe pour entendre'],
        ['COEUR', 'Organe qui bat dans la poitrine'],
        ['AMOUR', 'Sentiment d\'affection'],
        ['AMITIE', 'Relation entre amis'],
        ['PEUR', 'Sentiment de danger'],
        ['COURAGE', 'Force face au danger'],
        ['FORCE', 'Pouvoir physique'],
        ['JOIE', 'Sentiment de bonheur'],

        // Eléments
        ['EAU', 'Liquide transparent'],
        ['FEU', 'Flammes qui brûlent'],
        ['TERRE', 'Sol sous nos pieds'],
        ['AIR', 'Gaz qu\'on respire'],
        ['PIERRE', 'Roche dure et solide'],
        ['SABLE', 'Petits grains sur la plage'],
        ['BOIS', 'Matière des arbres'],
        ['METAL', 'Matière dure et brillante'],

        // Famille et personnes
        ['FAMILLE', 'Groupe de parents proches'],
        ['AMI', 'Personne qu\'on aime bien'],
        ['PAPA', 'Père d\'un enfant'],
        ['MAMAN', 'Mère d\'un enfant'],
        ['FRERE', 'Fils des mêmes parents'],
        ['SOEUR', 'Fille des mêmes parents'],
        ['BEBE', 'Très jeune enfant'],
        ['ENFANT', 'Jeune garçon ou fille'],
        ['MAITRE', 'Personne qui enseigne'],
        ['DOCTEUR', 'Personne qui soigne'],
        ['POMPIER', 'Personne qui éteint les feux'],
        ['POLICIER', 'Personne qui protège'],
        ['CUISINIER', 'Personne qui fait à manger'],
        ['ARTISTE', 'Personne qui crée des œuvres'],

        // Activités
        ['JOUER', 'S\'amuser avec des jeux'],
        ['COURIR', 'Aller vite avec ses jambes'],
        ['SAUTER', 'S\'élever en l\'air'],
        ['NAGER', 'Se déplacer dans l\'eau'],
        ['DANSER', 'Bouger son corps en rythme'],
        ['CHANTER', 'Faire de la musique avec sa voix'],
        ['LIRE', 'Comprendre un texte écrit'],
        ['ECRIRE', 'Tracer des mots'],
        ['DESSINER', 'Faire une image'],
        ['PEINDRE', 'Créer avec de la peinture'],
        ['CONSTRUIRE', 'Assembler pour créer'],
        ['DORMIR', 'Fermer les yeux et se reposer'],
        ['MANGER', 'Avaler de la nourriture'],
        ['BOIRE', 'Avaler un liquide'],

        // Moments
        ['JOUR', 'Période de lumière'],
        ['NUIT', 'Période d\'obscurité'],
        ['MATIN', 'Début de la journée'],
        ['SOIR', 'Fin de la journée'],
        ['PRINTEMPS', 'Saison des fleurs'],
        ['ETE', 'Saison chaude'],
        ['AUTOMNE', 'Saison des feuilles mortes'],
        ['HIVER', 'Saison froide'],
        ['LUNDI', 'Premier jour de la semaine'],
        ['MARDI', 'Deuxième jour de la semaine'],
        ['MERCREDI', 'Troisième jour de la semaine'],
        ['JEUDI', 'Quatrième jour de la semaine'],
        ['VENDREDI', 'Cinquième jour de la semaine'],
        ['SAMEDI', 'Sixième jour de la semaine'],
        ['DIMANCHE', 'Septième jour de la semaine']
    ];

    // Mots par thème de cartes
    // Format: [mot, définition]
    const wordLists = {
        minecraft: [
            ['CREEPER', 'Monstre vert qui explose'],
            ['DIAMANT', 'Minerai bleu très rare'],
            ['PIOCHE', 'Outil pour miner des blocs'],
            ['COFFRE', 'Bloc pour stocker des objets'],
            ['TNT', 'Explosif rouge et blanc'],
            ['PORTAIL', 'Structure pour voyager'],
            ['VILLAGEOIS', 'Habitant des villages'],
            ['FERME', 'Lieu pour cultiver'],
            ['WITHER', 'Boss à trois têtes noires'],
            ['GOLEM', 'Créature qui protège'],
            ['EMERAUDE', 'Minerai vert pour échanger'],
            ['BIOME', 'Type de terrain naturel'],
            ['REDSTONE', 'Minerai rouge électrique'],
            ['ENDERMAN', 'Créature téléportante noire'],
            ['ZOMBIE', 'Mort-vivant hostile'],
            ['SQUELETTE', 'Monstre archer'],
            ['ARAIGNEE', 'Monstre à huit pattes'],
            ['SLIME', 'Cube vert qui saute'],
            ['BLOC', 'Élément de base du monde'],
            ['CRAFT', 'Fabrication d\'objets'],
            ['MINE', 'Creuser sous terre'],
            ['ENCHANTEMENT', 'Amélioration magique'],
            ['POTION', 'Boisson aux effets'],
            ['FOURNEAU', 'Cuire et fondre'],
            ['ENCLUME', 'Réparer et renommer'],
            ['EPEE', 'Arme de combat'],
            ['ARMURE', 'Protection du corps'],
            ['ARC', 'Arme de tir à distance'],
            ['FLECHE', 'Projectile de l\'arc'],
            ['BOUCLIER', 'Protection contre attaques'],
            ['CHARBON', 'Combustible noir'],
            ['FER', 'Minerai gris commun'],
            ['OBSIDIENNE', 'Roche noire très dure'],
            ['BEDROCK', 'Roche indestructible'],
            ['LAVE', 'Liquide orange brûlant'],
            ['BOIS', 'Matériau des arbres'],
            ['PIERRE', 'Bloc rocheux gris'],
            ['SABLE', 'Bloc qui tombe'],
            ['GRAVIER', 'Bloc gris qui tombe'],
            ['NEIGE', 'Bloc blanc froid'],
            ['GLACE', 'Eau gelée glissante'],
            ['CACTUS', 'Plante qui pique'],
            ['CHAMPIGNON', 'Plante du sous-bois'],
            ['BLE', 'Culture dorée'],
            ['POULET', 'Oiseau de ferme'],
            ['VACHE', 'Animal qui donne du lait'],
            ['MOUTON', 'Animal à laine'],
            ['COCHON', 'Animal rose'],
            ['CHEVAL', 'Animal à monter'],
            ['LOUP', 'Animal apprivoisable'],
            ['PERROQUET', 'Oiseau coloré'],
            ['PANDA', 'Ours noir et blanc'],
            ['RENARD', 'Animal rusé orange']
        ],
        space: [
            ['PLANETE', 'Corps céleste qui tourne'],
            ['ETOILE', 'Astre brillant la nuit'],
            ['FUSEE', 'Véhicule spatial'],
            ['GALAXIE', 'Amas d\'étoiles géant'],
            ['COMETE', 'Astre avec une queue'],
            ['SATELLITE', 'Objet en orbite'],
            ['ASTRONAUTE', 'Voyageur de l\'espace'],
            ['TELESCOPE', 'Lunette pour voir loin'],
            ['NEBULEUSE', 'Nuage de gaz spatial'],
            ['ESPACE', 'Vide entre les astres'],
            ['ASTEROIDE', 'Petit rocher spatial'],
            ['ORBITE', 'Trajectoire autour d\'un astre'],
            ['LUNE', 'Satellite naturel de la Terre'],
            ['SOLEIL', 'Étoile du système'],
            ['MARS', 'Planète rouge'],
            ['VENUS', 'Deuxième planète'],
            ['JUPITER', 'Plus grosse planète'],
            ['SATURNE', 'Planète aux anneaux'],
            ['MERCURE', 'Planète la plus proche'],
            ['URANUS', 'Septième planète'],
            ['NEPTUNE', 'Huitième planète'],
            ['PLUTON', 'Planète naine'],
            ['TERRE', 'Notre planète bleue'],
            ['COSMOS', 'Univers entier'],
            ['CONSTELLATION', 'Groupe d\'étoiles'],
            ['UNIVERS', 'Tout ce qui existe'],
            ['GRAVITE', 'Force d\'attraction'],
            ['ROVER', 'Robot explorateur'],
            ['STATION', 'Base spatiale'],
            ['HUBBLE', 'Télescope spatial célèbre'],
            ['APOLLO', 'Mission lunaire'],
            ['NASA', 'Agence spatiale américaine'],
            ['CASQUE', 'Protection de la tête'],
            ['SCAPHANDRE', 'Combinaison spatiale'],
            ['NAVETTE', 'Vaisseau réutilisable'],
            ['MODULE', 'Partie d\'un vaisseau'],
            ['CRATERE', 'Trou d\'impact'],
            ['ECLIPSE', 'Occultation d\'un astre'],
            ['METEORITE', 'Roche tombée du ciel'],
            ['PULSAR', 'Étoile qui pulse'],
            ['QUASAR', 'Objet très lumineux'],
            ['SUPERNOVA', 'Explosion d\'étoile'],
            ['ANNEAU', 'Cercle autour d\'une planète'],
            ['PHASE', 'Aspect de la Lune']
        ],
        dinosaurs: [
            ['TREX', 'Tyrannosaure Rex, roi carnivore'],
            ['FOSSILE', 'Reste pétrifié ancien'],
            ['JURASSIQUE', 'Période des dinosaures'],
            ['HERBIVORE', 'Qui mange des plantes'],
            ['CARNIVORE', 'Qui mange de la viande'],
            ['EXTINCTION', 'Disparition d\'espèces'],
            ['PREDATEUR', 'Chasseur d\'autres animaux'],
            ['PREHISTOIRE', 'Temps avant l\'écriture'],
            ['VELOCIRAPTOR', 'Petit dinosaure rapide'],
            ['TRICERATOPS', 'Dinosaure à trois cornes'],
            ['STEGOSAURE', 'Dinosaure à plaques dorsales'],
            ['DIPLODOCUS', 'Dinosaure à long cou'],
            ['BRACHIOSAURE', 'Grand herbivore géant'],
            ['ANKYLOSAURE', 'Dinosaure blindé'],
            ['PTERODACTYLE', 'Reptile volant'],
            ['SPINOSAURE', 'Dinosaure à voile dorsale'],
            ['ALLOSAURUS', 'Grand carnivore'],
            ['IGUANODON', 'Herbivore à pouce pointu'],
            ['ARCHEOPTERYX', 'Premier oiseau'],
            ['TYRANNOSAURE', 'Lézard tyran géant'],
            ['RAPTOR', 'Dinosaure chasseur rapide'],
            ['DENT', 'Pour mâcher et mordre'],
            ['GRIFFE', 'Ongle pointu'],
            ['ECAILLE', 'Plaque de peau'],
            ['OEUFS', 'Naissance des dinosaures'],
            ['CRANE', 'Os de la tête'],
            ['SQUELETTE', 'Ensemble des os'],
            ['OS', 'Partie dure du corps'],
            ['CRETACE', 'Dernière période'],
            ['TRIAS', 'Première période'],
            ['FOUILLES', 'Recherche de fossiles'],
            ['MUSEE', 'Lieu d\'exposition'],
            ['PLUMES', 'Certains en avaient'],
            ['REPTILE', 'Type d\'animal'],
            ['VOLCAN', 'Montagne de feu'],
            ['METEORITE', 'Roche de l\'espace'],
            ['EMPREINTE', 'Trace de pas']
        ],
        monuments: [
            ['PYRAMIDE', 'Monument égyptien triangulaire'],
            ['SPHINX', 'Statue lion à tête humaine'],
            ['COLISEE', 'Arène romaine antique'],
            ['LOUVRE', 'Musée parisien célèbre'],
            ['VERSAILLES', 'Château royal français'],
            ['TOWER', 'Tour de Londres'],
            ['KREMLIN', 'Forteresse de Moscou'],
            ['PARTHENON', 'Temple grec d\'Athènes'],
            ['ACROPOLE', 'Citadelle grecque haute'],
            ['TEMPLE', 'Lieu de culte ancien'],
            ['CATHEDRALE', 'Grande église'],
            ['BASILIQUE', 'Église importante'],
            ['CHAPELLE', 'Petite église'],
            ['EGLISE', 'Lieu de culte chrétien'],
            ['MOSQUE', 'Lieu de culte musulman'],
            ['PAGODE', 'Temple asiatique à étages'],
            ['CHATEAU', 'Demeure fortifiée'],
            ['PALAIS', 'Résidence royale'],
            ['FORTERESSE', 'Construction défensive'],
            ['CITADELLE', 'Fort sur hauteur'],
            ['MURAILLE', 'Long mur de défense'],
            ['PONT', 'Passage sur eau'],
            ['ARC', 'Voûte monumentale'],
            ['OBELISQUE', 'Pierre dressée pointue'],
            ['STATUE', 'Sculpture monumentale'],
            ['LIBERTE', 'Statue de New York'],
            ['COLONNE', 'Pilier vertical'],
            ['FORUM', 'Place romaine'],
            ['ARENE', 'Lieu de spectacles'],
            ['AMPHITHEATRE', 'Gradins en cercle'],
            ['RUINES', 'Restes d\'un monument'],
            ['SANCTUAIRE', 'Lieu sacré'],
            ['MEMORIAL', 'Monument du souvenir'],
            ['MAUSOLEE', 'Tombeau monumental'],
            ['TOMBEAU', 'Sépulture monumentale'],
            ['ZIGGURAT', 'Temple à étages'],
            ['STONEHENGE', 'Cercle de pierres'],
            ['ANGKOR', 'Temple du Cambodge'],
            ['MACHU', 'Cité inca au Pérou'],
            ['PICCHU', 'Suite de Machu'],
            ['TAJ', 'Début du monument indien'],
            ['MAHAL', 'Palais en Inde'],
            ['PETRA', 'Cité dans la roche'],
            ['ALHAMBRA', 'Palais mauresque espagnol'],
            ['SAGRADA', 'Basilique de Barcelone'],
            ['FAMILIA', 'Suite de Sagrada'],
            ['DAME', 'Notre-Dame de Paris'],
            ['WESTMINSTER', 'Abbaye de Londres'],
            ['PANTHEON', 'Temple romain'],
            ['REICHSTAG', 'Parlement allemand']
        ]
    };

    let wordCount = 0;
    let definitionsAdded = 0;
    const now = new Date().toISOString();

    // Insérer les mots génériques (theme_slug = NULL)
    for (const [word, definition] of genericWords) {
        const existing = await get(
            'SELECT * FROM word_search_words WHERE word = ? AND theme_slug IS NULL',
            [word]
        );

        if (!existing) {
            await run(
                'INSERT INTO word_search_words (theme_slug, word, definition, created_at) VALUES (NULL, ?, ?, ?)',
                [word, definition, now]
            );
            wordCount++;
        } else if (definition && !existing.definition) {
            // Mettre à jour la définition si elle n'existe pas
            await run(
                'UPDATE word_search_words SET definition = ? WHERE id = ?',
                [definition, existing.id]
            );
            definitionsAdded++;
        }
    }

    // Insérer les mots par thème
    for (const [themeSlug, words] of Object.entries(wordLists)) {
        for (const [word, definition] of words) {
            const existing = await get(
                'SELECT * FROM word_search_words WHERE theme_slug = ? AND word = ?',
                [themeSlug, word]
            );

            if (!existing) {
                await run(
                    'INSERT INTO word_search_words (theme_slug, word, definition, created_at) VALUES (?, ?, ?, ?)',
                    [themeSlug, word, definition, now]
                );
                wordCount++;
            } else if (definition && !existing.definition) {
                // Mettre à jour la définition si elle n'existe pas
                await run(
                    'UPDATE word_search_words SET definition = ? WHERE id = ?',
                    [definition, existing.id]
                );
                definitionsAdded++;
            }
        }
    }

    console.log(`  ✅ ${wordCount} new words seeded, ${definitionsAdded} definitions added (${genericWords.length} generic + ${Object.keys(wordLists).length} themes)`);
}

module.exports = { seedWords };
