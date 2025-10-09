// Composant partagé pour afficher la progression de collection d'un thème
// Utilisé dans Collection et dans Admin User Profile

const ThemeCompletion = {
    /**
     * Génère le HTML de la barre de progression colorée par rareté
     * @param {Object} rarityStats - Stats par rareté { common: {total, owned}, rare: {total, owned}, ... }
     * @param {boolean} showPercentage - Afficher le pourcentage total (par défaut true)
     * @returns {string} HTML de la barre de progression
     */
    render(rarityStats, showPercentage = true) {
        if (!rarityStats) return '';

        // Configuration des raretés (doit correspondre à CONFIG.RARITIES dans cards)
        const rarityConfig = {
            common: { name: 'Commune', color: '#9ca3af' },
            rare: { name: 'Rare', color: '#3b82f6' },
            very_rare: { name: 'Très rare', color: '#10b981' },
            epic: { name: 'Épique', color: '#f59e0b' },
            legendary: { name: 'Légendaire', color: '#ef4444' }
        };

        // Calculer le total de cartes et cartes possédées
        let totalCards = 0;
        let ownedCards = 0;

        Object.values(rarityStats).forEach(stats => {
            totalCards += stats.total;
            ownedCards += stats.owned;
        });

        // Calculer le pourcentage de complétion global
        const completion = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0;

        // Générer les segments HTML
        const rarityOrder = ['common', 'rare', 'very_rare', 'epic', 'legendary'];
        let segments = '';
        let position = 0;

        rarityOrder.forEach(rarity => {
            const stats = rarityStats[rarity];
            if (stats && stats.owned > 0) {
                const percentage = totalCards > 0 ? (stats.owned / totalCards) * 100 : 0;
                const config = rarityConfig[rarity];

                if (percentage > 0) {
                    segments += `
                        <div class="completion-segment rarity-${rarity}"
                             style="
                                left: ${position}%;
                                width: ${percentage}%;
                                background-color: ${config.color};
                             "
                             title="${config.name}: ${stats.owned}/${stats.total} (${percentage.toFixed(1)}%)">
                        </div>
                    `;
                    position += percentage;
                }
            }
        });

        // HTML final
        return `
            <div class="theme-completion">
                <div class="completion-bar">
                    ${segments}
                </div>
                ${showPercentage ? `<span class="completion-text">${completion}%</span>` : ''}
            </div>
        `;
    }
};
