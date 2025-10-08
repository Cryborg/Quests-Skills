// Composant de navigation partagé pour toute l'application
class NavigationUI {
    constructor() {
        this.isOpen = false;
        this.currentUser = null;
        this.userCredits = 0;

        // Configuration des liens de navigation
        this.navLinks = [
            {
                icon: '🏠',
                label: 'Accueil',
                href: '/modules/cards/index.html',
                id: 'home'
            },
            {
                icon: '🃏',
                label: 'Collection de cartes',
                href: '/modules/cards/index.html',
                id: 'cards'
            },
            {
                icon: '🎓',
                label: 'Exercices de maths',
                href: '/modules/math-exercises/index.html',
                id: 'math'
            }
        ];

        // Lien admin (sera ajouté juste avant la déconnexion)
        this.adminLink = {
            icon: '👑',
            label: 'Administration',
            href: '/modules/admin/index.html',
            id: 'admin'
        };
    }

    // Initialiser la navigation
    async init() {
        // Vérifier que l'utilisateur est authentifié
        this.currentUser = authService.getCurrentUser();

        if (!this.currentUser) {
            console.error('NavigationUI: User not authenticated');
            return;
        }

        // Charger les crédits de l'utilisateur
        await this.loadUserCredits();

        // Charger les tentatives d'exercices de maths
        const mathData = await this.loadMathAttempts();

        // Créer et injecter la navigation
        this.render();

        // Mettre à jour l'affichage des exercices de maths
        this.updateMathAttempts(mathData.remaining, mathData.total);

        // Attacher les événements
        this.attachEvents();

        // Marquer le lien actif selon l'URL courante
        this.setActivePage();

        // Indiquer que la navigation est chargée (évite le flicker)
        document.body.classList.add('nav-loaded');
    }

    // Charger les crédits de l'utilisateur
    async loadUserCredits() {
        try {
            const response = await authService.fetchAPI(`/users/${this.currentUser.id}/credits`);
            const data = await response.json();
            this.userCredits = data.credits || 0;
        } catch (error) {
            console.error('Failed to load user credits:', error);
            this.userCredits = 0;
        }
    }

    // Charger le nombre d'exercices de maths restants depuis l'API
    async loadMathAttempts() {
        try {
            const response = await authService.fetchAPI(`/users/${this.currentUser.id}/attempts`);
            const attempts = await response.json();

            // Compter les tentatives d'aujourd'hui par type d'opération
            const today = new Date().toDateString();
            const todayAttempts = attempts.filter(attempt => {
                const attemptDate = new Date(attempt.created_at).toDateString();
                return attemptDate === today;
            });

            // Compter par type d'opération
            const MAX_PER_TYPE = 3;
            const countByType = {
                addition: 0,
                subtraction: 0,
                multiplication: 0
            };

            todayAttempts.forEach(attempt => {
                try {
                    const exercise = JSON.parse(attempt.exercise);
                    if (exercise.operation && countByType.hasOwnProperty(exercise.operation)) {
                        countByType[exercise.operation]++;
                    }
                } catch (e) {
                    // Ignorer les erreurs de parsing
                }
            });

            // Calculer le total restant
            let totalRemaining = 0;
            Object.values(countByType).forEach(used => {
                totalRemaining += Math.max(0, MAX_PER_TYPE - used);
            });

            return { remaining: totalRemaining, total: MAX_PER_TYPE * 3 };
        } catch (error) {
            console.error('Failed to load math attempts:', error);
            return { remaining: 9, total: 9 }; // Par défaut, tout est disponible
        }
    }

    // Générer le HTML de la navigation
    render() {
        const navigationHTML = `
            <!-- Header mobile avec hamburger -->
            <header class="app-header">
                <div class="app-header-title">🎮 Quests & Skills</div>
                <button class="hamburger-btn" id="hamburger-btn">☰</button>
            </header>

            <!-- Overlay pour fermer le menu sur mobile -->
            <div class="nav-overlay" id="nav-overlay"></div>

            <!-- Sidebar navigation -->
            <nav class="app-sidebar" id="app-sidebar">
                <!-- User info -->
                <div class="nav-user-info">
                    <div class="nav-username">
                        ${this.currentUser.username}
                        ${this.currentUser.is_admin ? '<span class="nav-admin-badge">ADMIN</span>' : ''}
                    </div>
                    <div class="nav-user-stats">
                        <div class="nav-stat">
                            <span>Cartes à piocher:</span>
                            <span class="nav-stat-value" id="nav-credits">${this.userCredits}</span>
                        </div>
                        <div class="nav-stat">
                            <span>Exercices restants:</span>
                            <span class="nav-stat-value" id="nav-math-attempts">0/9</span>
                        </div>
                    </div>
                </div>

                <!-- Navigation links -->
                <div class="nav-menu">
                    ${this.navLinks.map(link => `
                        <a href="${link.href}" class="nav-link" data-nav-id="${link.id}">
                            <span class="nav-link-icon">${link.icon}</span>
                            <span>${link.label}</span>
                        </a>
                    `).join('')}
                </div>

                <!-- Admin button (before logout) -->
                ${this.currentUser.is_admin ? `
                    <a href="${this.adminLink.href}" class="nav-link nav-admin-link" data-nav-id="${this.adminLink.id}">
                        <span class="nav-link-icon">${this.adminLink.icon}</span>
                        <span>${this.adminLink.label}</span>
                    </a>
                ` : ''}

                <!-- Logout button -->
                <button class="nav-logout" id="nav-logout-btn">
                    <span class="nav-link-icon">🚪</span>
                    <span>Déconnexion</span>
                </button>
            </nav>
        `;

        // Injecter dans le body
        document.body.insertAdjacentHTML('afterbegin', navigationHTML);

        // Wrapper le contenu existant
        const existingContent = document.body.children;
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'app-content';

        // Déplacer tout le contenu existant (sauf la nav) dans le wrapper
        Array.from(existingContent).forEach(child => {
            if (!child.classList.contains('app-header') &&
                !child.classList.contains('nav-overlay') &&
                !child.classList.contains('app-sidebar')) {
                contentWrapper.appendChild(child);
            }
        });

        document.body.appendChild(contentWrapper);
    }

    // Attacher les événements
    attachEvents() {
        // Hamburger toggle
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Overlay pour fermer
        const overlay = document.getElementById('nav-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeMobileMenu());
        }

        // Bouton de déconnexion
        const logoutBtn = document.getElementById('nav-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Fermer le menu mobile lors du clic sur un lien
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMobileMenu();
                }
            });
        });

        // Écouter les changements de taille d'écran
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });
    }

    // Toggle du menu mobile
    toggleMobileMenu() {
        this.isOpen = !this.isOpen;
        const sidebar = document.getElementById('app-sidebar');
        const overlay = document.getElementById('nav-overlay');

        if (this.isOpen) {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('visible');
        } else {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('visible');
        }
    }

    // Fermer le menu mobile
    closeMobileMenu() {
        this.isOpen = false;
        const sidebar = document.getElementById('app-sidebar');
        const overlay = document.getElementById('nav-overlay');

        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('visible');
    }

    // Marquer le lien actif selon la page courante
    setActivePage() {
        const currentPath = window.location.pathname;

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');

            const linkPath = new URL(link.href).pathname;
            if (currentPath === linkPath) {
                link.classList.add('active');
            }
        });
    }

    // Gérer la déconnexion
    async handleLogout() {
        const confirmed = await window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
        if (confirmed) {
            authService.logout();
        }
    }

    // Mettre à jour l'affichage des crédits (appelé depuis l'extérieur)
    updateCredits(newCredits) {
        this.userCredits = newCredits;
        const creditsEl = document.getElementById('nav-credits');
        if (creditsEl) {
            creditsEl.textContent = newCredits;
        }
    }

    // Mettre à jour le compteur d'exercices de maths (appelé depuis l'extérieur)
    updateMathAttempts(remaining, total = 9) {
        const attemptsEl = document.getElementById('nav-math-attempts');
        if (attemptsEl) {
            attemptsEl.textContent = `${remaining}/${total}`;
        }
    }

    // Rafraîchir les données utilisateur
    async refresh() {
        await this.loadUserCredits();
        const creditsEl = document.getElementById('nav-credits');
        if (creditsEl) {
            creditsEl.textContent = this.userCredits;
        }

        // Rafraîchir aussi les exercices de maths
        const mathData = await this.loadMathAttempts();
        this.updateMathAttempts(mathData.remaining, mathData.total);
    }
}

// Instance globale de la navigation
const navigationUI = new NavigationUI();

// Note: L'initialisation doit être faite manuellement après l'authentification
// Exemple: await navigationUI.init();
