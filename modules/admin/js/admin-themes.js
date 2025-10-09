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
        console.log('🟢 [loadThemes] Chargement des thèmes...');
        try {
            const response = await authService.fetchAPI('/themes/all');
            this.themes = await response.json();
            console.log('🟢 [loadThemes] Thèmes chargés:', this.themes.length);
            this.renderThemes();
        } catch (error) {
            console.error('Failed to load themes:', error);
            adminUI.showToast('Erreur lors du chargement des thèmes', 'error');
        }
    }

    // Afficher les thèmes
    renderThemes() {
        console.log('🟢 [renderThemes] Affichage de', this.themes.length, 'thèmes');
        const container = document.getElementById('themes-container');
        if (!container) {
            console.error('themes-container not found');
            return;
        }

        if (this.themes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Aucun thème. Créez-en un pour commencer !</p>';
            console.log('🟢 [renderThemes] Container vidé (aucun thème)');
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
        console.log('🔵 [saveTheme] START - Fonction appelée');

        const saveBtn = document.querySelector('#theme-form button[type="submit"]');
        console.log('🔵 [saveTheme] Bouton trouvé:', saveBtn);

        const spinner = ButtonSpinner.start(saveBtn);
        console.log('🔵 [saveTheme] Spinner démarré, bouton disabled:', saveBtn.disabled);

        const themeId = document.getElementById('theme-id').value;
        const slug = document.getElementById('theme-slug').value.trim();
        const name = document.getElementById('theme-name').value.trim();
        const icon = document.getElementById('theme-icon').value.trim();

        console.log('🔵 [saveTheme] Données:', { themeId, slug, name, icon });

        if (!slug || !name || !icon) {
            console.log('🔴 [saveTheme] Validation échouée');
            adminUI.showToast('Tous les champs sont requis', 'error');
            spinner.stop();
            return;
        }

        const themeData = {
            slug,
            name,
            icon
        };

        try {
            console.log('🔵 [saveTheme] Début appel API...');
            let response;
            if (themeId) {
                console.log('🔵 [saveTheme] Mode UPDATE');
                // Mise à jour
                response = await authService.fetchAPI(`/themes/${themeId}`, {
                    method: 'PUT',
                    body: JSON.stringify(themeData)
                });
            } else {
                console.log('🔵 [saveTheme] Mode CREATE');
                // Création
                response = await authService.fetchAPI('/themes', {
                    method: 'POST',
                    body: JSON.stringify(themeData)
                });
            }
            console.log('🔵 [saveTheme] Réponse API reçue:', response.status);

            if (response.ok) {
                adminUI.showToast(themeId ? 'Thème modifié' : 'Thème créé', 'success');
                adminUI.closeModal('theme-modal');
                await this.loadThemes();

                // Recharger les thèmes et cartes dans adminCards pour mise à jour immédiate
                if (typeof adminCards !== 'undefined') {
                    await adminCards.loadThemes();
                    await adminCards.loadCards();
                }
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to save theme:', error);
            adminUI.showToast('Erreur lors de la sauvegarde', 'error');
        } finally {
            spinner.stop();
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

        const deleteBtn = event.target;
        const spinner = ButtonSpinner.start(deleteBtn);

        try {
            const response = await authService.fetchAPI(`/themes/${themeId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                adminUI.showToast('Thème supprimé', 'success');
                await this.loadThemes();

                // Recharger les thèmes et cartes dans adminCards pour mise à jour immédiate
                if (typeof adminCards !== 'undefined') {
                    await adminCards.loadThemes();
                    await adminCards.loadCards();
                }
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to delete theme:', error);
            adminUI.showToast('Erreur lors de la suppression', 'error');
        } finally {
            spinner.stop();
        }
    }

    // Récupérer la liste des thèmes (pour la création de cartes)
    getThemes() {
        return this.themes;
    }
}

// Instance globale
const adminThemes = new AdminThemes();
