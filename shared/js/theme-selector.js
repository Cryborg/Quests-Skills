// Service de sélection de thèmes obligatoire pour les nouveaux utilisateurs
class ThemeSelector {
    constructor() {
        this.modal = null;
        this.allThemes = [];
        this.selectedThemes = [];
        this.isModalOpen = false;
    }

    // Vérifier si l'utilisateur a assez de thèmes
    async checkAndShowIfNeeded() {
        const user = authService.getCurrentUser();
        if (!user) return;

        try {
            // Récupérer les thèmes de l'utilisateur
            const response = await authService.fetchAPI(`/users/${user.id}/themes`);
            const userThemes = await response.json();

            // Si moins de 3 thèmes, afficher la modale
            if (userThemes.length < 3) {
                await this.show();
            }
        } catch (error) {
            console.error('Failed to check user themes:', error);
        }
    }

    // Créer et afficher la modale
    async show() {
        if (this.isModalOpen) return;
        this.isModalOpen = true;

        // Charger les thèmes disponibles
        await this.loadThemes();

        // Créer la modale si elle n'existe pas
        if (!this.modal) {
            this.createModal();
        }

        this.modal.style.display = 'flex';
        this.renderThemes();
    }

    // Créer la structure HTML de la modale
    createModal() {
        const modalHTML = `
            <div id="theme-selector-modal" class="theme-selector-modal">
                <div class="theme-selector-content">
                    <h2>🎯 Choisis tes thèmes d'intérêt</h2>
                    <p class="theme-selector-subtitle">
                        Sélectionne entre 3 et 10 thèmes de cartes que tu souhaites collectionner
                    </p>

                    <div id="theme-selector-grid" class="theme-selector-grid">
                        <!-- Les thèmes seront chargés ici -->
                    </div>

                    <div class="theme-selector-counter">
                        <span id="theme-selector-count">0</span> / 10 thèmes sélectionnés
                    </div>

                    <div class="theme-selector-error" id="theme-selector-error"></div>

                    <button id="theme-selector-submit" class="theme-selector-submit-btn" disabled>
                        Valider mes choix
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('theme-selector-modal');

        // Ajouter les styles
        this.addStyles();

        // Attacher les événements
        this.attachEvents();
    }

    addStyles() {
        const styles = `
            <style>
                .theme-selector-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }

                .theme-selector-content {
                    background: #1a1a2e;
                    border: 2px solid #667eea;
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                }

                .theme-selector-content h2 {
                    color: #e0e0ff;
                    font-size: 28px;
                    margin-bottom: 10px;
                    text-align: center;
                }

                .theme-selector-subtitle {
                    color: #b8b8d8;
                    font-size: 16px;
                    text-align: center;
                    margin-bottom: 30px;
                }

                .theme-selector-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                }

                .theme-selector-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 20px 15px;
                    background: #2a2a4e;
                    border: 3px solid #3a3a6e;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .theme-selector-card:hover {
                    border-color: #667eea;
                    background: #333355;
                    transform: translateY(-2px);
                }

                .theme-selector-card.selected {
                    border-color: #667eea;
                    background: #4a4a7e;
                    box-shadow: 0 0 15px rgba(102, 126, 234, 0.4);
                }

                .theme-selector-card-icon {
                    font-size: 40px;
                }

                .theme-selector-card-name {
                    font-size: 14px;
                    color: #b8b8d8;
                    text-align: center;
                    font-weight: 500;
                }

                .theme-selector-card.selected .theme-selector-card-name {
                    color: #e0e0ff;
                    font-weight: 700;
                }

                .theme-selector-counter {
                    text-align: center;
                    font-size: 18px;
                    color: #b8b8d8;
                    margin-bottom: 20px;
                }

                .theme-selector-counter #theme-selector-count {
                    color: #667eea;
                    font-weight: 700;
                    font-size: 24px;
                }

                .theme-selector-error {
                    color: #ff6b6b;
                    background: rgba(255, 107, 107, 0.1);
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    margin-bottom: 20px;
                    text-align: center;
                    min-height: 20px;
                }

                .theme-selector-submit-btn {
                    width: 100%;
                    padding: 18px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 18px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .theme-selector-submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
                }

                .theme-selector-submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                @media (max-width: 768px) {
                    .theme-selector-content {
                        padding: 25px;
                    }

                    .theme-selector-grid {
                        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                        gap: 10px;
                    }

                    .theme-selector-card {
                        padding: 15px 10px;
                    }

                    .theme-selector-card-icon {
                        font-size: 32px;
                    }

                    .theme-selector-card-name {
                        font-size: 12px;
                    }
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    attachEvents() {
        // Bouton de validation
        document.getElementById('theme-selector-submit').addEventListener('click', async () => {
            await this.saveThemes();
        });

        // Empêcher la fermeture de la modale
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.showError('Tu dois sélectionner au moins 3 thèmes pour continuer');
            }
        });

        // Empêcher Échap de fermer la modale
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen) {
                e.preventDefault();
                e.stopPropagation();
                this.showError('Tu dois sélectionner au moins 3 thèmes pour continuer');
            }
        });
    }

    async loadThemes() {
        try {
            const response = await authService.fetchAPI('/themes/all');
            this.allThemes = await response.json();
        } catch (error) {
            console.error('Failed to load themes:', error);
            this.showError('Erreur lors du chargement des thèmes');
        }
    }

    renderThemes() {
        const container = document.getElementById('theme-selector-grid');
        if (!container) return;

        container.innerHTML = '';

        this.allThemes.forEach(theme => {
            const isSelected = this.selectedThemes.includes(theme.slug);

            const themeCard = document.createElement('div');
            themeCard.className = `theme-selector-card ${isSelected ? 'selected' : ''}`;
            themeCard.dataset.slug = theme.slug;

            themeCard.innerHTML = `
                <div class="theme-selector-card-icon">${theme.icon}</div>
                <div class="theme-selector-card-name">${theme.name}</div>
            `;

            themeCard.addEventListener('click', () => this.toggleTheme(theme.slug));

            container.appendChild(themeCard);
        });

        this.updateCounter();
    }

    toggleTheme(slug) {
        const index = this.selectedThemes.indexOf(slug);

        if (index > -1) {
            // Désélectionner
            this.selectedThemes.splice(index, 1);
        } else {
            // Sélectionner (mais maximum 10)
            if (this.selectedThemes.length >= 10) {
                this.showError('Maximum 10 thèmes autorisés');
                return;
            }
            this.selectedThemes.push(slug);
        }

        this.renderThemes();
        this.hideError();
    }

    updateCounter() {
        const countEl = document.getElementById('theme-selector-count');
        const submitBtn = document.getElementById('theme-selector-submit');

        countEl.textContent = this.selectedThemes.length;

        // Activer le bouton si entre 3 et 10 thèmes
        if (this.selectedThemes.length >= 3 && this.selectedThemes.length <= 10) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    }

    async saveThemes() {
        if (this.selectedThemes.length < 3) {
            this.showError('Veuillez sélectionner au moins 3 thèmes');
            return;
        }

        if (this.selectedThemes.length > 10) {
            this.showError('Veuillez sélectionner au maximum 10 thèmes');
            return;
        }

        const user = authService.getCurrentUser();
        if (!user) return;

        try {
            // Envoyer les thèmes au serveur
            const response = await authService.fetchAPI(`/users/${user.id}/themes`, {
                method: 'POST',
                body: JSON.stringify({ theme_slugs: this.selectedThemes })
            });

            if (response.ok) {
                // Fermer la modale
                this.hide();

                // Recharger la page pour appliquer les changements
                window.location.reload();
            } else {
                throw new Error('Failed to save themes');
            }
        } catch (error) {
            console.error('Failed to save themes:', error);
            this.showError('Erreur lors de la sauvegarde des thèmes');
        }
    }

    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.isModalOpen = false;
        }
    }

    showError(message) {
        const errorEl = document.getElementById('theme-selector-error');
        if (errorEl) {
            errorEl.textContent = message;
            setTimeout(() => this.hideError(), 3000);
        }
    }

    hideError() {
        const errorEl = document.getElementById('theme-selector-error');
        if (errorEl) {
            errorEl.textContent = '';
        }
    }
}

// Instance globale
const themeSelector = new ThemeSelector();
