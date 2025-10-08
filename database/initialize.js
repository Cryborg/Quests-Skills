const { db, query, get, run } = require('../server/turso-db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Variable pour éviter les initialisations répétées
let databaseInitialized = false;

// Détecter l'environnement
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

/**
 * Initialisation complète de la base de données
 * Crée les tables et seed les données initiales
 */
async function initializeDatabase() {
  if (databaseInitialized) {
    console.log('✅ Database already initialized in this process');
    return;
  }

  try {
    console.log('🚀 Starting database initialization...');

    // Créer le répertoire database/ en dev si nécessaire
    if (!isProduction) {
      const dbDir = path.join(process.cwd(), 'database');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('📁 Created database directory');
      }
    }

    // Créer les tables
    await createTables();

    // Seed les données initiales
    await seedInitialData();

    databaseInitialized = true;
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Vérification légère de l'existence de la base
 * Utilisée par les routes API
 */
async function ensureDatabaseExists() {
  if (databaseInitialized) {
    return;
  }

  try {
    // Tester si les tables principales existent
    const result = await query(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name IN ('users', 'cards', 'user_credits', 'card_themes', 'user_themes')"
    );
    const tableCount = result.rows[0]?.count || 0;

    if (tableCount < 5) {
      console.log('⚠️  Missing core tables, initializing database...');
      await initializeDatabase();
    } else {
      console.log('✅ Database tables verified');
      databaseInitialized = true;
    }
  } catch (error) {
    console.log('⚠️  Database check failed, attempting initialization...');
    try {
      await initializeDatabase();
    } catch (initError) {
      console.error('❌ Failed to auto-initialize database:', initError);
      throw new Error('Database not initialized. Please run the initialization script.');
    }
  }
}

/**
 * Création de toutes les tables
 */
async function createTables() {
  console.log('📦 Creating database tables...');

  // Table users
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  console.log('  ✓ users');

  // Table card_themes
  await query(`
    CREATE TABLE IF NOT EXISTS card_themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  console.log('  ✓ card_themes');

  // Table cards
  await query(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      image TEXT NOT NULL,
      category TEXT NOT NULL,
      base_rarity TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  console.log('  ✓ cards');

  // Table user_credits
  await query(`
    CREATE TABLE IF NOT EXISTS user_credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      credits INTEGER DEFAULT 0,
      last_daily_claim TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('  ✓ user_credits');

  // Table user_cards (pivot)
  await query(`
    CREATE TABLE IF NOT EXISTS user_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_id INTEGER NOT NULL,
      current_rarity TEXT NOT NULL DEFAULT 'common',
      quantity INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    )
  `);
  console.log('  ✓ user_cards');

  // Table bonus_operations
  await query(`
    CREATE TABLE IF NOT EXISTS bonus_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT UNIQUE NOT NULL,
      reward INTEGER NOT NULL,
      max_per_day INTEGER NOT NULL,
      min_value INTEGER NOT NULL,
      max_value INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  console.log('  ✓ bonus_operations');

  // Table bonus_history
  await query(`
    CREATE TABLE IF NOT EXISTS bonus_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      operation_type TEXT NOT NULL,
      reward INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('  ✓ bonus_history');

  // Table operation_attempts
  await query(`
    CREATE TABLE IF NOT EXISTS operation_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      operation_type TEXT NOT NULL,
      exercise TEXT,
      user_answers TEXT,
      success INTEGER DEFAULT 0,
      cards_earned INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('  ✓ operation_attempts');

  // Table user_themes (préférences de thèmes par utilisateur)
  await query(`
    CREATE TABLE IF NOT EXISTS user_themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      theme_slug TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (theme_slug) REFERENCES card_themes(slug) ON DELETE CASCADE,
      UNIQUE(user_id, theme_slug)
    )
  `);
  console.log('  ✓ user_themes');

  // Créer les index
  console.log('📑 Creating indexes...');

  try {
    await query('CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON user_cards(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_cards_card_id ON user_cards(card_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_bonus_history_user_id ON bonus_history(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_bonus_history_created_at ON bonus_history(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_operation_attempts_user_id ON operation_attempts(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_operation_attempts_created_at ON operation_attempts(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON user_themes(user_id)');
    console.log('  ✓ Indexes created');
  } catch (error) {
    console.log('  ⚠️  Some indexes may already exist');
  }

  console.log('✅ All tables created');
}

/**
 * Seed des données initiales
 */
async function seedInitialData() {
  console.log('🌱 Seeding initial data...');

  // ========================================
  // Seed Card Themes
  // ========================================
  console.log('🎨 Seeding card themes...');

  const themes = [
    { slug: 'minecraft', name: 'Minecraft', icon: '🟫' },
    { slug: 'space', name: 'Astronomie', icon: '🌌' },
    { slug: 'dinosaurs', name: 'Dinosaures', icon: '🦕' }
  ];

  let themeCount = 0;
  for (const theme of themes) {
    const existing = await get('SELECT * FROM card_themes WHERE slug = ?', [theme.slug]);
    const now = new Date().toISOString();

    if (!existing) {
      await run(
        'INSERT INTO card_themes (slug, name, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [theme.slug, theme.name, theme.icon, now, now]
      );
      themeCount++;
    }
  }
  console.log(`  ✅ ${themeCount} new themes seeded (${themes.length} total)`);

  // ========================================
  // Seed Admin User (Cryborg)
  // ========================================
  console.log('👤 Seeding admin user...');

  let adminUser = await get('SELECT * FROM users WHERE email = ?', ['cryborg.live@gmail.com']);

  if (!adminUser) {
    const now = new Date().toISOString();
    const hashedPassword = await bcrypt.hash('Célibataire1979$', 10);
    await run(
      'INSERT INTO users (username, email, password, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['Cryborg', 'cryborg.live@gmail.com', hashedPassword, 1, now, now]
    );
    adminUser = await get('SELECT * FROM users WHERE email = ?', ['cryborg.live@gmail.com']);

    // Créer les crédits initiaux pour l'admin (5 crédits de départ)
    await run(
      'INSERT INTO user_credits (user_id, credits, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [adminUser.id, 5, now, now]
    );

    // Activer tous les thèmes par défaut pour l'admin
    for (const theme of themes) {
      await run(
        'INSERT OR IGNORE INTO user_themes (user_id, theme_slug, created_at) VALUES (?, ?, ?)',
        [adminUser.id, theme.slug, now]
      );
    }

    console.log('  ✅ Admin user created with 5 credits and all themes enabled');
  } else {
    console.log('  ✅ Admin user already exists');
  }

  // ========================================
  // Seed Demo User
  // ========================================
  console.log('👤 Seeding demo user...');

  let user = await get('SELECT * FROM users WHERE username = ?', ['demo']);

  if (!user) {
    const now = new Date().toISOString();
    const hashedPassword = await bcrypt.hash('demo123', 10);
    await run(
      'INSERT INTO users (username, email, password, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['demo', 'demo@example.com', hashedPassword, 0, now, now]
    );
    user = await get('SELECT * FROM users WHERE username = ?', ['demo']);

    // Créer les crédits initiaux pour le demo user (10 crédits)
    await run(
      'INSERT INTO user_credits (user_id, credits, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [user.id, 10, now, now]
    );

    // Activer tous les thèmes par défaut pour le demo user
    for (const theme of themes) {
      await run(
        'INSERT OR IGNORE INTO user_themes (user_id, theme_slug, created_at) VALUES (?, ?, ?)',
        [user.id, theme.slug, now]
      );
    }

    console.log('  ✅ Demo user created with 10 credits and all themes enabled');
  } else {
    console.log('  ✅ Demo user already exists');
  }

  // ========================================
  // Seed Cards
  // ========================================
  console.log('📦 Seeding cards...');

  const cards = [
    // MINECRAFT (8 cartes)
    { name: 'Creeper', image: 'images/creeper.webp', category: 'minecraft', base_rarity: 'common', description: 'Une créature explosive qui détruit tout sur son passage.' },
    { name: 'Enderman', image: 'images/enderman.webp', category: 'minecraft', base_rarity: 'rare', description: 'Être mystérieux capable de téléportation.' },
    { name: 'Diamant', image: 'images/diamant.webp', category: 'minecraft', base_rarity: 'very_rare', description: 'Le minerai le plus précieux du monde de Minecraft.' },
    { name: 'Ender Dragon', image: 'images/ender_dragon.webp', category: 'minecraft', base_rarity: 'epic', description: 'Le boss final qui règne sur l\'End.' },
    { name: 'Steve', image: 'images/steve.webp', category: 'minecraft', base_rarity: 'legendary', description: 'Le héros légendaire de Minecraft.' },
    { name: 'Zombie', image: 'images/zombie.webp', category: 'minecraft', base_rarity: 'common', description: 'Mort-vivant qui erre dans la nuit.' },
    { name: 'Wither', image: 'images/wither.webp', category: 'minecraft', base_rarity: 'epic', description: 'Boss destructeur aux trois têtes.' },
    { name: 'Émeraude', image: 'images/emeraude.webp', category: 'minecraft', base_rarity: 'rare', description: 'Gemme précieuse pour le commerce.' },

    // ESPACE (8 cartes)
    { name: 'Soleil', image: 'images/soleil.jpg', category: 'space', base_rarity: 'legendary', description: 'Notre étoile, source de toute vie sur Terre.' },
    { name: 'Lune', image: 'images/lune.jpg', category: 'space', base_rarity: 'common', description: 'Satellite naturel de la Terre.' },
    { name: 'Mars', image: 'images/mars.jpg', category: 'space', base_rarity: 'rare', description: 'La planète rouge, future destination humaine.' },
    { name: 'Saturne', image: 'images/saturne.jpg', category: 'space', base_rarity: 'very_rare', description: 'Planète aux magnifiques anneaux.' },
    { name: 'Trou Noir', image: 'images/trou_noir.webp', category: 'space', base_rarity: 'epic', description: 'Objet cosmique d\'une densité infinie.' },
    { name: 'Galaxie', image: 'images/galaxie.jpg', category: 'space', base_rarity: 'epic', description: 'Amas de milliards d\'étoiles.' },
    { name: 'Comète', image: 'images/comete.jpg', category: 'space', base_rarity: 'rare', description: 'Voyageuse glacée des confins du système solaire.' },
    { name: 'Nébuleuse', image: 'images/nebuleuse.webp', category: 'space', base_rarity: 'very_rare', description: 'Nuage cosmique où naissent les étoiles.' },

    // DINOSAURES (8 cartes)
    { name: 'T-Rex', image: 'images/t_rex.png', category: 'dinosaurs', base_rarity: 'legendary', description: 'Le roi des prédateurs du Crétacé.' },
    { name: 'Tricératops', image: 'images/triceratops.webp', category: 'dinosaurs', base_rarity: 'rare', description: 'Herbivore aux trois cornes impressionnantes.' },
    { name: 'Vélociraptor', image: 'images/velociraptor.webp', category: 'dinosaurs', base_rarity: 'very_rare', description: 'Chasseur intelligent et redoutable.' },
    { name: 'Diplodocus', image: 'images/diplodocus.jpg', category: 'dinosaurs', base_rarity: 'common', description: 'Géant au long cou et à la longue queue.' },
    { name: 'Ptérodactyle', image: 'images/pterodactyle.jpg', category: 'dinosaurs', base_rarity: 'rare', description: 'Reptile volant des temps préhistoriques.' },
    { name: 'Spinosaure', image: 'images/spinosaure.webp', category: 'dinosaurs', base_rarity: 'epic', description: 'Prédateur aquatique à la voile dorsale.' },
    { name: 'Ankylosaure', image: 'images/ankylosaure.jpg', category: 'dinosaurs', base_rarity: 'common', description: 'Herbivore blindé comme un tank.' },
    { name: 'Archéoptéryx', image: 'images/archeopteryx.jpg', category: 'dinosaurs', base_rarity: 'epic', description: 'Lien évolutif entre dinosaures et oiseaux.' }
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

  // ========================================
  // Seed Bonus Operations
  // ========================================
  console.log('🎓 Seeding bonus operations...');

  const operations = [
    {
      type: 'addition',
      reward: 1,
      max_per_day: 3,
      min_value: 100,
      max_value: 9999,
      is_active: 1,
    },
    {
      type: 'subtraction',
      reward: 2,
      max_per_day: 3,
      min_value: 100,
      max_value: 999,
      is_active: 1,
    },
    {
      type: 'multiplication',
      reward: 5,
      max_per_day: 3,
      min_value: 10,
      max_value: 99,
      is_active: 1,
    },
  ];

  let opCount = 0;
  for (const op of operations) {
    const existing = await get('SELECT * FROM bonus_operations WHERE type = ?', [op.type]);

    if (!existing) {
      const now = new Date().toISOString();
      await run(
        'INSERT INTO bonus_operations (type, reward, max_per_day, min_value, max_value, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [op.type, op.reward, op.max_per_day, op.min_value, op.max_value, op.is_active, now, now]
      );
      opCount++;
    }
  }
  console.log(`  ✅ ${opCount} new bonus operations seeded (${operations.length} total)`);

  console.log('✅ Initial data seeded');
}

module.exports = {
  initializeDatabase,
  ensureDatabaseExists
};
