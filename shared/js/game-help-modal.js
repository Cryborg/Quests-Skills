/**
 * GameHelpModal - Système de modal d'aide pour les jeux
 * Affiche une aide détaillée avec instructions, règles et astuces
 */
class GameHelpModal {
    /**
     * Affiche une modale d'aide pour un jeu
     * @param {Object} config - Configuration de l'aide
     * @param {string} config.title - Titre du jeu
     * @param {string} config.icon - Icône du jeu
     * @param {string} config.objective - Objectif du jeu
     * @param {Array<Object>} config.rules - Règles du jeu [{title, description}]
     * @param {Array<string>} config.tips - Conseils et astuces
     * @param {Object} [config.controls] - Contrôles spécifiques {desktop: [], mobile: []}
     * @param {Object} [config.scoring] - Système de scoring {base, bonuses: [], penalties: []}
     */
    static show(config) {
        // Créer la modal si elle n'existe pas
        let modal = document.getElementById('game-help-modal');
        if (!modal) {
            modal = this.createModal();
        }

        // Remplir le contenu
        this.fillContent(modal, config);

        // Afficher la modal
        modal.classList.add('show');

        // Événements de fermeture
        this.attachCloseEvents(modal);
    }

    static createModal() {
        const modal = document.createElement('div');
        modal.id = 'game-help-modal';
        modal.className = 'game-help-modal';
        modal.innerHTML = `
            <div class="game-help-overlay"></div>
            <div class="game-help-content">
                <div class="game-help-header">
                    <h2 class="game-help-title"></h2>
                    <button class="game-help-close" aria-label="Fermer">&times;</button>
                </div>
                <div class="game-help-body"></div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    static fillContent(modal, config) {
        // Titre avec icône
        const titleElement = modal.querySelector('.game-help-title');
        titleElement.innerHTML = `${config.icon} ${config.title}`;

        // Corps de la modal
        const body = modal.querySelector('.game-help-body');
        let html = '';

        // Objectif
        if (config.objective) {
            html += `
                <section class="help-section">
                    <h3>🎯 Objectif</h3>
                    <p>${config.objective}</p>
                </section>
            `;
        }

        // Règles du jeu
        if (config.rules && config.rules.length > 0) {
            html += `
                <section class="help-section">
                    <h3>📋 Règles du jeu</h3>
                    <div class="help-rules">
                        ${config.rules.map((rule, index) => `
                            <div class="help-rule">
                                <div class="help-rule-number">${index + 1}</div>
                                <div class="help-rule-content">
                                    <h4>${rule.title}</h4>
                                    <p>${rule.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }

        // Contrôles
        if (config.controls) {
            html += `
                <section class="help-section">
                    <h3>🎮 Contrôles</h3>
            `;

            if (config.controls.desktop && config.controls.desktop.length > 0) {
                html += `
                    <div class="help-controls">
                        <h4>🖥️ Ordinateur</h4>
                        <ul>
                            ${config.controls.desktop.map(control => `<li>${control}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            if (config.controls.mobile && config.controls.mobile.length > 0) {
                html += `
                    <div class="help-controls">
                        <h4>📱 Mobile</h4>
                        <ul>
                            ${config.controls.mobile.map(control => `<li>${control}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            html += `</section>`;
        }

        // Système de scoring
        if (config.scoring) {
            html += `
                <section class="help-section">
                    <h3>🏆 Système de points</h3>
                    <p class="help-scoring-base">Récompense de base : <strong>${config.scoring.base} crédits</strong></p>
            `;

            if (config.scoring.bonuses && config.scoring.bonuses.length > 0) {
                html += `
                    <div class="help-scoring-items">
                        <h4>✅ Bonus</h4>
                        <ul>
                            ${config.scoring.bonuses.map(bonus => `<li>${bonus}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            if (config.scoring.penalties && config.scoring.penalties.length > 0) {
                html += `
                    <div class="help-scoring-items">
                        <h4>❌ Pénalités</h4>
                        <ul>
                            ${config.scoring.penalties.map(penalty => `<li>${penalty}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            html += `</section>`;
        }

        // Astuces
        if (config.tips && config.tips.length > 0) {
            html += `
                <section class="help-section">
                    <h3>💡 Astuces</h3>
                    <ul class="help-tips">
                        ${config.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </section>
            `;
        }

        body.innerHTML = html;
    }

    static attachCloseEvents(modal) {
        const closeBtn = modal.querySelector('.game-help-close');
        const overlay = modal.querySelector('.game-help-overlay');

        const close = () => {
            modal.classList.remove('show');
        };

        closeBtn.onclick = close;
        overlay.onclick = close;

        // Fermer avec Échap
        const handleEscape = (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                close();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Initialise le bouton d'aide dans le header d'un module
     * @param {string} buttonId - ID du bouton d'aide
     * @param {Object} helpConfig - Configuration de l'aide (voir show())
     */
    static initHeaderButton(buttonId, helpConfig) {
        const button = document.getElementById(buttonId);
        if (!button) {
            console.warn(`Help button with id "${buttonId}" not found`);
            return;
        }

        button.addEventListener('click', () => {
            this.show(helpConfig);
        });
    }
}

// Rendre disponible globalement
if (typeof window !== 'undefined') {
    window.GameHelpModal = GameHelpModal;
}
