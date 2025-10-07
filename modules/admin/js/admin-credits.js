// Gestion des crédits dans l'admin

class AdminCredits {
    constructor() {
        this.users = [];
    }

    // Initialiser la gestion des crédits
    async init() {
        await this.loadUsers();
        this.attachEvents();
    }

    // Charger les utilisateurs
    async loadUsers() {
        this.users = adminUsers.getUsers();
        this.populateUserSelect();
    }

    // Peupler le select des utilisateurs
    populateUserSelect() {
        const select = document.getElementById('credits-user-select');
        select.innerHTML = '<option value="">-- Choisir un utilisateur --</option>';

        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} (${user.credits || 0} crédits)`;
            select.appendChild(option);
        });
    }

    // Attacher les événements
    attachEvents() {
        // Bouton ajouter des crédits
        const addBtn = document.getElementById('add-credits-btn');
        addBtn.addEventListener('click', () => this.addCredits());

        // Bouton retirer des crédits
        const removeBtn = document.getElementById('remove-credits-btn');
        removeBtn.addEventListener('click', () => this.removeCredits());

        // Bouton ajouter des crédits à tout le monde
        const addAllBtn = document.getElementById('add-credits-all-btn');
        addAllBtn.addEventListener('click', () => this.addCreditsToAll());
    }

    // Ajouter des crédits à un utilisateur
    async addCredits() {
        const userId = document.getElementById('credits-user-select').value;
        const amount = parseInt(document.getElementById('credits-amount').value);

        if (!userId) {
            adminUI.showToast('Veuillez sélectionner un utilisateur', 'error');
            return;
        }

        if (!amount || amount <= 0) {
            adminUI.showToast('Veuillez entrer un nombre valide', 'error');
            return;
        }

        try {
            const response = await authService.fetchAPI(`/users/${userId}/credits`, {
                method: 'POST',
                body: JSON.stringify({ amount })
            });

            if (response.ok) {
                const user = this.users.find(u => u.id === parseInt(userId));
                adminUI.showToast(`${amount} crédit(s) ajouté(s) à ${user.username}`, 'success');

                // Recharger les utilisateurs
                await adminUsers.loadUsers();
                await this.loadUsers();

                // Réinitialiser le formulaire
                document.getElementById('credits-amount').value = '1';
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to add credits:', error);
            adminUI.showToast('Erreur lors de l\'ajout de crédits', 'error');
        }
    }

    // Retirer des crédits à un utilisateur
    async removeCredits() {
        const userId = document.getElementById('credits-user-select').value;
        const amount = parseInt(document.getElementById('credits-amount').value);

        if (!userId) {
            adminUI.showToast('Veuillez sélectionner un utilisateur', 'error');
            return;
        }

        if (!amount || amount <= 0) {
            adminUI.showToast('Veuillez entrer un nombre valide', 'error');
            return;
        }

        const user = this.users.find(u => u.id === parseInt(userId));
        if (!await adminUI.confirm(`Voulez-vous vraiment retirer ${amount} crédit(s) à ${user.username} ?`)) {
            return;
        }

        try {
            const response = await authService.fetchAPI(`/users/${userId}/credits`, {
                method: 'POST',
                body: JSON.stringify({ amount: -amount })
            });

            if (response.ok) {
                adminUI.showToast(`${amount} crédit(s) retiré(s) de ${user.username}`, 'success');

                // Recharger les utilisateurs
                await adminUsers.loadUsers();
                await this.loadUsers();

                // Réinitialiser le formulaire
                document.getElementById('credits-amount').value = '1';
            } else {
                const error = await response.json();
                adminUI.showToast(error.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Failed to remove credits:', error);
            adminUI.showToast('Erreur lors du retrait de crédits', 'error');
        }
    }

    // Ajouter des crédits à tous les utilisateurs
    async addCreditsToAll() {
        const amount = parseInt(document.getElementById('credits-bulk-amount').value);

        if (!amount || amount <= 0) {
            adminUI.showToast('Veuillez entrer un nombre valide', 'error');
            return;
        }

        if (!await adminUI.confirm(`Voulez-vous vraiment ajouter ${amount} crédit(s) à TOUS les utilisateurs (${this.users.length} utilisateurs) ?`)) {
            return;
        }

        try {
            // Ajouter les crédits à tous les utilisateurs en parallèle
            const promises = this.users.map(user =>
                authService.fetchAPI(`/users/${user.id}/credits`, {
                    method: 'POST',
                    body: JSON.stringify({ amount })
                })
            );

            await Promise.all(promises);

            adminUI.showToast(`${amount} crédit(s) ajouté(s) à ${this.users.length} utilisateurs`, 'success');

            // Recharger les utilisateurs
            await adminUsers.loadUsers();
            await this.loadUsers();

            // Réinitialiser le formulaire
            document.getElementById('credits-bulk-amount').value = '1';
        } catch (error) {
            console.error('Failed to add credits to all:', error);
            adminUI.showToast('Erreur lors de l\'ajout de crédits en masse', 'error');
        }
    }
}

// Instance globale
const adminCredits = new AdminCredits();
