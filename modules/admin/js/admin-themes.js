// Gestion des thèmes dans l'admin

class AdminThemes {
    constructor() {
        this.themes = [];
        this.currentTheme = null;
    }

    // Initialiser la gestion des thèmes
    async init() {
        await this.loadThemes();
        this.attachEvents();
    }

    // Charger tous les thèmes
    async loadThemes() {
        try {
            const response = await authService.fetchAPI('/themes');
            this.themes = await response.json();
            this.renderThemes();
        } catch (error) {
            console.error('Failed to load themes:', error);
            adminUI.showToast('Erreur lors du chargement des thèmes', 'error');
        }
    }

    // Afficher les thèmes
    renderThemes() {
        const container = document.getElementById('themes-list');

        if (this.themes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">Aucun thème</p>';
            return;
        }

        container.innerHTML = this.themes.map(theme => `
            <div class="theme-card" data-theme-id="${theme.id}">
                <div class="theme-info">
                    <div class="theme-icon">${theme.icon}</div>
                    <div class="theme-details">
                        <h3>${theme.name}</h3>
                        <p class="theme-slug">Slug: ${theme.slug}</p>
                    </div>
                </div>
                <div class="theme-actions">
                    <button class="admin-btn-primary edit-theme-btn" data-theme-id="${theme.id}">
                        ✏️ Modifier
                    </button>
                    <button class="admin-btn-danger delete-theme-btn" data-theme-id="${theme.id}">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
        `).join('');

        this.attachThemeEvents();
    }

    // Attacher les événements
    attachEvents() {
        // Bouton créer un thème
        const createBtn = document.getElementById('create-theme-btn');
        createBtn.addEventListener('click', () => this.openThemeModal());

        // Fermer la modale
        const closeBtn = document.getElementById('theme-modal-close');
        closeBtn.addEventListener('click', () => adminUI.closeModal('theme-modal'));

        const cancelBtn = document.getElementById('theme-form-cancel');
        cancelBtn.addEventListener('click', () => adminUI.closeModal('theme-modal'));

        // Soumettre le formulaire
        const form = document.getElementById('theme-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTheme();
        });
    }

    // Attacher les événements des boutons thèmes
    attachThemeEvents() {
        // Boutons modifier
        document.querySelectorAll('.edit-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const themeId = parseInt(btn.dataset.themeId);
                this.editTheme(themeId);
            });
        });

        // Boutons supprimer
        document.querySelectorAll('.delete-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const themeId = parseInt(btn.dataset.themeId);
                this.deleteTheme(themeId);
            });
        });
    }

    // Ouvrir la modale pour créer/éditer un thème
    openThemeModal(theme = null) {
        this.currentTheme = theme;

        const title = document.getElementById('theme-modal-title');
        const themeId = document.getElementById('theme-id');
        const slug = document.getElementById('theme-slug');
        const name = document.getElementById('theme-name');
        const icon = document.getElementById('theme-icon');

        if (theme) {
            title.textContent = 'Modifier un thème';
            themeId.value = theme.id;
            slug.value = theme.slug;
            slug.readOnly = true; // Ne pas modifier le slug en édition
            name.value = theme.name;
            icon.value = theme.icon;
        } else {
            title.textContent = 'Créer un thème';
            themeId.value = '';
            slug.value = '';
            slug.readOnly = false;
            name.value = '';
            icon.value = '';
        }

        adminUI.showModal('theme-modal');
    }

    // Sauvegarder un thème
    async saveTheme() {
        const themeId = document.getElementById('theme-id').value;
        const slug = document.getElementById('theme-slug').value.trim();
        const name = document.getElementById('theme-name').value.trim();
        const icon = document.getElementById('theme-icon').value.trim();

        if (!slug || !name || !icon) {
            adminUI.showToast('Tous les champs sont requis', 'error');
            return;
        }

        const themeData = {
            slug,
            name,
            icon
        };

        try {
            let response;
            if (themeId) {
                // Mise à jour
                response = await authService.fetchAPI(`/themes/${themeId}`, {
                    method: 'PUT',
                    body: JSON.stringify(themeData)
                });
            } else {
                // Création
                response = await authService.fetchAPI('/themes', {
                    method: 'POST',
                    body: JSON.stringify(themeData)
                });
            }

            if (response.ok) {
                adminUI.showToast(themeId ? 'Thème modifié' : 'Thème créé', 'success');
                adminUI.closeModal('theme-modal');
                await this.loadThemes();

                // Recharger les cartes pour mettre à jour les filtres
                if (typeof adminCards !== 'undefined') {
                    await adminCards.loadCards();
                }
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to save theme:', error);
            adminUI.showToast('Erreur lors de la sauvegarde', 'error');
        }
    }

    // Modifier un thème
    editTheme(themeId) {
        const theme = this.themes.find(t => t.id === themeId);
        if (theme) {
            this.openThemeModal(theme);
        }
    }

    // Supprimer un thème
    async deleteTheme(themeId) {
        const theme = this.themes.find(t => t.id === themeId);
        if (!theme) return;

        if (!await adminUI.confirm(`Voulez-vous vraiment supprimer le thème "${theme.name}" ? Les cartes utilisant ce thème ne pourront plus être filtrées.`)) {
            return;
        }

        try {
            const response = await authService.fetchAPI(`/themes/${themeId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                adminUI.showToast('Thème supprimé', 'success');
                await this.loadThemes();

                // Recharger les cartes pour mettre à jour les filtres
                if (typeof adminCards !== 'undefined') {
                    await adminCards.loadCards();
                }
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to delete theme:', error);
            adminUI.showToast('Erreur lors de la suppression', 'error');
        }
    }

    // Récupérer la liste des thèmes (pour la création de cartes)
    getThemes() {
        return this.themes;
    }
}

// Instance globale
const adminThemes = new AdminThemes();
