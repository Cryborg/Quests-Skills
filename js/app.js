// Point d'entrée principal de l'application (adapté pour l'API)
class App {
    constructor() {
        this.isInitialized = false;
    }

    // Initialise l'application
    async init() {
        if (this.isInitialized) return;

        try {
            console.log('🃏 Initialisation de Quests&Skills...');

            // Initialise la base de données (charge depuis l'API)
            console.log('📊 Chargement de la base de données...');
            await DB.initializeData();

            // Initialise l'interface utilisateur
            console.log('🎨 Initialisation de l\'interface...');
            await UI.init();

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
            // Reset complet (non implémenté avec l'API)
            reset: () => {
                console.warn('⚠️ Reset non implémenté avec l\'API');
            },

            // Ajoute une carte spécifique
            addCard: async (cardId) => {
                const card = DB.getCardById(cardId);
                if (card) {
                    await DB.addToCollection(cardId);
                    await UI.render();
                    console.log(`✅ Carte ${card.name} ajoutée à la collection`);
                } else {
                    console.log(`❌ Carte ${cardId} introuvable`);
                }
            },

            // Ajoute toutes les cartes
            addAllCards: async () => {
                const allCards = DB.getAllCards();
                for (const card of allCards) {
                    await DB.addToCollection(card.id);
                }
                await UI.render();
                console.log(`✅ Toutes les cartes (${allCards.length}) ajoutées à la collection`);
            },

            // Simulation de pioches
            simulate: async (count = 10) => {
                const results = await CARD_SYSTEM.simulateDraws(count);
                console.log(`🎲 Simulation de ${count} pioches:`, results);
                return results;
            },

            // Force une pioche
            forceDraw: async () => {
                const result = await CARD_SYSTEM.drawCard(1);
                await UI.render();
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

            // Ajoute des crédits
            addCredits: async (amount) => {
                await DB.addCredits(amount);
                await UI.render();
                console.log(`✅ ${amount} crédits ajoutés`);
            }
        };

        console.log('🛠️ Mode debug activé ! Commandes disponibles:');
        console.log('- DEBUG.addCard(id) - Ajoute une carte spécifique');
        console.log('- DEBUG.addAllCards() - Ajoute toutes les cartes');
        console.log('- DEBUG.simulate(count) - Simule des pioches');
        console.log('- DEBUG.forceDraw() - Force une pioche');
        console.log('- DEBUG.stats() - Affiche les statistiques');
        console.log('- DEBUG.listCards(theme) - Liste les cartes');
        console.log('- DEBUG.addCredits(amount) - Ajoute des crédits');
    }

    // Message de bienvenue
    async showWelcomeMessage() {
        const stats = DB.getCollectionStats();

        if (stats.ownedCards === 0) {
            setTimeout(() => {
                UI.showToast('Bienvenue ! Commence ta collection en piochant ta première carte 🎁', 'info', 5000);
            }, 1000);
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

    // Gestion de la visibilité de la page
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', async () => {
            if (document.hidden) {
                console.log('📱 Application en arrière-plan');
            } else {
                console.log('📱 Application au premier plan');
                // Actualise l'affichage au retour
                await DB.refreshCollection();
                await UI.render();
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

    // Met à jour le compteur du bouton Bonus
    async updateBonusCounter() {
        const bonusBtn = document.getElementById('bonus-btn');
        const bonusCounter = document.getElementById('bonus-counter');
        if (!bonusBtn || !bonusCounter) return;

        try {
            const response = await fetch(`/api/users/${DB.userId}/attempts?date=${new Date().toISOString().split('T')[0]}`);
            const attempts = await response.json();
            const totalUsed = attempts.length;
            const totalMax = 9; // 3 types × 3 essais

            bonusCounter.textContent = `${totalUsed}/${totalMax}`;

            // Griser si tout est utilisé
            if (totalUsed >= totalMax) {
                bonusBtn.classList.add('disabled');
                bonusBtn.disabled = true;
            } else {
                bonusBtn.classList.remove('disabled');
                bonusBtn.disabled = false;
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du compteur bonus:', error);
        }
    }

    // Configure le bouton Bonus
    setupBonusButton() {
        const bonusBtn = document.getElementById('bonus-btn');
        if (!bonusBtn) return;

        bonusBtn.addEventListener('click', () => {
            if (!bonusBtn.disabled) {
                window.location.href = 'bonus.html';
            }
        });
    }
}

// Initialisation de l'application
const app = new App();

// Démarre l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    app.setupErrorHandling();
    app.setupVisibilityHandling();
    app.init();
    app.updateBonusCounter();
    app.setupBonusButton();
});

// Nettoyage avant fermeture de la page
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// Export pour compatibilité future
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
