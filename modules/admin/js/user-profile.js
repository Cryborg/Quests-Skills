// Gestion du profil utilisateur

class UserProfile {
    constructor() {
        this.userId = null;
        this.profileData = null;
    }

    async init(userId) {
        this.userId = userId;
        await this.loadProfile();
    }

    async loadProfile() {
        try {
            const response = await authService.fetchAPI(`/users/${this.userId}/profile`);

            if (!response.ok) {
                throw new Error('Impossible de charger le profil');
            }

            this.profileData = await response.json();

            // Créer le header avec le nom d'utilisateur
            PageHeader.render({
                icon: '👤',
                title: `Profil de ${this.profileData.user.username}`,
                subtitle: 'Statistiques et historique d\'activité',
                actions: [
                    { icon: '🔙', text: 'Retour à l\'admin', id: 'back-to-admin-btn' }
                ]
            });

            // Attacher l'événement au bouton retour
            document.getElementById('back-to-admin-btn')?.addEventListener('click', () => {
                window.location.href = 'index.html';
            });

            this.render();
        } catch (error) {
            console.error('Failed to load profile:', error);
            Toast.error('Erreur lors du chargement du profil');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }

    render() {
        this.renderBasicInfo();
        this.renderStats();
        this.renderThemes();
        this.renderGameSessions();
        this.renderActivityLogs();
    }

    renderBasicInfo() {
        const container = document.getElementById('profile-basic-info');
        const user = this.profileData.user;

        const createdDate = new Date(user.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const updatedDate = new Date(user.updated_at).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        container.innerHTML = `
            <tr>
                <td>🆔 ID</td>
                <td>${user.id}</td>
                <td>💰 Crédits</td>
                <td>${user.credits}</td>
            </tr>
            <tr>
                <td>👤 Nom d'utilisateur</td>
                <td>${user.username}</td>
                <td>🔐 Statut</td>
                <td>${user.is_admin ? '<span class="user-badge admin">ADMIN</span>' : '<span class="user-badge user">UTILISATEUR</span>'}</td>
            </tr>
            <tr>
                <td>📧 Email</td>
                <td colspan="3">${user.email}</td>
            </tr>
            <tr>
                <td>📅 Inscription</td>
                <td colspan="3">${createdDate}</td>
            </tr>
            <tr>
                <td>🔄 Dernière modification</td>
                <td colspan="3">${updatedDate}</td>
            </tr>
        `;
    }

    renderStats() {
        const container = document.getElementById('profile-stats');
        const stats = this.profileData.stats;

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">🃏</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.totalCards}</div>
                    <div class="stat-label">Cartes collectées</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🎮</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.totalGames}</div>
                    <div class="stat-label">Parties jouées</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🔑</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.totalLogins}</div>
                    <div class="stat-label">Connexions</div>
                </div>
            </div>
        `;
    }

    renderThemes() {
        const container = document.getElementById('profile-themes');
        const themes = this.profileData.themes;

        if (themes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">Aucun thème sélectionné</p>';
            return;
        }

        container.innerHTML = themes.map(theme => `
            <div class="theme-card">
                <div class="theme-icon">${theme.icon}</div>
                <div class="theme-name">${theme.name}</div>
            </div>
        `).join('');
    }

    renderGameSessions() {
        const container = document.getElementById('profile-game-sessions');
        const sessions = this.profileData.gameSessions;

        if (sessions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">Aucune session de jeu</p>';
            return;
        }

        container.innerHTML = sessions.map(session => {
            const date = new Date(session.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const gameTypeLabel = this.getGameTypeLabel(session.game_type);
            const successRate = session.success + session.errors > 0
                ? Math.round((session.success / (session.success + session.errors)) * 100)
                : 0;

            return `
                <div class="session-card">
                    <div class="session-header">
                        <span class="session-type">${gameTypeLabel}</span>
                        <span class="session-date">${date}</span>
                    </div>
                    <div class="session-stats">
                        <div class="session-stat">
                            <span class="session-stat-label">✅ Réussites</span>
                            <span class="session-stat-value">${session.success}</span>
                        </div>
                        <div class="session-stat">
                            <span class="session-stat-label">❌ Erreurs</span>
                            <span class="session-stat-value">${session.errors}</span>
                        </div>
                        <div class="session-stat">
                            <span class="session-stat-label">📊 Taux de réussite</span>
                            <span class="session-stat-value">${successRate}%</span>
                        </div>
                        <div class="session-stat">
                            <span class="session-stat-label">🃏 Cartes gagnées</span>
                            <span class="session-stat-value">${session.cards_earned}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderActivityLogs() {
        const container = document.getElementById('profile-activity-logs');
        const logs = this.profileData.activityLogs;

        if (logs.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">Aucune activité enregistrée</p>';
            return;
        }

        container.innerHTML = logs.map(log => {
            const date = new Date(log.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const actionInfo = this.getActivityActionInfo(log.action_type, log.details);

            return `
                <div class="activity-card">
                    <div class="activity-icon">${actionInfo.icon}</div>
                    <div class="activity-content">
                        <div class="activity-action">${actionInfo.label}</div>
                        ${actionInfo.details ? `<div class="activity-details">${actionInfo.details}</div>` : ''}
                    </div>
                    <div class="activity-date">${date}</div>
                </div>
            `;
        }).join('');
    }

    getGameTypeLabel(gameType) {
        const labels = {
            'word-search': '🔤 Mots mêlés',
            'sudoku': '🔢 Sudoku',
            'grid-navigation': '🗺️ Navigation sur grille',
            'cipher': '🔐 Chiffrement',
            'clock-reading': '🕐 Lecture d\'heure',
            'number-sequence': '🔢 Suites logiques'
        };
        return labels[gameType] || `🎮 ${gameType}`;
    }

    getActivityActionInfo(actionType, details) {
        let parsedDetails = null;
        if (details) {
            try {
                parsedDetails = JSON.parse(details);
            } catch (e) {
                // Ignorer si pas du JSON
            }
        }

        switch (actionType) {
            case 'login':
                return {
                    icon: '🔑',
                    label: 'Connexion',
                    details: null
                };
            case 'draw_cards':
                return {
                    icon: '🎴',
                    label: 'Tirage de cartes',
                    details: parsedDetails?.count ? `${parsedDetails.count} carte(s)` : null
                };
            case 'game_played':
                return {
                    icon: '🎮',
                    label: 'Partie jouée',
                    details: parsedDetails?.game_type ? this.getGameTypeLabel(parsedDetails.game_type) : null
                };
            case 'credits_earned':
                return {
                    icon: '💰',
                    label: 'Crédits gagnés',
                    details: parsedDetails?.amount ? `+${parsedDetails.amount} crédits` : null
                };
            case 'credits_spent':
                return {
                    icon: '💸',
                    label: 'Crédits dépensés',
                    details: parsedDetails?.amount ? `-${parsedDetails.amount} crédits` : null
                };
            default:
                return {
                    icon: '📋',
                    label: actionType,
                    details: details
                };
        }
    }
}

// Instance globale
const userProfile = new UserProfile();
