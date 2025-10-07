// Gestion des cartes dans l'admin

class AdminCards {
    constructor() {
        this.cards = [];
        this.filteredCards = [];
        this.currentCard = null;
        this.filters = {
            theme: '',
            rarity: ''
        };
    }

    // Initialiser la gestion des cartes
    async init() {
        await this.loadCards();
        this.attachEvents();
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

    // Appliquer les filtres
    applyFilters() {
        this.filteredCards = this.cards.filter(card => {
            if (this.filters.theme && card.category !== this.filters.theme) {
                return false;
            }
            if (this.filters.rarity && card.base_rarity !== this.filters.rarity) {
                return false;
            }
            return true;
        });
        this.renderCards();
    }

    // Afficher les cartes
    renderCards() {
        const container = document.getElementById('cards-grid');

        if (this.filteredCards.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1 / -1;">Aucune carte</p>';
            return;
        }

        container.innerHTML = this.filteredCards.map(card => {
            const themeIcon = adminUI.getThemeIcon(card.category);
            const themeLabel = adminUI.getThemeLabel(card.category);
            const rarityIcon = adminUI.getRarityIcon(card.base_rarity);
            // Convertir le chemin relatif en chemin absolu (images dans shared/)
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
                        <p class="admin-card-theme">
                            ${themeIcon} ${themeLabel}
                        </p>
                        <p class="admin-card-description">${card.description}</p>
                        <div class="admin-card-actions">
                            <button class="admin-btn-primary edit-card-btn" data-card-id="${card.id}">
                                ✏️ Modifier
                            </button>
                            <button class="admin-btn-danger delete-card-btn" data-card-id="${card.id}">
                                🗑️ Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.attachCardEvents();
    }

    // Attacher les événements
    attachEvents() {
        // Bouton créer une carte
        const createBtn = document.getElementById('create-card-btn');
        createBtn.addEventListener('click', () => this.openCardModal());

        // Filtres
        const themeFilter = document.getElementById('cards-theme-filter');
        themeFilter.addEventListener('change', (e) => {
            this.filters.theme = e.target.value;
            this.applyFilters();
        });

        const rarityFilter = document.getElementById('cards-rarity-filter');
        rarityFilter.addEventListener('change', (e) => {
            this.filters.rarity = e.target.value;
            this.applyFilters();
        });

        // Fermer la modale
        const closeBtn = document.getElementById('card-modal-close');
        closeBtn.addEventListener('click', () => adminUI.closeModal('card-modal'));

        const cancelBtn = document.getElementById('card-form-cancel');
        cancelBtn.addEventListener('click', () => adminUI.closeModal('card-modal'));

        // Aperçu de l'image
        const imageInput = document.getElementById('card-image');
        imageInput.addEventListener('input', (e) => {
            this.updateImagePreview(e.target.value);
        });

        // Soumettre le formulaire
        const form = document.getElementById('card-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCard();
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
    openCardModal(card = null) {
        this.currentCard = card;

        const title = document.getElementById('card-modal-title');
        const cardId = document.getElementById('card-id');
        const name = document.getElementById('card-name');
        const description = document.getElementById('card-description');
        const theme = document.getElementById('card-theme');
        const rarity = document.getElementById('card-rarity');
        const image = document.getElementById('card-image');

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
            theme.value = '';
            rarity.value = '';
            image.value = '';
            this.updateImagePreview('');
        }

        adminUI.showModal('card-modal');
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
}

// Instance globale
const adminCards = new AdminCards();
