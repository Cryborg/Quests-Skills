// Gestion de l'import de collections V1

class AdminImport {
    constructor() {
        this.users = [];
        this.importData = null;
    }

    async init() {
        await this.loadUsers();
        this.attachEvents();
    }

    async loadUsers() {
        try {
            const response = await authService.fetchAPI('/users');
            this.users = await response.json();
            this.populateUserSelect();
        } catch (error) {
            console.error('Failed to load users:', error);
            adminUI.showToast('Erreur lors du chargement des utilisateurs', 'error');
        }
    }

    populateUserSelect() {
        const select = document.getElementById('import-user-select');
        select.innerHTML = '<option value="">-- Sélectionner un utilisateur --</option>';

        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} (${user.email})`;
            select.appendChild(option);
        });
    }

    attachEvents() {
        const userSelect = document.getElementById('import-user-select');
        const jsonInput = document.getElementById('import-json-input');
        const importBtn = document.getElementById('import-collection-btn');

        // Activer le bouton quand les deux champs sont remplis
        const checkFormValidity = () => {
            const isValid = userSelect.value && jsonInput.value.trim();
            importBtn.disabled = !isValid;
        };

        userSelect.addEventListener('change', checkFormValidity);
        jsonInput.addEventListener('input', checkFormValidity);

        importBtn.addEventListener('click', () => this.handleImport());
    }

    async handleImport() {
        const userId = document.getElementById('import-user-select').value;
        const jsonText = document.getElementById('import-json-input').value;
        const mergeMode = document.getElementById('import-merge-mode').checked;
        const resultDiv = document.getElementById('import-result');

        // Trouver le nom de l'utilisateur sélectionné
        const selectedUser = this.users.find(u => u.id === parseInt(userId));
        const userName = selectedUser ? selectedUser.username : 'utilisateur inconnu';

        // Confirmation avant import
        const confirmMessage = mergeMode
            ? `Voulez-vous vraiment ajouter ces cartes à la collection de ${userName} ?\n\nLes cartes existantes seront conservées.`
            : `⚠️ ATTENTION ⚠️\n\nVoulez-vous vraiment importer cette collection pour ${userName} ?\n\nToutes les cartes existantes de cet utilisateur seront DÉFINITIVEMENT SUPPRIMÉES avant l'import !`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            // Parser le JSON
            const data = JSON.parse(jsonText);

            // Valider la structure
            if (!data.collection || !data.allCards) {
                throw new Error('Format JSON invalide : les propriétés "collection" et "allCards" sont requises');
            }

            // Afficher les infos d'import
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div class="loading">Import en cours...</div>';

            // Si pas en mode fusion, supprimer toutes les cartes existantes
            if (!mergeMode) {
                resultDiv.innerHTML = '<div class="loading">Suppression des cartes existantes...</div>';
                await this.deleteAllUserCards(userId);
            }

            // Créer un mapping entre les IDs V1 et V2
            resultDiv.innerHTML = '<div class="loading">Import des cartes...</div>';
            const cardMapping = this.mapV1CardsToV2(data.allCards);

            // Importer les cartes
            const importedCards = await this.importCollection(userId, data.collection, cardMapping, mergeMode);

            // Afficher le résultat
            resultDiv.innerHTML = `
                <div class="success-message">
                    <h3>✅ Import réussi !</h3>
                    <p><strong>Utilisateur :</strong> ${userName}</p>
                    <p><strong>Cartes importées :</strong> ${importedCards.imported}</p>
                    ${importedCards.skipped > 0 ? `<p><strong>Cartes ignorées :</strong> ${importedCards.skipped} (non trouvée(s) dans la v2)</p>` : ''}
                    <p>${!mergeMode ? '🗑️ Les cartes existantes ont été supprimées avant l\'import' : '➕ Les cartes ont été ajoutées à la collection existante'}</p>
                </div>
            `;

            adminUI.showToast(`Collection importée pour ${userName} !`, 'success');

        } catch (error) {
            console.error('Import error:', error);
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div class="error-message">
                    <h3>❌ Erreur d'import</h3>
                    <p>${error.message}</p>
                </div>
            `;
            adminUI.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    mapV1CardsToV2(v1Cards) {
        // Mapping manuel des IDs de cartes V1 vers V2
        const mapping = {};

        v1Cards.forEach(card => {
            // Le nom et le thème permettent de faire le mapping
            mapping[card.id] = {
                name: card.name,
                theme: card.theme,
                baseRarity: card.baseRarity
            };
        });

        return mapping;
    }

    async importCollection(userId, collection, cardMapping, mergeMode) {
        let imported = 0;
        let skipped = 0;

        // Pour chaque carte dans la collection V1
        for (const [cardId, cardData] of Object.entries(collection)) {
            try {
                const v1CardInfo = cardMapping[cardId];

                if (!v1CardInfo) {
                    console.warn(`Card ${cardId} not found in mapping`);
                    skipped++;
                    continue;
                }

                // Trouver la carte correspondante dans la V2 par nom et thème
                const v2Card = await this.findV2CardByNameAndTheme(v1CardInfo.name, v1CardInfo.theme);

                if (!v2Card) {
                    console.warn(`Card ${v1CardInfo.name} (${v1CardInfo.theme}) not found in V2`);
                    skipped++;
                    continue;
                }

                // Ajouter la carte à la collection de l'utilisateur
                await this.addCardToUser(userId, v2Card.id, cardData.count);
                imported++;

            } catch (error) {
                console.error(`Failed to import card ${cardId}:`, error);
                skipped++;
            }
        }

        return { imported, skipped };
    }

    async findV2CardByNameAndTheme(name, theme) {
        try {
            const response = await authService.fetchAPI('/cards');
            const cards = await response.json();

            return cards.find(card =>
                card.name.toLowerCase() === name.toLowerCase() &&
                card.theme === theme
            );
        } catch (error) {
            console.error('Failed to find V2 card:', error);
            return null;
        }
    }

    async addCardToUser(userId, cardId, count) {
        try {
            // Ajouter chaque exemplaire de la carte
            for (let i = 0; i < count; i++) {
                const response = await authService.fetchAPI(`/users/${userId}/cards`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ card_id: cardId })
                });

                if (!response.ok) {
                    throw new Error(`Failed to add card: ${response.statusText}`);
                }
            }
        } catch (error) {
            console.error(`Failed to add card ${cardId} to user ${userId}:`, error);
            throw error;
        }
    }

    async deleteAllUserCards(userId) {
        try {
            // Récupérer toutes les cartes de l'utilisateur
            const response = await authService.fetchAPI(`/users/${userId}/cards`);

            if (!response.ok) {
                throw new Error(`Failed to fetch user cards: ${response.statusText}`);
            }

            const userCards = await response.json();

            // Supprimer chaque carte
            for (const userCard of userCards) {
                const deleteResponse = await authService.fetchAPI(`/users/${userId}/cards/${userCard.id}`, {
                    method: 'DELETE'
                });

                if (!deleteResponse.ok) {
                    console.warn(`Failed to delete card ${userCard.id}:`, deleteResponse.statusText);
                }
            }

            console.log(`Deleted ${userCards.length} cards for user ${userId}`);
        } catch (error) {
            console.error(`Failed to delete user cards:`, error);
            throw error;
        }
    }
}

// Instance globale
const adminImport = new AdminImport();
