// Gestion des utilisateurs dans l'admin

class AdminUsers {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.currentUser = null;
        this.searchQuery = '';
        this.allThemes = [];
        this.selectedThemes = [];
        this.themeStats = {};
    }

    // Initialiser la gestion des utilisateurs
    async init() {
        await this.loadUsers();
        this.attachEvents();
    }

    // Charger tous les utilisateurs
    async loadUsers() {
        try {
            const response = await authService.fetchAPI('/users');
            this.users = await response.json();
            this.applyFilters();
        } catch (error) {
            console.error('Failed to load users:', error);
            adminUI.showToast('Erreur lors du chargement des utilisateurs', 'error');
        }
    }

    // Appliquer les filtres de recherche
    applyFilters() {
        const query = this.searchQuery.toLowerCase().trim();

        if (!query) {
            this.filteredUsers = [...this.users];
        } else {
            this.filteredUsers = this.users.filter(user => {
                const username = user.username.toLowerCase();
                const email = user.email.toLowerCase();
                return username.includes(query) || email.includes(query);
            });
        }

        this.renderUsers();
    }

    // Afficher les utilisateurs
    renderUsers() {
        const container = document.getElementById('users-list');

        if (this.filteredUsers.length === 0) {
            const message = this.searchQuery ?
                'Aucun utilisateur trouvé pour cette recherche' :
                'Aucun utilisateur';
            container.innerHTML = `<p style="text-align: center; color: #999;">${message}</p>`;
            return;
        }

        container.innerHTML = this.filteredUsers.map(user => `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-info">
                    <h3>
                        <a href="user-profile.html?userId=${user.id}" class="user-profile-link">${user.username}</a>
                        ${user.is_admin ? '<span class="user-badge admin">ADMIN</span>' : ''}
                    </h3>
                    <p>📧 ${user.email}</p>
                    <p>📅 Inscrit le ${adminUI.formatDate(user.created_at)}</p>
                </div>
                <div class="user-stats">
                    <div class="user-stat">
                        <span class="user-stat-label">Crédits</span>
                        <span class="user-stat-value">${user.credits || 0}</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="admin-btn-primary edit-user-btn" data-user-id="${user.id}">
                        ✏️ Modifier
                    </button>
                    <button class="admin-btn-danger delete-user-btn" data-user-id="${user.id}">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
        `).join('');

        this.attachUserEvents();
    }

    // Attacher les événements
    attachEvents() {
        // Champ de recherche
        const searchInput = document.getElementById('users-search-input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.applyFilters();
        });

        // Bouton créer un utilisateur
        const createBtn = document.getElementById('create-user-btn');
        createBtn.addEventListener('click', () => this.openUserModal());

        // Fermer la modale
        const closeBtn = document.getElementById('user-modal-close');
        closeBtn.addEventListener('click', () => adminUI.closeModal('user-modal'));

        const cancelBtn = document.getElementById('user-form-cancel');
        cancelBtn.addEventListener('click', () => adminUI.closeModal('user-modal'));

        // Soumettre le formulaire
        const form = document.getElementById('user-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });

        // Boutons ajustement crédits
        const creditsAddBtn = document.getElementById('user-credits-add-btn');
        const creditsRemoveBtn = document.getElementById('user-credits-remove-btn');
        const creditsAdjustmentInput = document.getElementById('user-credits-adjustment');

        creditsAddBtn.addEventListener('click', async () => {
            const userId = document.getElementById('user-id').value;
            const amount = Math.abs(parseInt(creditsAdjustmentInput.value) || 0);

            if (amount > 0 && userId) {
                await this.modifyUserCredits(parseInt(userId), amount);
                creditsAdjustmentInput.value = 0;
            }
        });

        creditsRemoveBtn.addEventListener('click', async () => {
            const userId = document.getElementById('user-id').value;
            const amount = Math.abs(parseInt(creditsAdjustmentInput.value) || 0);

            if (amount > 0 && userId) {
                await this.modifyUserCredits(parseInt(userId), -amount);
                creditsAdjustmentInput.value = 0;
            }
        });
    }

    // Attacher les événements des boutons utilisateurs
    attachUserEvents() {
        // Boutons modifier
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = parseInt(btn.dataset.userId);
                this.editUser(userId);
            });
        });

        // Boutons supprimer
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = parseInt(btn.dataset.userId);
                this.deleteUser(userId);
            });
        });
    }

    // Ouvrir la modale pour créer/éditer un utilisateur
    async openUserModal(user = null) {
        this.currentUser = user;

        const title = document.getElementById('user-modal-title');
        const userId = document.getElementById('user-id');
        const username = document.getElementById('user-username');
        const email = document.getElementById('user-email');
        const password = document.getElementById('user-password');
        const isAdmin = document.getElementById('user-is-admin');
        const passwordGroup = document.getElementById('user-password-group');
        const creditsGroup = document.getElementById('user-credits-group');
        const themesGroup = document.getElementById('user-themes-group');
        const creditsAdjustmentInput = document.getElementById('user-credits-adjustment');

        if (user) {
            title.textContent = 'Modifier un utilisateur';
            userId.value = user.id;
            username.value = user.username;
            email.value = user.email;
            password.value = '';
            password.required = false;
            isAdmin.checked = user.is_admin;
            creditsAdjustmentInput.value = 0;
            passwordGroup.querySelector('small').style.display = 'block';
            creditsGroup.style.display = 'block';
            themesGroup.style.display = 'block';

            // Charger les thèmes de l'utilisateur
            await this.loadUserThemes(user.id);
        } else {
            title.textContent = 'Créer un utilisateur';
            userId.value = '';
            username.value = '';
            email.value = '';
            password.value = '';
            password.required = true;
            isAdmin.checked = false;
            creditsAdjustmentInput.value = 0;
            passwordGroup.querySelector('small').style.display = 'none';
            creditsGroup.style.display = 'none';
        }

        adminUI.showModal('user-modal');
    }

    // Sauvegarder un utilisateur
    async saveUser() {
        const userId = document.getElementById('user-id').value;
        const username = document.getElementById('user-username').value;
        const email = document.getElementById('user-email').value;
        const password = document.getElementById('user-password').value;
        const isAdmin = document.getElementById('user-is-admin').checked;

        // Empêcher un admin de se retirer ses propres droits via la modale
        if (userId) {
            const currentUser = authService.getCurrentUser();
            const targetUser = this.users.find(u => u.id === parseInt(userId));

            if (targetUser && targetUser.id === currentUser.id && targetUser.is_admin === 1 && !isAdmin) {
                adminUI.showToast('Vous ne pouvez pas vous retirer vos propres droits admin', 'error');
                return;
            }
        }

        const userData = {
            username,
            email,
            is_admin: isAdmin
        };

        // Ajouter le mot de passe seulement s'il est fourni
        if (password) {
            userData.password = password;
        }

        try {
            let response;
            if (userId) {
                // Mise à jour
                response = await authService.fetchAPI(`/users/${userId}`, {
                    method: 'PUT',
                    body: JSON.stringify(userData)
                });
            } else {
                // Création
                if (!password) {
                    adminUI.showToast('Le mot de passe est requis', 'error');
                    return;
                }
                response = await authService.fetchAPI('/users', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
            }

            if (response.ok) {
                const savedUser = await response.json();
                const finalUserId = userId || savedUser.id;

                // Sauvegarder les thèmes si on édite un utilisateur
                if (userId && this.selectedThemes.length > 0) {
                    const themesSaved = await this.saveUserThemes(finalUserId);
                    if (!themesSaved) {
                        return; // Arrêter si la sauvegarde des thèmes a échoué
                    }
                }

                adminUI.showToast(userId ? 'Utilisateur modifié' : 'Utilisateur créé', 'success');
                adminUI.closeModal('user-modal');
                await this.loadUsers();
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to save user:', error);
            adminUI.showToast('Erreur lors de la sauvegarde', 'error');
        }
    }

    // Modifier un utilisateur
    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.openUserModal(user);
        }
    }

    // Toggle admin status
    async toggleAdmin(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Empêcher un admin de se retirer ses propres droits
        const currentUser = authService.getCurrentUser();
        console.log('Current user ID:', currentUser.id, 'Target user ID:', userId, 'Is admin?', user.is_admin);

        if (user.id === currentUser.id && user.is_admin === 1) {
            await adminUI.showToast('Vous ne pouvez pas vous retirer vos propres droits admin', 'error');
            return;
        }

        const action = user.is_admin ? 'retirer les droits admin de' : 'promouvoir';
        if (!await adminUI.confirm(`Voulez-vous vraiment ${action} ${user.username} ?`)) {
            return;
        }

        try {
            const response = await authService.fetchAPI(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ is_admin: !user.is_admin })
            });

            if (response.ok) {
                adminUI.showToast('Statut admin modifié', 'success');
                await this.loadUsers();
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to toggle admin:', error);
            adminUI.showToast('Erreur', 'error');
        }
    }

    // Modifier les crédits d'un utilisateur
    async modifyUserCredits(userId, amount) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        try {
            const response = await authService.fetchAPI(`/users/${userId}/credits`, {
                method: 'POST',
                body: JSON.stringify({ amount })
            });

            if (response.ok) {
                const action = amount > 0 ? 'ajouté' : 'retiré';
                adminUI.showToast(`${Math.abs(amount)} crédit(s) ${action}`, 'success');
                await this.loadUsers();
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to modify credits:', error);
            adminUI.showToast('Erreur lors de la modification des crédits', 'error');
        }
    }

    // Supprimer un utilisateur
    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (!await adminUI.confirm(`Voulez-vous vraiment supprimer ${user.username} ? Cette action est irréversible.`)) {
            return;
        }

        try {
            const response = await authService.fetchAPI(`/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                adminUI.showToast('Utilisateur supprimé', 'success');
                await this.loadUsers();
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            adminUI.showToast('Erreur lors de la suppression', 'error');
        }
    }

    // Récupérer la liste des utilisateurs (pour la section crédits)
    getUsers() {
        return this.users;
    }

    // Charger les thèmes disponibles et sélectionnés pour un utilisateur
    async loadUserThemes(userId) {
        try {
            // Charger tous les thèmes disponibles
            const themesResponse = await authService.fetchAPI('/themes/all');
            this.allThemes = await themesResponse.json();

            // Charger les thèmes sélectionnés par l'utilisateur
            const userThemesResponse = await authService.fetchAPI(`/users/${userId}/themes`);
            const userThemes = await userThemesResponse.json();
            this.selectedThemes = userThemes.map(t => t.slug);

            // Charger les stats de cartes par thème
            const statsResponse = await authService.fetchAPI(`/users/${userId}/themes/stats`);
            const stats = await statsResponse.json();
            this.themeStats = {};
            stats.forEach(stat => {
                this.themeStats[stat.theme_slug] = stat.card_count;
            });

            // Afficher les thèmes
            this.renderThemes();
        } catch (error) {
            console.error('Failed to load themes:', error);
            adminUI.showToast('Erreur lors du chargement des thèmes', 'error');
        }
    }

    // Afficher les thèmes dans la modale
    renderThemes() {
        const container = document.getElementById('user-themes-selector');
        container.innerHTML = '';

        this.allThemes.forEach(theme => {
            const isSelected = this.selectedThemes.includes(theme.slug);
            const cardCount = this.themeStats[theme.slug] || 0;

            const themeEl = document.createElement('div');
            themeEl.className = `theme-option-admin ${isSelected ? 'selected' : ''}`;
            themeEl.dataset.slug = theme.slug;

            themeEl.innerHTML = `
                <div class="theme-option-admin-icon">${theme.icon}</div>
                <div class="theme-option-admin-info">
                    <div class="theme-option-admin-name">${theme.name}</div>
                    ${cardCount > 0 ? `<div class="theme-option-admin-count">${cardCount} carte(s)</div>` : ''}
                </div>
                <div class="theme-option-admin-check">✓</div>
            `;

            themeEl.addEventListener('click', () => this.toggleTheme(theme.slug, theme.name));

            container.appendChild(themeEl);
        });
    }

    // Toggle un thème
    async toggleTheme(slug, themeName) {
        const index = this.selectedThemes.indexOf(slug);

        if (index > -1) {
            // Désélectionner (mais minimum 3)
            if (this.selectedThemes.length <= 3) {
                adminUI.showToast('Minimum 3 thèmes requis', 'error');
                return;
            }

            // Avertir si l'utilisateur a des cartes dans ce thème
            const cardCount = this.themeStats[slug] || 0;
            if (cardCount > 0) {
                if (!await confirm(`⚠️ ATTENTION : L'utilisateur possède ${cardCount} carte(s) unique(s) dans le thème "${themeName}".<br><br>En décochant ce thème :<br>• Les cartes ne seront PAS supprimées<br>• Elles seront simplement masquées<br>• L'utilisateur ne piochera plus de cartes de ce thème<br>• Les cartes pourront être récupérées en recochant le thème<br><br>Confirmer la désélection ?`)) {
                    return;
                }
            }

            this.selectedThemes.splice(index, 1);
        } else {
            // Sélectionner (mais maximum 10)
            if (this.selectedThemes.length >= 10) {
                adminUI.showToast('Maximum 10 thèmes autorisés', 'error');
                return;
            }
            this.selectedThemes.push(slug);
        }

        this.renderThemes();
    }

    // Sauvegarder les thèmes lors de la sauvegarde de l'utilisateur
    async saveUserThemes(userId) {
        if (this.selectedThemes.length < 3) {
            adminUI.showToast('Minimum 3 thèmes requis', 'error');
            return false;
        }

        if (this.selectedThemes.length > 10) {
            adminUI.showToast('Maximum 10 thèmes autorisés', 'error');
            return false;
        }

        try {
            const response = await authService.fetchAPI(`/users/${userId}/themes`, {
                method: 'PUT',
                body: JSON.stringify({ theme_slugs: this.selectedThemes })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la sauvegarde des thèmes');
            }

            return true;
        } catch (error) {
            console.error('Failed to save themes:', error);
            adminUI.showToast(error.message, 'error');
            return false;
        }
    }
}

// Instance globale
const adminUsers = new AdminUsers();
