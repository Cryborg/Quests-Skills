// Utilitaire pour afficher les progress bars de rareté
const RarityProgress = {
    /**
     * Génère le HTML pour une progress bar de rareté
     * @param {Object} rarityStats - Stats par rareté { common: {total, owned}, rare: {total, owned}, ... }
     * @returns {string} HTML de la progress bar
     */
    render(rarityStats) {
        const rarities = ['common', 'rare', 'epic', 'legendary'];
        const colors = {
            common: { from: '#808080', to: '#a0a0a0' },
            rare: { from: '#4a9eff', to: '#357abd' },
            epic: { from: '#9b59b6', to: '#8e44ad' },
            legendary: { from: '#f39c12', to: '#e67e22' }
        };

        const labels = {
            common: 'Communes',
            rare: 'Rares',
            epic: 'Épiques',
            legendary: 'Légendaires'
        };

        let html = '<div class="rarity-progress-container">';

        for (const rarity of rarities) {
            const stats = rarityStats[rarity] || { total: 0, owned: 0 };
            const percentage = stats.total > 0 ? (stats.owned / stats.total * 100) : 0;
            const color = colors[rarity];

            html += `
                <div class="rarity-progress-item">
                    <div class="rarity-progress-label">
                        <span class="rarity-name">${labels[rarity]}</span>
                        <span class="rarity-count">${stats.owned}/${stats.total}</span>
                    </div>
                    <div class="rarity-progress-bar">
                        <div class="rarity-progress-fill" style="
                            width: ${percentage}%;
                            background: linear-gradient(90deg, ${color.from}, ${color.to});
                        "></div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }
};
