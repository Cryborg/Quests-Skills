// Gestion des statistiques de notations dans l'admin

class AdminRatings {
    constructor() {
        this.stats = [];
        this.gameNames = {
            'word-search': '🔍 Mots Mêlés',
            'sudoku': '🔢 Sudoku',
            'crossword': '📝 Mots Croisés',
            'cipher': '🔐 Chiffrement',
            'clock-reading': '🕐 Lecture d\'heure',
            'grid-navigation': '🗺️ Navigation',
            'number-sequence': '🔢 Suites numériques'
        };
    }

    // Initialiser la gestion des notations
    async init() {
        await this.loadStats();
    }

    // Charger les statistiques
    async loadStats() {
        const container = document.getElementById('ratings-stats-container');

        try {
            const response = await authService.fetchAPI('/ratings/stats/all/games');
            this.stats = await response.json();

            if (this.stats.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #999;">Aucune notation pour le moment</p>';
                return;
            }

            this.renderStats();
        } catch (error) {
            console.error('Failed to load rating stats:', error);
            container.innerHTML = '<p style="text-align: center; color: #f44336;">Erreur lors du chargement des statistiques</p>';
        }
    }

    // Afficher les statistiques
    renderStats() {
        const container = document.getElementById('ratings-stats-container');

        container.innerHTML = this.stats.map(gameStat => {
            const gameName = this.gameNames[gameStat.game_type] || gameStat.game_type;

            return `
                <div class="rating-game-card">
                    <div class="rating-game-header">
                        <h3>${gameName}</h3>
                        <span class="rating-count">${gameStat.totalRatings} notation(s)</span>
                    </div>

                    <div class="rating-global-stats">
                        <div class="rating-stat-box">
                            <div class="rating-stat-label">💡 Intérêt moyen</div>
                            <div class="rating-stat-value">${this.renderStars(gameStat.avgInterest)}</div>
                            <div class="rating-stat-number">${gameStat.avgInterest} / 5</div>
                        </div>
                        <div class="rating-stat-box">
                            <div class="rating-stat-label">🎯 Difficulté moyenne</div>
                            <div class="rating-stat-value">${this.renderStars(gameStat.avgDifficulty)}</div>
                            <div class="rating-stat-number">${gameStat.avgDifficulty} / 5</div>
                        </div>
                    </div>

                    ${gameStat.ageStats && gameStat.ageStats.length > 0 ? `
                        <div class="rating-age-stats">
                            <h4>📊 Par tranche d'âge</h4>
                            <div class="rating-age-grid">
                                ${gameStat.ageStats.map(ageStat => `
                                    <div class="rating-age-card">
                                        <div class="rating-age-label">${this.formatAgeGroup(ageStat.ageGroup)}</div>
                                        <div class="rating-age-count">${ageStat.count} personne(s)</div>
                                        <div class="rating-age-detail">
                                            <span>💡 ${ageStat.avgInterest}</span>
                                            <span>🎯 ${ageStat.avgDifficulty}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : '<p style="text-align: center; color: #999; margin-top: 20px;">Aucune donnée par tranche d\'âge (dates de naissance manquantes)</p>'}
                </div>
            `;
        }).join('');
    }

    // Formater la tranche d'âge
    formatAgeGroup(ageGroup) {
        const labels = {
            '0-7': '👶 0-7 ans',
            '8-10': '🧒 8-10 ans',
            '11-13': '👦 11-13 ans',
            '14-17': '🧑 14-17 ans',
            '18+': '👨 18+ ans'
        };
        return labels[ageGroup] || ageGroup;
    }

    // Générer les étoiles d'affichage
    renderStars(rating) {
        const roundedRating = Math.round(parseFloat(rating) * 2) / 2; // Arrondir au 0.5 près
        let stars = '';

        for (let i = 1; i <= 5; i++) {
            if (i <= roundedRating) {
                stars += '★';
            } else if (i - 0.5 === roundedRating) {
                stars += '⯨';
            } else {
                stars += '☆';
            }
        }

        return `<span class="rating-stars">${stars}</span>`;
    }
}

// Instance globale
const adminRatings = new AdminRatings();
