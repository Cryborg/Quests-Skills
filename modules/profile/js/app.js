// Gestionnaire de la page profil
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.elements = {};
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

    hideMessages() {
        this.elements.profileError.classList.remove('show');
        this.elements.profileSuccess.classList.remove('show');
        this.elements.passwordError.classList.remove('show');
        this.elements.passwordSuccess.classList.remove('show');
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
