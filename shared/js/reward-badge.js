/**
 * Composant Badge de Récompense
 * Affiche de manière visible et attractive les crédits à gagner
 */

class RewardBadge {
    /**
     * Créer un badge de récompense
     * @param {Object} options - Options du badge
     * @param {number} options.baseCredits - Crédits de base
     * @param {string} [options.bonusText] - Texte du bonus (ex: "+ bonus temps")
     * @param {string} [options.size] - Taille du badge ("normal" ou "small")
     * @returns {HTMLElement} - Élément HTML du badge
     */
    static create(options = {}) {
        const {
            baseCredits,
            bonusText = '',
            size = 'normal'
        } = options;

        const badge = document.createElement('div');
        badge.className = `reward-badge${size === 'small' ? ' reward-badge--small' : ''}`;

        badge.innerHTML = `
            <span class="reward-badge__icon">💰</span>
            <span class="reward-badge__amount">${baseCredits}</span>
            <span class="reward-badge__label">crédit${baseCredits > 1 ? 's' : ''}${bonusText ? ' ' + bonusText : ''}</span>
        `;

        return badge;
    }

    /**
     * Insérer un badge dans le DOM
     * @param {string} selector - Sélecteur CSS de l'élément cible
     * @param {Object} options - Options du badge
     */
    static render(selector, options) {
        const container = document.querySelector(selector);
        if (!container) {
            console.warn(`RewardBadge: selector "${selector}" not found`);
            return;
        }

        const badge = this.create(options);
        container.appendChild(badge);
    }

    /**
     * Insérer un badge centré dans le DOM
     * @param {string} selector - Sélecteur CSS de l'élément cible
     * @param {Object} options - Options du badge
     */
    static renderCentered(selector, options) {
        const container = document.querySelector(selector);
        if (!container) {
            console.warn(`RewardBadge: selector "${selector}" not found`);
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'reward-badge-container';

        const badge = this.create(options);
        wrapper.appendChild(badge);

        container.appendChild(wrapper);
    }
}

// Export pour utilisation globale
if (typeof window !== 'undefined') {
    window.RewardBadge = RewardBadge;
}
