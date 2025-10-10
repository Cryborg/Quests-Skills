/**
 * Fichier commun qui charge tous les scripts partagés
 * À inclure en premier dans chaque module
 */

// Fonction d'initialisation commune pour tous les modules
window.initializeApp = async function(moduleInitFunction, options = {}) {
    try {
        const isAuth = await authService.init();

        if (!isAuth) {
            window.location.href = '/';
            return;
        }

        // Vérification admin si nécessaire
        if (options.requireAdmin && !authService.isAdmin()) {
            alert('Accès réservé aux administrateurs');
            window.location.href = '/modules/cards/index.html';
            return;
        }

        await navigationUI.init();

        // Appeler la fonction d'initialisation spécifique au module si fournie
        if (typeof moduleInitFunction === 'function') {
            await moduleInitFunction();
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        window.location.href = '/';
    }
};

// Charger les scripts dans l'ordre avec chemins absolus
(function() {
    const scriptsToLoad = [
        '/shared/js/config.js',
        '/shared/js/modals.js',
        '/shared/js/page-header.js',
        '/shared/js/credits-manager.js',
        '/shared/js/auth.js',
        '/shared/js/theme-selector.js',
        '/shared/js/navigation.js',
        '/shared/js/toast.js',
        '/shared/js/game-attempts.js',
        '/shared/js/button-spinner.js'
    ];

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Charger tous les scripts séquentiellement
    async function loadAllScripts() {
        try {
            for (const src of scriptsToLoad) {
                await loadScript(src);
            }

            // Dispatcher un événement quand tous les scripts sont chargés
            window.dispatchEvent(new Event('common-scripts-loaded'));

            // Appeler la callback globale si elle existe
            if (typeof window.onCommonScriptsLoaded === 'function') {
                window.onCommonScriptsLoaded();
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des scripts communs:', error);
        }
    }

    loadAllScripts();
})();
