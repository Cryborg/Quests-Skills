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
     * @param {Object} [config.reward] - Badge de récompense {baseCredits, bonusText, size}
     */
    static render(config) {
        const { icon, title, subtitle, actions = [], stats = [], reward = null } = config;

        // Créer le HTML du header
        let headerHTML = `
            <header class="page-header">
                <div class="page-header-top">
                    <div class="page-header-left">
                        <h1 class="page-header-title"><span class="page-header-icon">${icon}</span> ${title}</h1>
        `;

        // Ajouter le sous-titre dans la partie gauche si présent
        if (subtitle) {
            headerHTML += `<p class="page-header-subtitle">${subtitle}</p>`;
        }

        headerHTML += '</div>'; // Ferme page-header-left

        // Partie droite : actions puis badge de récompense
        headerHTML += '<div class="page-header-right">';

        // Ajouter les boutons d'action si présents (EN PREMIER)
        if (actions.length > 0) {
            headerHTML += '<div class="page-header-actions">';
            actions.forEach(action => {
                // Pour les boutons Aide et Noter, afficher uniquement l'icône
                const isIconOnly = action.id?.includes('help-btn') || action.id?.includes('rate-game-btn');
                const buttonContent = isIconOnly ? action.icon : `${action.icon} ${action.text}`;

                headerHTML += `
                    <button id="${action.id}" class="page-header-btn ${action.className || ''}" title="${action.text}">
                        ${buttonContent}
                    </button>
                `;
            });
            headerHTML += '</div>';
        }

        // Ajouter le badge de récompense si présent (EN SECOND, donc en dessous)
        if (reward) {
            headerHTML += '<div class="page-header-reward" id="page-header-reward"></div>';
        }

        headerHTML += '</div>'; // Ferme page-header-right
        headerHTML += '</div>'; // Ferme page-header-top

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
            // Supprimer l'ancien header s'il existe
            const existingHeader = container.querySelector('.page-header');
            if (existingHeader) {
                existingHeader.remove();
            }

            container.insertAdjacentHTML('afterbegin', headerHTML);

            // Injecter le badge de récompense si présent (nécessite RewardBadge)
            if (reward && typeof RewardBadge !== 'undefined') {
                setTimeout(() => {
                    RewardBadge.renderCentered('#page-header-reward', reward);
                }, 0);
            }
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

    /**
     * Met à jour le badge de récompense
     * @param {Object} reward - Nouvelle config du badge {baseCredits, bonusText, size}
     */
    static updateReward(reward) {
        const container = document.getElementById('page-header-reward');
        if (container && typeof RewardBadge !== 'undefined') {
            container.innerHTML = '';
            RewardBadge.renderCentered('#page-header-reward', reward);
        }
    }
}

// Export global
window.PageHeader = PageHeader;
