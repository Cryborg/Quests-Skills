// Système de notifications toast partagé

const Toast = {
    /**
     * Affiche un message toast
     * @param {string} message - Le message à afficher
     * @param {number} duration - Durée d'affichage en ms (défaut: 3000)
     */
    show(message, duration = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) {
            console.error('Toast element not found. Add <div id="toast" class="toast"></div> to your HTML');
            return;
        }

        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    },

    /**
     * Raccourci pour un message de succès
     */
    success(message) {
        this.show(`✅ ${message}`);
    },

    /**
     * Raccourci pour un message d'erreur
     */
    error(message) {
        this.show(`❌ ${message}`);
    },

    /**
     * Raccourci pour un message d'info
     */
    info(message) {
        this.show(`ℹ️ ${message}`);
    },

    /**
     * Raccourci pour un message d'avertissement
     */
    warning(message) {
        this.show(`⚠️ ${message}`);
    },

    /**
     * Raccourci pour un indice
     */
    hint(message) {
        this.show(`💡 ${message}`, 4000);
    }
};

// Rétrocompatibilité : fonction globale showToast
function showToast(message, duration) {
    Toast.show(message, duration);
}
