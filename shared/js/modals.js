// Système de modales mutualisées pour toute l'application

class ModalSystem {
    constructor() {
        this.modals = new Map();
        this.setupGlobalListeners();
    }

    // Configurer les écouteurs globaux
    setupGlobalListeners() {
        // Fermer les modales avec Echap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });

        // Fermer en cliquant sur l'overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('shared-modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    // Créer le HTML d'une modale si elle n'existe pas encore
    ensureModalExists(modalId) {
        if (!document.getElementById(modalId)) {
            const modalHTML = `
                <div id="${modalId}" class="shared-modal">
                    <div class="shared-modal-content">
                        <span class="shared-modal-close" data-modal-id="${modalId}">&times;</span>
                        <div class="shared-modal-body"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Ajouter l'écouteur de fermeture
            const closeBtn = document.querySelector(`[data-modal-id="${modalId}"]`);
            closeBtn.addEventListener('click', () => this.closeModal(modalId));
        }
    }

    // Afficher une modale d'alerte
    alert(message, title = 'Information') {
        const modalId = 'shared-alert-modal';
        this.ensureModalExists(modalId);

        const modalBody = document.querySelector(`#${modalId} .shared-modal-body`);
        modalBody.innerHTML = `
            <h2 class="shared-modal-title">${title}</h2>
            <p class="shared-modal-message">${message}</p>
            <div class="shared-modal-actions">
                <button class="shared-btn-primary" id="shared-alert-ok">OK</button>
            </div>
        `;

        this.showModal(modalId);

        // Retourner une promesse qui se résout quand on clique OK
        return new Promise((resolve) => {
            const okBtn = document.getElementById('shared-alert-ok');
            const handleOk = () => {
                this.closeModal(modalId);
                resolve();
            };
            okBtn.addEventListener('click', handleOk, { once: true });
        });
    }

    // Afficher une modale de confirmation
    confirm(message, title = 'Confirmation') {
        const modalId = 'shared-confirm-modal';
        this.ensureModalExists(modalId);

        const modalBody = document.querySelector(`#${modalId} .shared-modal-body`);
        modalBody.innerHTML = `
            <h2 class="shared-modal-title">${title}</h2>
            <p class="shared-modal-message">${message}</p>
            <div class="shared-modal-actions">
                <button class="shared-btn-danger" id="shared-confirm-yes">Confirmer</button>
                <button class="shared-btn-secondary" id="shared-confirm-no">Annuler</button>
            </div>
        `;

        this.showModal(modalId);

        // Retourner une promesse qui se résout avec true/false
        return new Promise((resolve) => {
            const yesBtn = document.getElementById('shared-confirm-yes');
            const noBtn = document.getElementById('shared-confirm-no');

            const handleYes = () => {
                this.closeModal(modalId);
                resolve(true);
            };

            const handleNo = () => {
                this.closeModal(modalId);
                resolve(false);
            };

            yesBtn.addEventListener('click', handleYes, { once: true });
            noBtn.addEventListener('click', handleNo, { once: true });
        });
    }

    // Afficher une modale
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            this.modals.set(modalId, true);
        }
    }

    // Fermer une modale
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            this.modals.delete(modalId);
        }
    }

    // Fermer la modale la plus récente
    closeTopModal() {
        const openModals = document.querySelectorAll('.shared-modal.show');
        if (openModals.length > 0) {
            const topModal = openModals[openModals.length - 1];
            this.closeModal(topModal.id);
        }
    }
}

// Instance globale
const modalSystem = new ModalSystem();

// Remplacer window.alert et window.confirm
window.alert = (message) => modalSystem.alert(message);
window.confirm = (message) => modalSystem.confirm(message);
