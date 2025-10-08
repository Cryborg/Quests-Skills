// Composant de header de page partagé
class PageHeader {
    /**
     * Crée et injecte un header de page standardisé
     * @param {Object} config - Configuration du header
     * @param {string} config.icon - Emoji du module
     * @param {string} config.title - Titre de la page
     * @param {string} [config.subtitle] - Sous-titre optionnel
     * @param {Array} [config.actions] - Boutons d'action [{icon, text, id, className}]
     * @param {Array} [config.stats] - Stats à afficher [{label, id, value}]
     */
    static render(config) {
        const { icon, title, subtitle, actions = [], stats = [] } = config;

        // Créer le HTML du header
        let headerHTML = `
            <header class="page-header">
                <div class="page-header-top">
                    <h1 class="page-header-title"><span class="page-header-icon">${icon}</span> ${title}</h1>
        `;

        // Ajouter les boutons d'action si présents
        if (actions.length > 0) {
            headerHTML += '<div class="page-header-actions">';
            actions.forEach(action => {
                headerHTML += `
                    <button id="${action.id}" class="page-header-btn ${action.className || ''}" title="${action.text}">
                        ${action.icon} ${action.text}
                    </button>
                `;
            });
            headerHTML += '</div>';
        }

        headerHTML += '</div>'; // Ferme page-header-top

        // Ajouter le sous-titre si présent
        if (subtitle) {
            headerHTML += `<p class="page-header-subtitle">${subtitle}</p>`;
        }

        // Ajouter les stats si présentes
        if (stats.length > 0) {
            headerHTML += '<div class="page-header-stats">';
            stats.forEach(stat => {
                headerHTML += `
                    <div class="page-header-stat">
                        <span class="stat-label">${stat.label}:</span>
                        <span class="stat-value" id="${stat.id}">${stat.value || '0'}</span>
                    </div>
                `;
            });
            headerHTML += '</div>';
        }

        headerHTML += '</header>';

        // Injecter dans le container
        const container = document.querySelector('.container');
        if (container) {
            container.insertAdjacentHTML('afterbegin', headerHTML);
        } else {
            console.error('PageHeader: No .container element found');
        }

        return headerHTML;
    }

    /**
     * Met à jour la valeur d'une stat
     * @param {string} statId - ID de la stat
     * @param {string|number} value - Nouvelle valeur
     */
    static updateStat(statId, value) {
        const statElement = document.getElementById(statId);
        if (statElement) {
            statElement.textContent = value;
        }
    }
}

// Export global
window.PageHeader = PageHeader;
