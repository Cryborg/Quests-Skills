// Point d'entrée principal de l'application
class App {
    constructor() {
        this.isInitialized = false;
    }

    // Initialise l'application
    async init() {
        if (this.isInitialized) return;

        try {
            console.log('🃏 Initialisation de l\'album de collection...');

            // Initialise la base de données
            console.log('📊 Chargement de la base de données...');

            // Charge la collection depuis l'API pour initialiser le cache
            console.log('🔄 Chargement de la collection...');
            await DB.getCollection();

            // Initialise l'interface utilisateur
            console.log('🎨 Initialisation de l\'interface...');
            await UI.init();

            // Mettre à jour le titre avec le nom de l'utilisateur
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                const titleEl = document.getElementById('album-title');
                if (titleEl) {
                    titleEl.textContent = `🃏 Album de ${currentUser.username}`;
                }
            }

            // Affiche les informations de debug si en mode développement
            if (this.isDevelopmentMode()) {
                this.showDebugInfo();
            }

            this.isInitialized = true;
            console.log('✅ Application initialisée avec succès !');

            // Affiche un message de bienvenue
            this.showWelcomeMessage();

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            UI.showToast('Erreur lors du chargement du jeu', 'error');
        }
    }

    // Vérifie si on est en mode développement
    isDevelopmentMode() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }

    // Affiche les informations de debug
    showDebugInfo() {
        const stats = CARD_SYSTEM.getDetailedStats();
        console.log('🔍 Statistiques de collection:', stats);

        // Ajoute des raccourcis de debug au window
        window.DEBUG = {
            // Reset complet
            reset: () => {
                DB.resetDatabase();
                UI.render();
                console.log('🔄 Base de données réinitialisée');
            },

            // Ajoute une carte spécifique
            addCard: (cardId) => {
                const card = DB.getCardById(cardId);
                if (card) {
                    DB.addToCollection(cardId);
                    UI.render();
                    console.log(`✅ Carte ${card.name} ajoutée à la collection`);
                } else {
                    console.log(`❌ Carte ${cardId} introuvable`);
                }
            },

            // Ajoute toutes les cartes
            addAllCards: () => {
                const allCards = DB.getAllCards();
                allCards.forEach(card => {
                    DB.addToCollection(card.id);
                });
                UI.render();
                console.log(`✅ Toutes les cartes (${allCards.length}) ajoutées à la collection`);
            },

            // Simulation de pioches
            simulate: (count = 10) => {
                const results = CARD_SYSTEM.simulateDraws(count);
                console.log(`🎲 Simulation de ${count} pioches:`, results);
                return results;
            },

            // Force une pioche
            forceDraw: () => {
                // Temporairement désactive le cooldown
                const originalTime = UTILS.loadFromStorage(CONFIG.STORAGE_KEYS.LAST_DRAW, 0);
                UTILS.saveToStorage(CONFIG.STORAGE_KEYS.LAST_DRAW, 0);

                const result = CARD_SYSTEM.drawCard();
                UI.render();

                // Restaure le cooldown original
                UTILS.saveToStorage(CONFIG.STORAGE_KEYS.LAST_DRAW, originalTime);

                console.log('🎁 Pioche forcée:', result);
                return result;
            },

            // Affiche les statistiques
            stats: () => {
                const stats = CARD_SYSTEM.getDetailedStats();
                console.table(stats.rarityStats);
                return stats;
            },

            // Liste toutes les cartes
            listCards: (theme = null) => {
                const cards = theme ?
                    DB.getCardsByTheme(theme) :
                    DB.getAllCards();
                console.table(cards);
                return cards;
            },

            // Ajoute des crédits (pratique pour les tests)
            addCredits: async (amount = 100) => {
                const newCredits = await DB.addCredits(amount);
                await UI.render();
                console.log(`✅ +${amount} crédits ajoutés ! Total: ${newCredits}/${CONFIG.CREDITS.MAX_STORED}`);
                return newCredits;
            },

            // Fonction de test : ajoute 200 cartes de test
            addTestCards: () => {
                // Ajoute 200 Creeper (Minecraft)
                for(let i = 0; i < 200; i++) { DB.addToCollection('mc_01'); }
                console.log('✅ 200 Creeper ajoutés');

                // Ajoute 200 Lune (Astronomie)
                for(let i = 0; i < 200; i++) { DB.addToCollection('space_02'); }
                console.log('✅ 200 Lune ajoutés');

                // Ajoute 200 Diplodocus (Dinosaures)
                for(let i = 0; i < 200; i++) { DB.addToCollection('dino_04'); }
                console.log('✅ 200 Diplodocus ajoutés');

                UI.render();
                console.log('🎉 Test prêt ! Tu peux maintenant améliorer ces cartes jusqu\'au niveau Légendaire !');
            }
        };

        console.log('🛠️ Mode debug activé ! Commandes disponibles:');
        console.log('- DEBUG.reset() - Remet à zéro la collection');
        console.log('- DEBUG.addCard(id) - Ajoute une carte spécifique');
        console.log('- DEBUG.addAllCards() - Ajoute toutes les cartes');
        console.log('- DEBUG.addCredits(amount) - Ajoute des crédits (défaut: 100)');
        console.log('- DEBUG.simulate(count) - Simule des pioches');
        console.log('- DEBUG.forceDraw() - Force une pioche');
        console.log('- DEBUG.stats() - Affiche les statistiques');
        console.log('- DEBUG.listCards(theme) - Liste les cartes');
    }

    // Message de bienvenue
    showWelcomeMessage() {
        const stats = DB.getCollectionStats();

        if (stats.ownedCards === 0) {
            setTimeout(() => {
                UI.showToast('Bienvenue ! Commence ta collection en piochant ta première carte 🎁', 'info', 5000);
            }, 1000);
        } else {
            const upgradeableCards = CARD_SYSTEM.getUpgradeableCards().length;
            if (upgradeableCards > 0) {
                setTimeout(() => {
                    UI.showToast(`Tu peux améliorer ${upgradeableCards} carte(s) ! 🔺`, 'info', 4000);
                }, 2000);
            }
        }
    }

    // Gestion des erreurs globales
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('❌ Erreur JavaScript:', event.error);
            UI.showToast('Une erreur s\'est produite', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Promesse rejetée:', event.reason);
            UI.showToast('Erreur de connexion', 'error');
        });
    }

    // Gestion de la sauvegarde automatique
    setupAutoSave() {
        // Sauvegarde toutes les 30 secondes (en prévision de la version serveur)
        setInterval(() => {
            // Pour le moment, le localStorage se sauvegarde automatiquement
            // Plus tard, on pourra implémenter une synchronisation serveur ici
            console.log('💾 Sauvegarde automatique...');
        }, 30000);
    }

    // Gestion de la visibilité de la page
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 Application en arrière-plan');
            } else {
                console.log('📱 Application au premier plan');
                // Actualise l'affichage au retour
                UI.render();
            }
        });
    }

    // Nettoyage avant fermeture
    cleanup() {
        console.log('🧹 Nettoyage de l\'application...');

        if (UI && typeof UI.destroy === 'function') {
            UI.destroy();
        }

        // Nettoie les autres ressources si nécessaire
    }

}

// Initialisation de l'application
const app = new App();

// Démarre l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    app.setupErrorHandling();
    app.setupAutoSave();
    app.setupVisibilityHandling();
    app.init();
});

// Nettoyage avant fermeture de la page
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// Export pour compatibilité future
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}