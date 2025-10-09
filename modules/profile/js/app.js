// Gestionnaire de la page profil
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.elements = {};
        this.allThemes = [];
        this.selectedThemes = [];
        this.themeStats = {}; // {theme_slug: card_count}
    }

    // Initialiser la page
    async init() {
        this.currentUser = authService.getCurrentUser();

        if (!this.currentUser) {
            window.location.href = '/';
            return;
        }

        // Créer le header de page
        PageHeader.render({
            icon: '👤',
            title: 'Mon Profil',
            subtitle: 'Gérez vos informations personnelles'
        });

        this.cacheElements();
        this.attachEvents();
        await this.loadUserData();
        await this.loadThemes();
    }

    // Met en cache les éléments DOM
    cacheElements() {
        this.elements = {
            // Formulaire de profil
            profileForm: document.getElementById('profile-form'),
            usernameInput: document.getElementById('username'),
            emailInput: document.getElementById('email'),
            profileError: document.getElementById('profile-error'),
            profileSuccess: document.getElementById('profile-success'),

            // Sélecteur de thèmes
            themesSelector: document.getElementById('themes-selector'),
            saveThemesBtn: document.getElementById('save-themes-btn'),
            themesError: document.getElementById('themes-error'),
            themesSuccess: document.getElementById('themes-success'),

            // Formulaire de mot de passe
            passwordForm: document.getElementById('password-form'),
            currentPasswordInput: document.getElementById('current-password'),
            newPasswordInput: document.getElementById('new-password'),
            confirmPasswordInput: document.getElementById('confirm-password'),
            passwordError: document.getElementById('password-error'),
            passwordSuccess: document.getElementById('password-success')
        };
    }

    // Attacher les événements
    attachEvents() {
        this.elements.profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        this.elements.passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        this.elements.saveThemesBtn.addEventListener('click', () => this.handleSaveThemes());
    }

    // Charger les données utilisateur
    async loadUserData() {
        try {
            // Charger les infos utilisateur depuis l'API
            const response = await authService.fetchAPI(`/users/${this.currentUser.id}`);
            const userData = await response.json();

            // Remplir le formulaire
            this.elements.usernameInput.value = userData.username;
            this.elements.emailInput.value = userData.email;

        } catch (error) {
            console.error('Failed to load user data:', error);
            this.showProfileError('Erreur lors du chargement des données');
        }
    }

    // Gérer la mise à jour du profil
    async handleProfileUpdate(e) {
        e.preventDefault();

        this.hideMessages();

        const username = this.elements.usernameInput.value.trim();
        const email = this.elements.emailInput.value.trim();

        // Validation
        if (username.length < 3) {
            this.showProfileError('Le pseudo doit contenir au moins 3 caractères');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showProfileError('Email invalide');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const spinner = ButtonSpinner.start(submitBtn);

        try {
            const response = await authService.fetchAPI(`/users/${this.currentUser.id}`, {
                method: 'PUT',
                body: JSON.stringify({ username, email })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la mise à jour');
            }

            const updatedUser = await response.json();

            // Mettre à jour l'utilisateur dans le localStorage
            this.currentUser.username = updatedUser.username;
            this.currentUser.email = updatedUser.email;
            localStorage.setItem('current_user', JSON.stringify(this.currentUser));

            this.showProfileSuccess('Profil mis à jour avec succès !');

            // Rafraîchir la navigation si elle existe
            if (window.navigationUI) {
                await navigationUI.refresh();
            }

        } catch (error) {
            this.showProfileError(error.message);
        } finally {
            spinner.stop();
        }
    }

    // Gérer le changement de mot de passe
    async handlePasswordChange(e) {
        e.preventDefault();

        this.hideMessages();

        const currentPassword = this.elements.currentPasswordInput.value;
        const newPassword = this.elements.newPasswordInput.value;
        const confirmPassword = this.elements.confirmPasswordInput.value;

        // Validation
        if (newPassword.length < 8) {
            this.showPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showPasswordError('Les mots de passe ne correspondent pas');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const spinner = ButtonSpinner.start(submitBtn);

        try {
            const response = await authService.fetchAPI(`/users/${this.currentUser.id}/password`, {
                method: 'PUT',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors du changement de mot de passe');
            }

            this.showPasswordSuccess('Mot de passe changé avec succès !');

            // Réinitialiser le formulaire
            this.elements.passwordForm.reset();

        } catch (error) {
            this.showPasswordError(error.message);
        } finally {
            spinner.stop();
        }
    }

    // Validation d'email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Afficher/masquer les messages
    showProfileError(message) {
        this.elements.profileError.textContent = message;
        this.elements.profileError.classList.add('show');
    }

    showProfileSuccess(message) {
        this.elements.profileSuccess.textContent = message;
        this.elements.profileSuccess.classList.add('show');
    }

    showPasswordError(message) {
        this.elements.passwordError.textContent = message;
        this.elements.passwordError.classList.add('show');
    }

    showPasswordSuccess(message) {
        this.elements.passwordSuccess.textContent = message;
        this.elements.passwordSuccess.classList.add('show');
    }

    // Charger les thèmes disponibles et sélectionnés
    async loadThemes() {
        try {
            // Charger tous les thèmes disponibles
            const themesResponse = await authService.fetchAPI('/themes');
            this.allThemes = await themesResponse.json();

            // Charger les thèmes sélectionnés par l'utilisateur
            const userThemesResponse = await authService.fetchAPI(`/users/${this.currentUser.id}/themes`);
            const userThemes = await userThemesResponse.json();
            this.selectedThemes = userThemes.map(t => t.slug);

            // Charger les stats de cartes par thème
            const statsResponse = await authService.fetchAPI(`/users/${this.currentUser.id}/themes/stats`);
            const stats = await statsResponse.json();
            this.themeStats = {};
            stats.forEach(stat => {
                this.themeStats[stat.theme_slug] = stat.card_count;
            });

            // Afficher les thèmes
            this.renderThemes();
        } catch (error) {
            console.error('Failed to load themes:', error);
            this.showThemesError('Erreur lors du chargement des thèmes');
        }
    }

    // Afficher les thèmes
    renderThemes() {
        this.elements.themesSelector.innerHTML = '';

        this.allThemes.forEach(theme => {
            const isSelected = this.selectedThemes.includes(theme.slug);

            const themeEl = document.createElement('div');
            themeEl.className = `theme-option ${isSelected ? 'selected' : ''}`;
            themeEl.dataset.slug = theme.slug;

            themeEl.innerHTML = `
                <div class="theme-option-icon">${theme.icon}</div>
                <div class="theme-option-info">
                    <div class="theme-option-name">${theme.name}</div>
                </div>
                <div class="theme-option-check">✓</div>
            `;

            themeEl.addEventListener('click', () => this.toggleTheme(theme.slug));

            this.elements.themesSelector.appendChild(themeEl);
        });
    }

    // Toggle un thème
    toggleTheme(slug) {
        const index = this.selectedThemes.indexOf(slug);

        if (index > -1) {
            // Désélectionner (mais minimum 3)
            if (this.selectedThemes.length <= 3) {
                this.showThemesError('Vous devez sélectionner au moins 3 thèmes');
                return;
            }

            // Avertir si l'utilisateur a des cartes dans ce thème
            const cardCount = this.themeStats[slug] || 0;
            if (cardCount > 0) {
                const theme = this.allThemes.find(t => t.slug === slug);
                const themeName = theme ? theme.name : slug;

                if (!confirm(`⚠️ Attention : Vous avez ${cardCount} carte(s) unique(s) dans le thème "${themeName}".\n\nEn décochant ce thème :\n• Vos cartes ne seront PAS supprimées\n• Elles seront simplement masquées\n• Vous ne piocherez plus de cartes de ce thème\n• Vous pourrez les récupérer en recochant le thème\n\nConfirmer la désélection ?`)) {
                    return;
                }
            }

            this.selectedThemes.splice(index, 1);
        } else {
            // Sélectionner (mais maximum 10)
            if (this.selectedThemes.length >= 10) {
                this.showThemesError('Vous ne pouvez pas sélectionner plus de 10 thèmes');
                return;
            }
            this.selectedThemes.push(slug);
        }

        this.renderThemes();
        this.hideMessages();
    }

    // Sauvegarder les thèmes
    async handleSaveThemes() {
        this.hideMessages();

        if (this.selectedThemes.length < 3) {
            this.showThemesError('Vous devez sélectionner au moins 3 thèmes');
            return;
        }

        if (this.selectedThemes.length > 10) {
            this.showThemesError('Vous ne pouvez pas sélectionner plus de 10 thèmes');
            return;
        }

        const spinner = ButtonSpinner.start(this.elements.saveThemesBtn);

        try {
            const response = await authService.fetchAPI(`/users/${this.currentUser.id}/themes`, {
                method: 'PUT',
                body: JSON.stringify({ theme_slugs: this.selectedThemes })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la sauvegarde');
            }

            this.showThemesSuccess('Thèmes enregistrés avec succès !');
        } catch (error) {
            this.showThemesError(error.message);
        } finally {
            spinner.stop();
        }
    }

    // Afficher les messages de thèmes
    showThemesError(message) {
        this.elements.themesError.textContent = message;
        this.elements.themesError.classList.add('show');
    }

    showThemesSuccess(message) {
        this.elements.themesSuccess.textContent = message;
        this.elements.themesSuccess.classList.add('show');
    }

    hideMessages() {
        this.elements.profileError.classList.remove('show');
        this.elements.profileSuccess.classList.remove('show');
        this.elements.passwordError.classList.remove('show');
        this.elements.passwordSuccess.classList.remove('show');
        this.elements.themesError.classList.remove('show');
        this.elements.themesSuccess.classList.remove('show');
    }
}

// Initialiser la page au chargement
const profileManager = new ProfileManager();
document.addEventListener('DOMContentLoaded', async () => {
    const isAuth = await authService.init();

    if (!isAuth) {
        window.location.href = '/';
    } else {
        await navigationUI.init();
        await profileManager.init();
    }
});
