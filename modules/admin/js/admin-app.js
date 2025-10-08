// Point d'entrée de l'application admin

// Cette fonction sera appelée par le HTML après que l'auth soit prête
async function initAdminPanel() {
    console.log('🔧 Initializing admin panel modules...');

    // Créer le header de page
    PageHeader.render({
        icon: '👑',
        title: 'Panneau d\'Administration'
    });

    // Initialiser l'interface commune
    adminUI.init();

    // Initialiser les modules
    // Note: adminCards gère maintenant aussi les thèmes
    await adminUsers.init();
    await adminCards.init();

    console.log('✅ Admin panel loaded successfully');
}
