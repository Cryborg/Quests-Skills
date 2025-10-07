// Gestion des cartes dans l'admin

class AdminCards {
    constructor() {
        this.cards = [];
        this.themes = [];
        this.filteredCards = [];
        this.currentCard = null;
        this.currentTheme = null;
        this.filters = {
            rarity: ''
        };
        this.collapsedThemes = new Set(); // Track collapsed themes
        this.allCollapsed = false; // Track global collapse state
    }

    // Initialiser la gestion des cartes et thèmes
    async init() {
        await Promise.all([
            this.loadThemes(),
            this.loadCards()
        ]);
        this.attachEvents();
    }

    // Charger tous les thèmes
    async loadThemes() {
        try {
            const response = await authService.fetchAPI('/themes');
            this.themes = await response.json();
        } catch (error) {
            console.error('Failed to load themes:', error);
            adminUI.showToast('Erreur lors du chargement des thèmes', 'error');
        }
    }

    // Charger toutes les cartes
    async loadCards() {
        try {
            const response = await authService.fetchAPI('/cards');
            this.cards = await response.json();
            this.applyFilters();
        } catch (error) {
            console.error('Failed to load cards:', error);
            adminUI.showToast('Erreur lors du chargement des cartes', 'error');
        }
    }

    // Obtenir les thèmes (pour d'autres modules)
    getThemes() {
        return this.themes;
    }

    // Appliquer les filtres
    applyFilters() {
        this.filteredCards = this.cards.filter(card => {
            if (this.filters.rarity && card.base_rarity !== this.filters.rarity) {
                return false;
            }
            return true;
        });
        this.renderCards();
    }

    // Afficher les cartes groupées par thème
    renderCards() {
        const container = document.getElementById('cards-by-theme-container');

        if (this.themes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucun thème. Créez-en un pour commencer !</p>';
            return;
        }

        container.innerHTML = this.themes.map(theme => {
            const themeCards = this.filteredCards.filter(card => card.category === theme.slug);
            const isCollapsed = this.collapsedThemes.has(theme.slug);

            return `
                <div class="theme-section ${isCollapsed ? 'collapsed' : ''}" data-theme-slug="${theme.slug}">
                    <div class="theme-header">
                        <div class="theme-header-left">
                            <button class="theme-collapse-btn" data-theme-slug="${theme.slug}" title="${isCollapsed ? 'Déplier' : 'Replier'}">
                                ${isCollapsed ? '▶' : '▼'}
                            </button>
                            <h3>${theme.icon} ${theme.name}</h3>
                        </div>
                        <div class="theme-actions">
                            <span class="theme-card-count">${themeCards.length} carte(s)</span>
                            <button class="admin-btn-primary create-card-in-theme-btn" data-theme-slug="${theme.slug}" title="Nouvelle carte">
                                ➕
                            </button>
                            <button class="admin-btn-secondary edit-theme-btn" data-theme-id="${theme.id}" title="Modifier le thème">
                                ✏️
                            </button>
                            <button class="admin-btn-danger delete-theme-btn" data-theme-id="${theme.id}" title="Supprimer le thème">
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div class="cards-grid">
                        ${themeCards.length === 0 ?
                            '<p style="text-align: center; color: #999; grid-column: 1 / -1; padding: 20px;">Aucune carte dans ce thème</p>' :
                            themeCards.map(card => {
                                const rarityIcon = adminUI.getRarityIcon(card.base_rarity);
                                const imageUrl = card.image.startsWith('http') ? card.image : `/shared/${card.image}`;

                                return `
                                    <div class="admin-card" data-card-id="${card.id}">
                                        <img src="${imageUrl}" alt="${card.name}" class="admin-card-image">
                                        <div class="admin-card-content">
                                            <div class="admin-card-header">
                                                <h3 class="admin-card-name">${card.name}</h3>
                                                <span class="admin-card-rarity ${card.base_rarity}">
                                                    ${rarityIcon}
                                                </span>
                                            </div>
                                            <p class="admin-card-description">${card.description}</p>
                                            <div class="admin-card-actions">
                                                <button class="edit-card-btn" data-card-id="${card.id}" title="Modifier">
                                                    ✏️
                                                </button>
                                                <button class="delete-card-btn" data-card-id="${card.id}" title="Supprimer">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')
                        }
                    </div>
                </div>
            `;
        }).join('');

        this.attachCardEvents();
        this.attachThemeEvents();
    }

    // Attacher les événements
    attachEvents() {
        // Bouton toggle global
        const toggleAllBtn = document.getElementById('toggle-all-themes-btn');
        toggleAllBtn.addEventListener('click', () => this.toggleAllThemes());

        // Bouton créer un thème
        const createThemeBtn = document.getElementById('create-theme-btn');
        createThemeBtn.addEventListener('click', () => this.openThemeModal());

        // Filtre de rareté
        const rarityFilter = document.getElementById('cards-rarity-filter');
        rarityFilter.addEventListener('change', (e) => {
            this.filters.rarity = e.target.value;
            this.applyFilters();
        });

        // Fermer les modales
        const closeCardBtn = document.getElementById('card-modal-close');
        closeCardBtn.addEventListener('click', () => adminUI.closeModal('card-modal'));

        const cancelCardBtn = document.getElementById('card-form-cancel');
        cancelCardBtn.addEventListener('click', () => adminUI.closeModal('card-modal'));

        const closeThemeBtn = document.getElementById('theme-modal-close');
        closeThemeBtn.addEventListener('click', () => adminUI.closeModal('theme-modal'));

        const cancelThemeBtn = document.getElementById('theme-form-cancel');
        cancelThemeBtn.addEventListener('click', () => adminUI.closeModal('theme-modal'));

        // Aperçu de l'image
        const imageInput = document.getElementById('card-image');
        imageInput.addEventListener('input', (e) => {
            this.updateImagePreview(e.target.value);
        });

        // Soumettre les formulaires
        const cardForm = document.getElementById('card-form');
        cardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCard();
        });

        const themeForm = document.getElementById('theme-form');
        themeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTheme();
        });
    }

    // Attacher les événements des boutons cartes
    attachCardEvents() {
        // Boutons modifier
        document.querySelectorAll('.edit-card-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cardId = parseInt(btn.dataset.cardId);
                this.editCard(cardId);
            });
        });

        // Boutons supprimer
        document.querySelectorAll('.delete-card-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cardId = parseInt(btn.dataset.cardId);
                this.deleteCard(cardId);
            });
        });
    }

    // Ouvrir la modale pour créer/éditer une carte
    openCardModal(card = null, preselectedThemeSlug = null) {
        this.currentCard = card;

        const title = document.getElementById('card-modal-title');
        const cardId = document.getElementById('card-id');
        const name = document.getElementById('card-name');
        const description = document.getElementById('card-description');
        const theme = document.getElementById('card-theme');
        const rarity = document.getElementById('card-rarity');
        const image = document.getElementById('card-image');

        // Charger les thèmes dans le select
        this.loadThemesIntoSelect();

        if (card) {
            title.textContent = 'Modifier une carte';
            cardId.value = card.id;
            name.value = card.name;
            description.value = card.description;
            theme.value = card.category;
            rarity.value = card.base_rarity;
            image.value = card.image;
            this.updateImagePreview(card.image);
        } else {
            title.textContent = 'Créer une carte';
            cardId.value = '';
            name.value = '';
            description.value = '';
            theme.value = preselectedThemeSlug || '';
            rarity.value = '';
            image.value = '';
            this.updateImagePreview('');
        }

        adminUI.showModal('card-modal');
    }

    // Charger les thèmes dans le select
    loadThemesIntoSelect() {
        const themeSelect = document.getElementById('card-theme');
        if (!themeSelect) return;

        // Récupérer les thèmes depuis adminThemes
        const themes = adminThemes.getThemes();

        // Vider le select et ajouter l'option par défaut
        themeSelect.innerHTML = '<option value="">-- Choisir un thème --</option>';

        // Ajouter les thèmes dynamiquement
        themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.slug;
            option.textContent = `${theme.icon} ${theme.name}`;
            themeSelect.appendChild(option);
        });

        // Mettre à jour aussi le filtre de thèmes dans la liste des cartes
        const filterSelect = document.getElementById('cards-theme-filter');
        if (filterSelect) {
            const selectedValue = filterSelect.value; // Sauvegarder la sélection actuelle
            filterSelect.innerHTML = '<option value="">Tous les thèmes</option>';
            themes.forEach(theme => {
                const option = document.createElement('option');
                option.value = theme.slug;
                option.textContent = `${theme.icon} ${theme.name}`;
                filterSelect.appendChild(option);
            });
            filterSelect.value = selectedValue; // Restaurer la sélection
        }
    }

    // Mettre à jour l'aperçu de l'image
    updateImagePreview(url) {
        const preview = document.getElementById('card-preview-img');
        if (url) {
            // Convertir le chemin relatif en chemin absolu pour l'aperçu (images dans shared/)
            const imageUrl = url.startsWith('http') ? url : `/shared/${url}`;
            preview.src = imageUrl;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }

    // Sauvegarder une carte
    async saveCard() {
        const cardId = document.getElementById('card-id').value;
        const name = document.getElementById('card-name').value.trim();
        const description = document.getElementById('card-description').value.trim();
        const theme = document.getElementById('card-theme').value;
        const rarity = document.getElementById('card-rarity').value;
        const imageUrl = document.getElementById('card-image').value.trim();

        if (!name || !description || !theme || !rarity || !imageUrl) {
            adminUI.showToast('Tous les champs sont requis', 'error');
            return;
        }

        const cardData = {
            name,
            description,
            category: theme,
            base_rarity: rarity,
            image: imageUrl
        };

        try {
            let response;
            if (cardId) {
                // Mise à jour
                response = await authService.fetchAPI(`/cards/${cardId}`, {
                    method: 'PUT',
                    body: JSON.stringify(cardData)
                });
            } else {
                // Création
                response = await authService.fetchAPI('/cards', {
                    method: 'POST',
                    body: JSON.stringify(cardData)
                });
            }

            if (response.ok) {
                adminUI.showToast(cardId ? 'Carte modifiée' : 'Carte créée', 'success');
                adminUI.closeModal('card-modal');
                await this.loadCards();
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to save card:', error);
            adminUI.showToast('Erreur lors de la sauvegarde', 'error');
        }
    }

    // Modifier une carte
    editCard(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (card) {
            this.openCardModal(card);
        }
    }

    // Supprimer une carte
    async deleteCard(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;

        if (!await adminUI.confirm(`Voulez-vous vraiment supprimer la carte "${card.name}" ? Cette action est irréversible.`)) {
            return;
        }

        try {
            const response = await authService.fetchAPI(`/cards/${cardId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                adminUI.showToast('Carte supprimée', 'success');
                await this.loadCards();
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to delete card:', error);
            adminUI.showToast('Erreur lors de la suppression', 'error');
        }
    }

    // ==================== Gestion des Thèmes ====================

    // Attacher les événements des boutons thèmes
    attachThemeEvents() {
        // Boutons collapse par thème
        document.querySelectorAll('.theme-collapse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const themeSlug = btn.dataset.themeSlug;
                this.toggleTheme(themeSlug);
            });
        });

        // Boutons créer une carte dans un thème
        document.querySelectorAll('.create-card-in-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const themeSlug = btn.dataset.themeSlug;
                this.openCardModal(null, themeSlug);
            });
        });

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

    // Toggle un thème spécifique
    toggleTheme(themeSlug) {
        if (this.collapsedThemes.has(themeSlug)) {
            this.collapsedThemes.delete(themeSlug);
        } else {
            this.collapsedThemes.add(themeSlug);
        }
        this.renderCards();
    }

    // Toggle tous les thèmes
    toggleAllThemes() {
        const toggleBtn = document.getElementById('toggle-all-themes-btn');

        if (this.allCollapsed) {
            // Tout déplier
            this.collapsedThemes.clear();
            this.allCollapsed = false;
            toggleBtn.innerHTML = '📦 Tout replier';
        } else {
            // Tout replier
            this.themes.forEach(theme => this.collapsedThemes.add(theme.slug));
            this.allCollapsed = true;
            toggleBtn.innerHTML = '📂 Tout déplier';
        }
        this.renderCards();
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
                this.renderCards();
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

        // Vérifier si le thème contient des cartes
        const themeCards = this.cards.filter(card => card.category === theme.slug);
        if (themeCards.length > 0) {
            adminUI.showToast(`Impossible de supprimer le thème "${theme.name}" : il contient ${themeCards.length} carte(s). Supprimez d'abord toutes les cartes de ce thème.`, 'error');
            return;
        }

        if (!await adminUI.confirm(`Voulez-vous vraiment supprimer le thème "${theme.name}" ?`)) {
            return;
        }

        try {
            const response = await authService.fetchAPI(`/themes/${themeId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                adminUI.showToast('Thème supprimé', 'success');
                await this.loadThemes();
                this.renderCards();
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to delete theme:', error);
            adminUI.showToast('Erreur lors de la suppression', 'error');
        }
    }
}

// Instance globale
const adminCards = new AdminCards();

// Alias pour compatibilité avec admin-ui.js qui appelle adminThemes.getThemes()
const adminThemes = {
    getThemes: () => adminCards.getThemes()
};
