// Point d'entrée de l'application admin

// Cette fonction sera appelée par le HTML après que l'auth soit prête
async function initAdminPanel() {
    console.log('🔧 Initializing admin panel modules...');

    // Initialiser l'interface commune
    adminUI.init();

    // Initialiser les modules
    await adminUsers.init();
    await adminCards.init();

    console.log('✅ Admin panel loaded successfully');
}
