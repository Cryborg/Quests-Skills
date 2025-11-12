// Gestion de l'import de collections V1

class AdminImport {
    constructor() {
        this.users = [];
        this.importData = null;
        this.isImporting = false;
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

        console.log('📋 Attaching import events:', { userSelect, jsonInput, importBtn });

        if (!userSelect || !jsonInput || !importBtn) {
            console.error('❌ Import elements not found:', { userSelect, jsonInput, importBtn });
            return;
        }

        // Activer le bouton quand les deux champs sont remplis
        const checkFormValidity = () => {
            const isValid = userSelect.value && jsonInput.value.trim();
            importBtn.disabled = !isValid;
        };

        userSelect.addEventListener('change', checkFormValidity);
        jsonInput.addEventListener('input', checkFormValidity);

        importBtn.addEventListener('click', () => {
            console.log('🔘 Import button clicked');
            this.handleImport();
        });

        console.log('✅ Import events attached successfully');
    }

    async handleImport() {
        console.log('🚀 handleImport called');

        // Éviter les appels multiples
        if (this.isImporting) {
            console.warn('⚠️ Import already in progress, ignoring');
            return;
        }

        const userId = document.getElementById('import-user-select').value;
        const jsonText = document.getElementById('import-json-input').value;
        const mergeMode = document.getElementById('import-merge-mode').checked;
        const resultDiv = document.getElementById('import-result');

        console.log('📊 Import params:', { userId, jsonLength: jsonText?.length, mergeMode });

        // Trouver le nom de l'utilisateur sélectionné
        const selectedUser = this.users.find(u => u.id === parseInt(userId));
        const userName = selectedUser ? selectedUser.username : 'utilisateur inconnu';

        // Confirmation avant import - AVANT de marquer isImporting = true
        const confirmMessage = mergeMode
            ? `Voulez-vous vraiment ajouter ces cartes à la collection de ${userName} ?\n\nLes cartes existantes seront conservées.`
            : `⚠️ ATTENTION ⚠️\n\nVoulez-vous vraiment importer cette collection pour ${userName} ?\n\nToutes les cartes existantes de cet utilisateur seront DÉFINITIVEMENT SUPPRIMÉES avant l'import !`;

        if (!confirm(confirmMessage)) {
            console.log('❌ Import cancelled by user');
            return;
        }

        // Marquer comme en cours APRÈS la confirmation
        this.isImporting = true;
        console.log('✅ Import confirmed, starting...');

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

            // Charger toutes les cartes V2 une seule fois
            resultDiv.innerHTML = '<div class="loading">Chargement des cartes V2...</div>';
            const v2Cards = await this.loadAllV2Cards();

            // Créer un mapping entre les IDs V1 et V2
            resultDiv.innerHTML = '<div class="loading">Import des cartes...</div>';
            const cardMapping = this.mapV1CardsToV2(data.allCards);

            // Importer les cartes
            const importedCards = await this.importCollection(userId, data.collection, cardMapping, v2Cards, mergeMode);

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
        } finally {
            // Toujours remettre le flag à false
            this.isImporting = false;
            console.log('🏁 Import finished');
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

    async importCollection(userId, collection, cardMapping, v2Cards, mergeMode) {
        let imported = 0;
        let skipped = 0;

        // Préparer un tableau de cartes à ajouter
        const cardsToAdd = [];

        // Pour chaque carte dans la collection V1
        for (const [cardId, cardData] of Object.entries(collection)) {
            try {
                const v1CardInfo = cardMapping[cardId];

                if (!v1CardInfo) {
                    console.warn(`Card ${cardId} not found in mapping`);
                    skipped++;
                    continue;
                }

                // Trouver la carte correspondante dans la V2 (recherche locale)
                const v2Card = v2Cards.find(card =>
                    card.name.toLowerCase() === v1CardInfo.name.toLowerCase() &&
                    card.category === v1CardInfo.theme
                );

                if (!v2Card) {
                    console.warn(`Card ${v1CardInfo.name} (${v1CardInfo.theme}) not found in V2`);
                    skipped++;
                    continue;
                }

                // Ajouter au tableau avec le count
                cardsToAdd.push({
                    card_id: v2Card.id,
                    count: cardData.count
                });
                imported++;

            } catch (error) {
                console.error(`Failed to import card ${cardId}:`, error);
                skipped++;
            }
        }

        // Ajouter toutes les cartes en une seule requête
        if (cardsToAdd.length > 0) {
            await this.addCardsToUser(userId, cardsToAdd);
        }

        return { imported, skipped };
    }

    async loadAllV2Cards() {
        try {
            const response = await authService.fetchAPI('/cards');
            return await response.json();
        } catch (error) {
            console.error('Failed to load V2 cards:', error);
            throw new Error('Impossible de charger les cartes V2');
        }
    }

    async addCardsToUser(userId, cardsArray) {
        try {
            console.log(`📤 Adding ${cardsArray.length} cards to user ${userId}`);

            const response = await authService.fetchAPI(`/users/${userId}/cards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cards: cardsArray })
            });

            if (!response.ok) {
                throw new Error(`Failed to add cards: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Successfully added cards:`, result);
            return result;
        } catch (error) {
            console.error(`Failed to add cards to user ${userId}:`, error);
            throw error;
        }
    }

    async deleteAllUserCards(userId) {
        try {
            // Supprimer toutes les cartes de l'utilisateur en une seule requête
            const response = await authService.fetchAPI(`/users/${userId}/cards`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete user cards: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Deleted ${result.deleted} cards for user ${userId}`);
            return result.deleted;
        } catch (error) {
            console.error(`Failed to delete user cards:`, error);
            throw error;
        }
    }
}

// Instance globale
const adminImport = new AdminImport();
