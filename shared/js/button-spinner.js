/**
 * Système de gestion des spinners pour les boutons
 * Désactive le bouton et affiche un spinner pendant les opérations asynchrones
 */

class ButtonSpinner {
    /**
     * Active le spinner sur un bouton
     * @param {HTMLButtonElement} button - Le bouton à modifier
     * @param {string} loadingText - Texte à afficher pendant le chargement (optionnel)
     * @returns {Object} - Objet avec la méthode stop() pour arrêter le spinner
     */
    static start(button, loadingText = null) {
        if (!button) {
            console.warn('ButtonSpinner: button is null or undefined');
            return { stop: () => {} };
        }

        // Sauvegarder l'état original
        const originalContent = button.innerHTML;
        const wasDisabled = button.disabled;
        const originalWidth = button.offsetWidth;

        // Fixer la largeur pour éviter la déformation
        button.style.minWidth = `${originalWidth}px`;

        // Désactiver le bouton
        button.disabled = true;

        // Ajouter le spinner
        const spinnerHTML = `
            <span class="spinner"></span>
            ${loadingText || button.textContent}
        `;
        button.innerHTML = spinnerHTML;
        button.classList.add('loading');

        // Retourner une fonction pour arrêter le spinner
        return {
            stop: () => {
                button.innerHTML = originalContent;
                button.disabled = wasDisabled;
                button.classList.remove('loading');
                button.style.minWidth = '';
            }
        };
    }

    /**
     * Wrapper pour exécuter une fonction asynchrone avec spinner
     * @param {HTMLButtonElement} button - Le bouton
     * @param {Function} asyncFn - Fonction async à exécuter
     * @param {string} loadingText - Texte pendant le chargement (optionnel)
     */
    static async wrap(button, asyncFn, loadingText = null) {
        const spinner = this.start(button, loadingText);
        try {
            return await asyncFn();
        } finally {
            spinner.stop();
        }
    }
}

// Exporter pour utilisation globale
window.ButtonSpinner = ButtonSpinner;
