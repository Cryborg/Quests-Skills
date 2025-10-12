/**
 * GameRatingModal - Modale de notation des jeux
 *
 * Affiche une modale permettant de noter un jeu.
 * Utilise le composant GameRating pour la notation elle-même.
 */

class GameRatingModal {
    /**
     * Afficher la modale de notation pour un jeu
     * @param {string} gameType - Type de jeu (word-search, sudoku, etc.)
     * @param {Function} onComplete - Callback appelé après notation réussie
     */
    static show(gameType, onComplete = null) {
        // Créer l'overlay de modale
        const modalId = `rating-modal-${gameType}`;

        // Supprimer la modale existante si présente
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        // Créer la modale
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.style.cssText = 'display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0,0,0,0.5) !important; z-index: 9999 !important; align-items: center !important; justify-content: center !important;';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <span class="close" id="${modalId}-close">&times;</span>
                <div id="${modalId}-rating-container"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // Créer l'instance GameRating
        const rating = new GameRating(gameType, (ratingData) => {
            // Callback après notation réussie
            Toast.success('Merci pour ton évaluation !');

            if (onComplete) {
                onComplete(ratingData);
            }

            // Fermer la modale après un court délai
            setTimeout(() => {
                GameRatingModal.close(gameType);
            }, 1500);
        });

        // Injecter le contenu du rating dans la modale
        const container = document.getElementById(`${modalId}-rating-container`);
        container.innerHTML = rating.render();

        // Initialiser le composant de notation
        rating.init();

        // Remplacer la méthode close du rating pour fermer la modale complète
        rating.close = () => {
            GameRatingModal.close(gameType);
        };

        // Gérer la fermeture
        const closeBtn = document.getElementById(`${modalId}-close`);
        closeBtn.addEventListener('click', () => {
            GameRatingModal.close(gameType);
        });

        // Fermer en cliquant sur l'overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                GameRatingModal.close(gameType);
            }
        });

        // Fermer avec Échap
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                GameRatingModal.close(gameType);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Fermer la modale de notation
     * @param {string} gameType - Type de jeu
     */
    static close(gameType) {
        const modalId = `rating-modal-${gameType}`;
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        }
    }

    /**
     * Ajouter un bouton "Noter ce jeu" dans le PageHeader
     * @param {string} gameType - Type de jeu
     * @param {Function} onComplete - Callback après notation
     * @returns {Object} Configuration du bouton pour PageHeader
     */
    static getHeaderAction(gameType, onComplete = null) {
        return {
            icon: '⭐',
            text: 'Noter ce jeu',
            id: `rate-game-btn-${gameType}`,
            className: 'page-header-btn-secondary',
            onClick: () => GameRatingModal.show(gameType, onComplete)
        };
    }

    /**
     * Initialiser le bouton de notation dans le header après render
     * @param {string} gameType - Type de jeu
     * @param {Function} onComplete - Callback après notation
     */
    static initHeaderButton(gameType, onComplete = null) {
        const btn = document.getElementById(`rate-game-btn-${gameType}`);
        if (btn) {
            btn.addEventListener('click', () => {
                GameRatingModal.show(gameType, onComplete);
            });
        }
    }
}

// Export global
window.GameRatingModal = GameRatingModal;
