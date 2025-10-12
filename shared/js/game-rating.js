/**
 * GameRating - Composant de notation des jeux
 *
 * Permet aux utilisateurs de noter un jeu sur deux critères :
 * - Intérêt (1-5 étoiles) : À quel point le jeu est intéressant
 * - Difficulté (1-5 étoiles) : À quel point le jeu est difficile
 */

class GameRating {
    constructor(gameType, onRatingSubmit = null) {
        this.gameType = gameType;
        this.onRatingSubmit = onRatingSubmit;
        this.interestRating = 0;
        this.difficultyRating = 0;
        this.hasRated = false;
    }

    /**
     * Créer le HTML du composant de notation
     * @returns {string} HTML du composant
     */
    render() {
        return `
            <div class="game-rating-container" id="game-rating-${this.gameType}">
                <div class="game-rating-header">
                    <h3>📊 Évalue ce jeu</h3>
                    <p class="game-rating-desc">Aide-nous à améliorer l'expérience pour tous !</p>
                </div>

                <div class="game-rating-section">
                    <div class="game-rating-label">
                        <span class="rating-icon">💡</span>
                        <span class="rating-text">Intérêt du jeu</span>
                        <small>Pas intéressant → Très intéressant</small>
                    </div>
                    <div class="star-rating" data-rating-type="interest">
                        ${this.renderStars('interest')}
                    </div>
                </div>

                <div class="game-rating-section">
                    <div class="game-rating-label">
                        <span class="rating-icon">🎯</span>
                        <span class="rating-text">Difficulté</span>
                        <small>Très facile → Très difficile</small>
                    </div>
                    <div class="star-rating" data-rating-type="difficulty">
                        ${this.renderStars('difficulty')}
                    </div>
                </div>

                <div class="game-rating-actions">
                    <button class="btn-primary" id="submit-rating-${this.gameType}" disabled>
                        ✅ Envoyer mon évaluation
                    </button>
                    <button class="btn-secondary" id="skip-rating-${this.gameType}">
                        ❌ Annuler
                    </button>
                </div>

                <div class="game-rating-message" id="rating-message-${this.gameType}"></div>
            </div>
        `;
    }

    /**
     * Générer les étoiles pour un type de notation
     * @param {string} type - 'interest' ou 'difficulty'
     * @returns {string} HTML des étoiles
     */
    renderStars(type) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star" data-value="${i}" data-type="${type}">☆</span>`;
        }
        return stars;
    }

    /**
     * Initialiser les événements après que le composant soit inséré dans le DOM
     */
    init() {
        const container = document.getElementById(`game-rating-${this.gameType}`);
        if (!container) {
            console.error('Rating container not found');
            return;
        }

        // Charger la notation existante si disponible
        this.loadExistingRating();

        // Événements des étoiles
        const stars = container.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => this.handleStarClick(star));
            star.addEventListener('mouseenter', () => this.handleStarHover(star));
        });

        // Réinitialiser le survol quand on sort du conteneur
        const starContainers = container.querySelectorAll('.star-rating');
        starContainers.forEach(starContainer => {
            starContainer.addEventListener('mouseleave', () => {
                const type = starContainer.dataset.ratingType;
                this.updateStarDisplay(type, type === 'interest' ? this.interestRating : this.difficultyRating);
            });
        });

        // Bouton soumettre
        const submitBtn = document.getElementById(`submit-rating-${this.gameType}`);
        submitBtn.addEventListener('click', () => this.submitRating());

        // Bouton passer
        const skipBtn = document.getElementById(`skip-rating-${this.gameType}`);
        skipBtn.addEventListener('click', () => this.close());
    }

    /**
     * Charger la notation existante de l'utilisateur
     */
    async loadExistingRating() {
        try {
            const response = await authService.fetchAPI(`/ratings/${this.gameType}`);
            if (response.ok) {
                const rating = await response.json();

                // Si rating est null, l'utilisateur n'a pas encore noté
                if (!rating) {
                    return;
                }

                this.interestRating = rating.interest_rating;
                this.difficultyRating = rating.difficulty_rating;
                this.hasRated = true;

                // Mettre à jour l'affichage
                this.updateStarDisplay('interest', this.interestRating);
                this.updateStarDisplay('difficulty', this.difficultyRating);
                this.updateSubmitButton();

                // Changer le texte du bouton
                const submitBtn = document.getElementById(`submit-rating-${this.gameType}`);
                submitBtn.textContent = '✅ Mettre à jour mon évaluation';
            }
        } catch (error) {
            // Erreur réseau ou autre
            console.error('Error loading rating:', error);
        }
    }

    /**
     * Gérer le clic sur une étoile
     * @param {HTMLElement} star - L'élément étoile cliqué
     */
    handleStarClick(star) {
        const value = parseInt(star.dataset.value);
        const type = star.dataset.type;

        if (type === 'interest') {
            this.interestRating = value;
        } else {
            this.difficultyRating = value;
        }

        this.updateStarDisplay(type, value);
        this.updateSubmitButton();
    }

    /**
     * Gérer le survol d'une étoile
     * @param {HTMLElement} star - L'élément étoile survolé
     */
    handleStarHover(star) {
        const value = parseInt(star.dataset.value);
        const type = star.dataset.type;
        this.updateStarDisplay(type, value, true);
    }

    /**
     * Mettre à jour l'affichage des étoiles
     * @param {string} type - 'interest' ou 'difficulty'
     * @param {number} rating - Note de 1 à 5
     * @param {boolean} isHover - Si c'est un survol temporaire
     */
    updateStarDisplay(type, rating, isHover = false) {
        const container = document.getElementById(`game-rating-${this.gameType}`);
        const stars = container.querySelectorAll(`.star[data-type="${type}"]`);

        stars.forEach((star, index) => {
            const starValue = index + 1;
            if (starValue <= rating) {
                star.textContent = '★';
                star.classList.add('filled');
                if (isHover) {
                    star.classList.add('hover');
                }
            } else {
                star.textContent = '☆';
                star.classList.remove('filled', 'hover');
            }
        });
    }

    /**
     * Activer/désactiver le bouton de soumission
     */
    updateSubmitButton() {
        const submitBtn = document.getElementById(`submit-rating-${this.gameType}`);
        submitBtn.disabled = !(this.interestRating > 0 && this.difficultyRating > 0);
    }

    /**
     * Soumettre la notation
     */
    async submitRating() {
        const submitBtn = document.getElementById(`submit-rating-${this.gameType}`);
        const messageEl = document.getElementById(`rating-message-${this.gameType}`);

        if (this.interestRating === 0 || this.difficultyRating === 0) {
            messageEl.textContent = '⚠️ Veuillez noter les deux critères';
            messageEl.className = 'game-rating-message error';
            return;
        }

        const spinner = ButtonSpinner ? ButtonSpinner.start(submitBtn) : null;

        try {
            const response = await authService.fetchAPI('/ratings', {
                method: 'POST',
                body: JSON.stringify({
                    game_type: this.gameType,
                    interest_rating: this.interestRating,
                    difficulty_rating: this.difficultyRating
                })
            });

            if (response.ok) {
                messageEl.textContent = this.hasRated ? '✅ Évaluation mise à jour !' : '✅ Merci pour ton évaluation !';
                messageEl.className = 'game-rating-message success';

                // Callback si fourni
                if (this.onRatingSubmit) {
                    this.onRatingSubmit({
                        game_type: this.gameType,
                        interest_rating: this.interestRating,
                        difficulty_rating: this.difficultyRating
                    });
                }

                // Fermer après 2 secondes
                setTimeout(() => this.close(), 2000);
            } else {
                const error = await response.json();
                messageEl.textContent = `❌ ${error.error || 'Erreur lors de l\'envoi'}`;
                messageEl.className = 'game-rating-message error';
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            messageEl.textContent = '❌ Erreur de connexion';
            messageEl.className = 'game-rating-message error';
        } finally {
            if (spinner) spinner.stop();
        }
    }

    /**
     * Fermer le composant de notation
     */
    close() {
        const container = document.getElementById(`game-rating-${this.gameType}`);
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Afficher le composant (si masqué)
     */
    show() {
        const container = document.getElementById(`game-rating-${this.gameType}`);
        if (container) {
            container.style.display = 'block';
        }
    }
}
