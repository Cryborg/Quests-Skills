// Gestion de l'interface admin commune

class AdminUI {
    constructor() {
        this.currentTab = 'users';
    }

    // Initialiser l'interface
    init() {
        this.attachTabEvents();
        this.setupModalEscapeKey();
    }

    // Configurer la fermeture des modales avec Echap
    setupModalEscapeKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Fermer toutes les modales ouvertes
                document.querySelectorAll('.modal.show').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });

        // Fermer en cliquant sur l'overlay
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // Attacher les événements pour les onglets
    attachTabEvents() {
        const tabButtons = document.querySelectorAll('.admin-tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    // Changer d'onglet
    switchTab(tab) {
        this.currentTab = tab;

        // Mettre à jour les boutons
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Mettre à jour les sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.toggle('active', section.id === `${tab}-section`);
        });
    }

    // Afficher un toast
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Afficher une modale
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }

    // Fermer une modale
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // Confirmer une action (async pour utiliser le système de modales)
    async confirm(message) {
        return await window.confirm(message);
    }

    // Formater la date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Icône de rareté
    getRarityIcon(rarity) {
        const icons = {
            common: '🤍',
            rare: '💙',
            very_rare: '💚',
            epic: '💛',
            legendary: '❤️'
        };
        return icons[rarity] || '❓';
    }

    // Label de rareté
    getRarityLabel(rarity) {
        const labels = {
            common: 'Commune',
            rare: 'Rare',
            very_rare: 'Très Rare',
            epic: 'Épique',
            legendary: 'Légendaire'
        };
        return labels[rarity] || rarity;
    }

    // Icône de thème
    getThemeIcon(theme) {
        const icons = {
            minecraft: '🟫',
            space: '🌌',
            dinosaurs: '🦕'
        };
        return icons[theme] || '❓';
    }

    // Label de thème
    getThemeLabel(theme) {
        const labels = {
            minecraft: 'Minecraft',
            space: 'Astronomie',
            dinosaurs: 'Dinosaures'
        };
        return labels[theme] || theme;
    }
}

// Instance globale
const adminUI = new AdminUI();
