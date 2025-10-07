// Interface UI pour l'authentification
class AuthUI {
    constructor() {
        this.modal = null;
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
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    max-width: 450px;
                    width: 90%;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                }

                .auth-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 25px;
                    border-bottom: 2px solid #e0e0e0;
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
                    color: #666;
                    transition: all 0.3s;
                }

                .auth-tab.active {
                    color: #4a90e2;
                    border-bottom-color: #4a90e2;
                }

                .auth-form h2 {
                    margin: 0 0 20px 0;
                    color: #333;
                    font-size: 24px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    color: #555;
                    font-weight: 500;
                }

                .form-group input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 15px;
                    transition: border-color 0.3s;
                    box-sizing: border-box;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #4a90e2;
                }

                .form-group small {
                    display: block;
                    margin-top: 5px;
                    color: #888;
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

    switchTab(tab) {
        // Changer l'onglet actif
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Afficher le bon formulaire
        document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
        document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';

        // Réinitialiser les erreurs
        document.getElementById('login-error').textContent = '';
        document.getElementById('register-error').textContent = '';
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

            await authService.register(username, email, password);
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
