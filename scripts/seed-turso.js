const dotenv = require('dotenv');

// Charger le .env AVANT tout le reste
dotenv.config();

// Vérifier que Turso est configuré
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env');
    process.exit(1);
}

// Maintenant on peut require le seed qui utilisera Turso
require('../prisma/seed.js');
