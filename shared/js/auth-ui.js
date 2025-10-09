// Interface UI pour l'authentification
class AuthUI {
    constructor() {
        this.modal = null;
        this.allThemes = [];
        this.selectedThemes = [];
        this.createModal();
    }

    createModal() {
        // Créer la structure HTML de la modale
        const modalHTML = `
            <div id="auth-modal" class="auth-modal" style="display: none;">
                <div class="auth-modal-content">
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Connexion</button>
                        <button class="auth-tab" data-tab="register">Inscription</button>
                    </div>

                    <!-- Formulaire de connexion -->
                    <form id="login-form" class="auth-form">
                        <h2>Connexion</h2>
                        <div class="form-group">
                            <label for="login-email">Email</label>
                            <input type="email" id="login-email" required>
                        </div>
                        <div class="form-group">
                            <label for="login-password">Mot de passe</label>
                            <input type="password" id="login-password" required>
                        </div>
                        <div class="auth-error" id="login-error"></div>
                        <button type="submit" class="auth-submit-btn">Se connecter</button>
                    </form>

                    <!-- Formulaire d'inscription -->
                    <form id="register-form" class="auth-form" style="display: none;">
                        <h2>Inscription</h2>
                        <div class="form-group">
                            <label for="register-username">Pseudo</label>
                            <input type="text" id="register-username" required minlength="3">
                        </div>
                        <div class="form-group">
                            <label for="register-email">Email</label>
                            <input type="email" id="register-email" required>
                        </div>
                        <div class="form-group">
                            <label for="register-password">Mot de passe</label>
                            <input type="password" id="register-password" required minlength="8">
                            <small>Au moins 8 caractères</small>
                        </div>
                        <div class="form-group">
                            <label for="register-password-confirm">Confirmer le mot de passe</label>
                            <input type="password" id="register-password-confirm" required>
                        </div>
                        <div class="form-group">
                            <label>Thèmes d'intérêt (entre 3 et 10)</label>
                            <small>Choisissez les thèmes de cartes que vous souhaitez collectionner</small>
                            <div id="register-themes-selector" class="register-themes-selector">
                                <!-- Les thèmes seront chargés dynamiquement -->
                            </div>
                        </div>
                        <div class="auth-error" id="register-error"></div>
                        <button type="submit" class="auth-submit-btn">S'inscrire</button>
                    </form>
                </div>
            </div>
        `;

        // Ajouter au DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('auth-modal');

        // Ajouter les styles
        this.addStyles();

        // Attacher les événements
        this.attachEvents();
    }

    addStyles() {
        const styles = `
            <style>
                .auth-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }

                .auth-modal-content {
                    background: #1a1a2e;
                    border: 2px solid #667eea;
                    border-radius: 12px;
                    padding: 30px;
                    max-width: 450px;
                    width: 90%;
                    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
                }

                .auth-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 25px;
                    border-bottom: 2px solid #2a2a4e;
                }

                .auth-tab {
                    flex: 1;
                    padding: 12px;
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                    color: #8a8aa8;
                    transition: all 0.3s;
                }

                .auth-tab.active {
                    color: #667eea;
                    border-bottom-color: #667eea;
                }

                .auth-form h2 {
                    margin: 0 0 20px 0;
                    color: #e0e0ff;
                    font-size: 24px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    color: #b8b8d8;
                    font-weight: 500;
                }

                .form-group input {
                    width: 100%;
                    padding: 12px;
                    background: #2a2a4e;
                    border: 2px solid #3a3a6e;
                    border-radius: 6px;
                    font-size: 15px;
                    color: #e0e0ff;
                    transition: border-color 0.3s;
                    box-sizing: border-box;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #667eea;
                    background: #333355;
                }

                .form-group small {
                    display: block;
                    margin-top: 5px;
                    color: #8a8aa8;
                    font-size: 13px;
                }

                .auth-error {
                    color: #e74c3c;
                    font-size: 14px;
                    margin-bottom: 15px;
                    min-height: 20px;
                }

                .auth-submit-btn {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .auth-submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
                }

                .auth-submit-btn:active {
                    transform: translateY(0);
                }

                /* User info bar */
                .user-info-bar {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    z-index: 1000;
                }

                .user-info-bar .username {
                    font-weight: 600;
                    color: #333;
                }

                .user-info-bar .admin-badge {
                    background: #f39c12;
                    color: white;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .user-info-bar .logout-btn {
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }

                .user-info-bar .logout-btn:hover {
                    background: #c0392b;
                }

                /* Sélecteur de thèmes dans l'inscription */
                .register-themes-selector {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 10px;
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 10px;
                    background: #2a2a4e;
                    border-radius: 8px;
                    margin-top: 10px;
                }

                .register-theme-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                    padding: 15px 10px;
                    background: #1a1a2e;
                    border: 2px solid #3a3a6e;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .register-theme-option:hover {
                    border-color: #667eea;
                    background: #252545;
                }

                .register-theme-option.selected {
                    border-color: #667eea;
                    background: #333366;
                }

                .register-theme-option-icon {
                    font-size: 32px;
                }

                .register-theme-option-name {
                    font-size: 13px;
                    color: #b8b8d8;
                    text-align: center;
                }

                .register-theme-option.selected .register-theme-option-name {
                    color: #e0e0ff;
                    font-weight: 600;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    attachEvents() {
        // Onglets
        const tabs = document.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                this.switchTab(targetTab);
            });
        });

        // Formulaire de connexion
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Formulaire d'inscription
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                // On ne ferme pas la modale si l'utilisateur n'est pas connecté
                if (authService.isAuthenticated()) {
                    this.hide();
                }
            }
        });
    }

    async switchTab(tab) {
        // Changer l'onglet actif
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Afficher le bon formulaire
        document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
        document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';

        // Réinitialiser les erreurs
        document.getElementById('login-error').textContent = '';
        document.getElementById('register-error').textContent = '';

        // Charger les thèmes si on affiche le formulaire d'inscription
        if (tab === 'register' && this.allThemes.length === 0) {
            await this.loadThemes();
        }
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        try {
            errorEl.textContent = '';
            await authService.login(email, password);
            this.hide();
            window.location.reload(); // Recharger la page pour afficher le contenu authentifié
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const errorEl = document.getElementById('register-error');

        try {
            errorEl.textContent = '';

            // Validation
            if (password !== passwordConfirm) {
                throw new Error('Les mots de passe ne correspondent pas');
            }

            // Validation des thèmes
            if (this.selectedThemes.length < 3) {
                throw new Error('Veuillez sélectionner au moins 3 thèmes');
            }
            if (this.selectedThemes.length > 10) {
                throw new Error('Veuillez sélectionner au maximum 10 thèmes');
            }

            await authService.register(username, email, password, this.selectedThemes);
            this.hide();
            window.location.reload(); // Recharger la page pour afficher le contenu authentifié
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    show() {
        this.modal.style.display = 'flex';
    }

    hide() {
        this.modal.style.display = 'none';
    }

    // Charger les thèmes disponibles
    async loadThemes() {
        try {
            const response = await fetch(`${API_URL}/themes/all`);
            this.allThemes = await response.json();
            this.renderThemes();
        } catch (error) {
            console.error('Failed to load themes:', error);
        }
    }

    // Afficher les thèmes dans le sélecteur
    renderThemes() {
        const container = document.getElementById('register-themes-selector');
        if (!container) return;

        container.innerHTML = '';

        this.allThemes.forEach(theme => {
            const isSelected = this.selectedThemes.includes(theme.slug);

            const themeEl = document.createElement('div');
            themeEl.className = `register-theme-option ${isSelected ? 'selected' : ''}`;
            themeEl.dataset.slug = theme.slug;

            themeEl.innerHTML = `
                <div class="register-theme-option-icon">${theme.icon}</div>
                <div class="register-theme-option-name">${theme.name}</div>
            `;

            themeEl.addEventListener('click', () => this.toggleTheme(theme.slug));

            container.appendChild(themeEl);
        });
    }

    // Toggle un thème
    toggleTheme(slug) {
        const index = this.selectedThemes.indexOf(slug);

        if (index > -1) {
            // Désélectionner (mais minimum 3)
            if (this.selectedThemes.length <= 3) {
                const errorEl = document.getElementById('register-error');
                errorEl.textContent = 'Minimum 3 thèmes requis';
                setTimeout(() => errorEl.textContent = '', 3000);
                return;
            }
            this.selectedThemes.splice(index, 1);
        } else {
            // Sélectionner (mais maximum 10)
            if (this.selectedThemes.length >= 10) {
                const errorEl = document.getElementById('register-error');
                errorEl.textContent = 'Maximum 10 thèmes autorisés';
                setTimeout(() => errorEl.textContent = '', 3000);
                return;
            }
            this.selectedThemes.push(slug);
        }

        this.renderThemes();
    }

    // Créer la barre d'info utilisateur
    createUserInfoBar() {
        const user = authService.getCurrentUser();
        if (!user) return;

        const existingBar = document.querySelector('.user-info-bar');
        if (existingBar) existingBar.remove();

        const barHTML = `
            <div class="user-info-bar">
                <span class="username">${user.username}</span>
                ${user.is_admin ? '<span class="admin-badge">ADMIN</span>' : ''}
                <button class="logout-btn" onclick="authService.logout()">Déconnexion</button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', barHTML);
    }
}

// Instance globale de l'interface d'authentification
const authUI = new AuthUI();
