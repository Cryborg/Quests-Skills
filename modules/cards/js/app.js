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

            // Charge les cartes depuis l'API
            console.log('🎴 Chargement des cartes...');
            await DB.init();

            // Charge la collection depuis l'API pour initialiser le cache
            console.log('🔄 Chargement de la collection...');
            await DB.getCollection();

            // Vérifie et réclame les crédits quotidiens
            console.log('🎁 Vérification des crédits quotidiens...');
            const dailyResult = await DB.claimDailyCredit();
            if (dailyResult.success && dailyResult.creditsAdded > 0) {
                console.log(`✅ ${dailyResult.message}`);
                // Affiche une notification à l'utilisateur
                setTimeout(() => {
                    UI.showToast(dailyResult.message, 'success');
                }, 1000);
            }

            // Créer le header de page
            const currentUser = authService.getCurrentUser();
            PageHeader.render({
                icon: '🃏',
                title: currentUser ? `Album de ${currentUser.username}` : 'Album de cartes',
                actions: [
                    { icon: '⭐', text: 'Noter ce jeu', id: 'rate-game-btn-cards' },
                    { icon: '❓', text: 'Aide', id: 'help-btn-cards' }
                ]
            });

            // Initialise l'aide du module
            GameHelpModal.initHeaderButton('help-btn-cards', {
                title: 'Collection de Cartes',
                icon: '🃏',
                objective: 'Collectionne des cartes sur différents thèmes et améliore-les pour obtenir des raretés supérieures !',
                rules: [
                    { title: 'Pioche de cartes', description: 'Utilise tes crédits pour piocher des cartes. Chaque crédit te permet de piocher une carte.' },
                    { title: 'Système de raretés', description: 'Chaque carte possède une rareté : Commune (blanc), Rare (bleu), Très Rare (vert), Épique (jaune) ou Légendaire (rouge).' },
                    { title: 'Amélioration des cartes', description: 'Accumule des doublons pour améliorer tes cartes vers des raretés supérieures. Plus la rareté est haute, plus il faut de doublons.' },
                    { title: 'Thèmes à compléter', description: 'Les cartes sont regroupées par thèmes (Minecraft, Astronomie, Dinosaures...). Complete chaque thème pour débloquer des bonus.' },
                    { title: 'Cartes légendaires', description: 'Atteindre le niveau légendaire avec une carte te donne un bonus de crédits permanent.' }
                ],
                controls: {
                    desktop: [
                        'Clic gauche : voir les détails d\'une carte',
                        'Espace ou P : piocher rapidement',
                        'Esc : fermer la fenêtre de détails',
                        'Filtres : trier par rareté ou alphabétiquement'
                    ],
                    mobile: [
                        'Toucher une carte : voir les détails',
                        'Swipe : faire défiler les cartes',
                        'Utiliser les filtres pour trier la collection'
                    ]
                },
                scoring: {
                    base: 'Les crédits se gagnent en jouant aux différents jeux',
                    bonuses: [
                        '1 crédit = 1 carte piochée',
                        'Amélioration Rare : 3 cartes communes identiques',
                        'Amélioration Très Rare : 5 cartes rares identiques',
                        'Amélioration Épique : 10 cartes très rares identiques',
                        'Amélioration Légendaire : 25 cartes épiques identiques + bonus crédits permanents'
                    ],
                    penalties: []
                },
                tips: [
                    'Focus sur un thème à la fois pour compléter ta collection plus rapidement',
                    'Les cartes améliorées conservent leur count, tu ne perds rien !',
                    'Les cartes légendaires donnent un bonus de crédits permanent',
                    'Utilise les filtres pour trouver rapidement les cartes à améliorer',
                    'Le symbole 🔺 indique qu\'une carte peut être améliorée'
                ]
            });

            // Initialiser le bouton de notation
            setTimeout(() => {
                if (typeof GameRatingModal !== 'undefined') {
                    GameRatingModal.initHeaderButton('cards');
                }
            }, 100);

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
            // Reset complet
            reset: async () => {
                DB.resetDatabase();
                await UI.render();
                console.log('🔄 Base de données réinitialisée');
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
            simulate: (count = 10) => {
                const results = CARD_SYSTEM.simulateDraws(count);
                console.log(`🎲 Simulation de ${count} pioches:`, results);
                return results;
            },

            // Force une pioche
            forceDraw: async () => {
                // Temporairement désactive le cooldown
                const originalTime = UTILS.loadFromStorage(CONFIG.STORAGE_KEYS.LAST_DRAW, 0);
                UTILS.saveToStorage(CONFIG.STORAGE_KEYS.LAST_DRAW, 0);

                const result = await CARD_SYSTEM.drawCard();
                await UI.render();

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
            addTestCards: async () => {
                // Ajoute 200 Creeper (Minecraft)
                for(let i = 0; i < 200; i++) { await DB.addToCollection('mc_01'); }
                console.log('✅ 200 Creeper ajoutés');

                // Ajoute 200 Lune (Astronomie)
                for(let i = 0; i < 200; i++) { await DB.addToCollection('space_02'); }
                console.log('✅ 200 Lune ajoutés');

                // Ajoute 200 Diplodocus (Dinosaures)
                for(let i = 0; i < 200; i++) { await DB.addToCollection('dino_04'); }
                console.log('✅ 200 Diplodocus ajoutés');

                await UI.render();
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
                UI.showToast('Bienvenue ! Commence ta collection en piochant tes premières cartes 🎁', 'info', 5000);
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
        document.addEventListener('visibilitychange', async () => {
            if (document.hidden) {
                console.log('📱 Application en arrière-plan');
            } else {
                console.log('📱 Application au premier plan');
                // Actualise l'affichage au retour
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

}

// Initialisation de l'application
const app = new App();

// Setup des handlers globaux
app.setupErrorHandling();
app.setupAutoSave();
app.setupVisibilityHandling();

// Nettoyage avant fermeture de la page
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// Export pour compatibilité future
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}