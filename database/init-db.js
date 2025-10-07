const { initializeDatabase } = require('./initialize');

// Forcer l'initialisation complète de la base
initializeDatabase()
  .then(() => {
    console.log('🎉 Database initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  });
