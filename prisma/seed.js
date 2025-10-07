const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ========================================
  // Seed User Demo
  // ========================================
  console.log('👤 Seeding demo user...');

  const user = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@example.com',
      password: 'demo123'
    }
  });

  console.log('✅ Demo user created');

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
    { name: 'Soleil', image: 'images/soleil.jpg', category: 'espace', base_rarity: 'legendary', description: 'Notre étoile, source de toute vie sur Terre.' },
    { name: 'Lune', image: 'images/lune.jpg', category: 'espace', base_rarity: 'common', description: 'Satellite naturel de la Terre.' },
    { name: 'Mars', image: 'images/mars.jpg', category: 'espace', base_rarity: 'rare', description: 'La planète rouge, future destination humaine.' },
    { name: 'Saturne', image: 'images/saturne.jpg', category: 'espace', base_rarity: 'very_rare', description: 'Planète aux magnifiques anneaux.' },
    { name: 'Trou Noir', image: 'images/trou_noir.webp', category: 'espace', base_rarity: 'epic', description: 'Objet cosmique d\'une densité infinie.' },
    { name: 'Galaxie', image: 'images/galaxie.jpg', category: 'espace', base_rarity: 'epic', description: 'Amas de milliards d\'étoiles.' },
    { name: 'Comète', image: 'images/comete.jpg', category: 'espace', base_rarity: 'rare', description: 'Voyageuse glacée des confins du système solaire.' },
    { name: 'Nébuleuse', image: 'images/nebuleuse.webp', category: 'espace', base_rarity: 'very_rare', description: 'Nuage cosmique où naissent les étoiles.' },

    // DINOSAURES (8 cartes)
    { name: 'T-Rex', image: 'images/t_rex.png', category: 'dinosaure', base_rarity: 'legendary', description: 'Le roi des prédateurs du Crétacé.' },
    { name: 'Tricératops', image: 'images/triceratops.webp', category: 'dinosaure', base_rarity: 'rare', description: 'Herbivore aux trois cornes impressionnantes.' },
    { name: 'Vélociraptor', image: 'images/velociraptor.webp', category: 'dinosaure', base_rarity: 'very_rare', description: 'Chasseur intelligent et redoutable.' },
    { name: 'Diplodocus', image: 'images/diplodocus.jpg', category: 'dinosaure', base_rarity: 'common', description: 'Géant au long cou et à la longue queue.' },
    { name: 'Ptérodactyle', image: 'images/pterodactyle.jpg', category: 'dinosaure', base_rarity: 'rare', description: 'Reptile volant des temps préhistoriques.' },
    { name: 'Spinosaure', image: 'images/spinosaure.webp', category: 'dinosaure', base_rarity: 'epic', description: 'Prédateur aquatique à la voile dorsale.' },
    { name: 'Ankylosaure', image: 'images/ankylosaure.jpg', category: 'dinosaure', base_rarity: 'common', description: 'Herbivore blindé comme un tank.' },
    { name: 'Archéoptéryx', image: 'images/archeopteryx.jpg', category: 'dinosaure', base_rarity: 'epic', description: 'Lien évolutif entre dinosaures et oiseaux.' }
  ];

  for (const card of cards) {
    await prisma.card.upsert({
      where: { name: card.name },
      update: {
        image: card.image,
        category: card.category,
        base_rarity: card.base_rarity,
        description: card.description
      },
      create: card,
    });
  }

  console.log(`✅ ${cards.length} cards seeded`);

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
      is_active: true,
    },
    {
      type: 'subtraction',
      reward: 2,
      max_per_day: 3,
      min_value: 100,
      max_value: 999,
      is_active: true,
    },
    {
      type: 'multiplication',
      reward: 5,
      max_per_day: 3,
      min_value: 10,
      max_value: 99,
      is_active: true,
    },
  ];

  for (const op of operations) {
    await prisma.bonusOperation.upsert({
      where: { type: op.type },
      update: {},
      create: op,
    });
  }

  console.log(`✅ ${operations.length} bonus operations seeded`);

  // ========================================
  // Seed User Credits
  // ========================================
  console.log('💰 Seeding user credits...');

  await prisma.userCredit.upsert({
    where: { user_id: user.id },
    update: {},
    create: {
      user_id: user.id,
      credits: 10
    }
  });

  console.log('✅ 10 initial credits created for demo user');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
