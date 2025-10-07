// Gestionnaire d'interface utilisateur
class UIManager {
    constructor() {
        this.elements = {};
        this.currentModal = null;
        this.updateInterval = null;
    }

    // Fonction utilitaire pour générer le HTML d'une image/emoji de carte
    renderCardVisual(card, size = 'medium', className = '') {
        return UTILS.renderCardVisual(card, size, className);
    }

    // Fonction pour générer les infos de rareté
    renderRarityInfo(card) {
        const currentRarityKey = card.currentRarity || 'common';
        const currentRarity = CONFIG.RARITIES[currentRarityKey];

        if (!card.owned) {
            return {
                display: 'Non possédée',
                color: '#808080',
                emoji: '❓'
            };
        }

        return {
            display: `${currentRarity.emoji} ${currentRarity.name}`,
            color: currentRarity.color,
            emoji: currentRarity.emoji
        };
    }

    // Initialise tous les éléments DOM
    init() {
        this.cacheElements();
        this.bindEvents();
        this.startCooldownUpdate();

        // Initialise l'animation de pioche
        DRAW_ANIMATION.init();

        this.render();
    }

    // Met en cache les éléments DOM fréquemment utilisés
    cacheElements() {
        this.elements = {
            uniqueCards: document.getElementById('unique-cards'),
            totalCards: document.getElementById('total-cards'),
            completionPercentage: document.getElementById('completion-percentage'),
            nextCreditCountdown: document.getElementById('next-credit-countdown'),
            drawButton: document.getElementById('draw-card-btn'),
            drawCooldown: document.getElementById('draw-cooldown'),
            collectionGrid: document.getElementById('collection-grid'),
            rarityFilter: document.getElementById('rarity-filter'),
            sortFilter: document.getElementById('sort-filter'),
            searchFilter: document.getElementById('search-filter'),
            modal: document.getElementById('card-modal'),
            modalContent: document.getElementById('modal-card-content'),
            modalActions: document.getElementById('modal-actions'),
            toast: document.getElementById('toast'),
            themeTabs: document.querySelectorAll('.tab-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            settingsModal: document.getElementById('settings-modal'),
            settingsClose: document.getElementById('settings-close'),
            passwordSection: document.getElementById('password-section'),
            passwordInput: document.getElementById('password-input'),
            adminControls: document.getElementById('admin-controls'),
            addCreditsBtn: document.getElementById('add-credits-btn'),
            creditsAmountInput: document.getElementById('credits-amount-input')
        };
    }

    // Lie les événements
    bindEvents() {
        // Bouton de pioche
        this.elements.drawButton.addEventListener('click', () => this.handleDraw());

        // Onglets de thèmes
        this.elements.themeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.switchTheme(theme);
            });
        });

        // Filtres
        this.elements.rarityFilter.addEventListener('change', (e) => {
            CARD_SYSTEM.setFilters({ rarity: e.target.value });
            this.renderCards();
        });

        this.elements.sortFilter.addEventListener('change', (e) => {
            CARD_SYSTEM.setFilters({ sort: e.target.value });
            this.renderCards();
        });

        this.elements.searchFilter.addEventListener('input', (e) => {
            CARD_SYSTEM.setFilters({ search: e.target.value });
            this.renderCards();
        });

        // Modal
        const closeModal = this.elements.modal.querySelector('.close');
        closeModal.addEventListener('click', () => this.closeModal());

        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeModal();
            }
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeModal();
            }
            if ((e.key === ' ' || e.key === 'p' || e.key === 'P') && !this.currentModal) {
                e.preventDefault();
                this.handleDraw();
            }
            // Touche secrète X pour ajouter un crédit bonus
            if ((e.key === 'x' || e.key === 'X') && !this.currentModal) {
                this.addBonusCredit();
            }
        });

        // Paramètres - événements multiples pour compatibilité tactile
        this.elements.settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openSettings();
        });
        this.elements.settingsBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openSettings();
        });

        this.elements.settingsClose.addEventListener('click', () => this.closeSettings());
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettings();
            }
        });

        this.elements.passwordInput.addEventListener('input', (e) => this.checkPassword(e.target.value));
        this.elements.addCreditsBtn.addEventListener('click', () => this.validateAdminCredits());
    }

    // Met à jour l'affichage complet
    render() {
        this.updateStats();
        this.updateThemeTabs();
        this.renderCards();
        this.updateDrawButton();
    }

    // Met à jour les statistiques en haut
    updateStats() {
        const stats = DB.getCollectionStats();
        this.elements.uniqueCards.textContent = stats.ownedCards;
        this.elements.totalCards.textContent = stats.totalCards;
        this.elements.completionPercentage.textContent = `${stats.completionPercentage}%`;

        // Compte à rebours pour le prochain crédit gratuit
        this.updateCreditCountdown();
    }

    // Met à jour le compte à rebours du crédit gratuit
    updateCreditCountdown() {
        const canClaimDaily = DB.canClaimDailyCredit();
        const dailyTimeLeft = DB.getDailyCreditTimeLeft();

        if (canClaimDaily) {
            this.elements.nextCreditCountdown.textContent = "Disponible !";
            this.elements.nextCreditCountdown.style.color = "#10b981";
        } else {
            const formattedTime = this.formatCountdown(dailyTimeLeft);
            this.elements.nextCreditCountdown.textContent = formattedTime;
            this.elements.nextCreditCountdown.style.color = "#b0b0b0";
        }
    }

    // Formate le temps en format HH:MM:SS
    formatCountdown(milliseconds) {
        const totalSeconds = Math.ceil(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Met à jour les onglets de thèmes avec indicateurs de progression
    updateThemeTabs() {
        this.elements.themeTabs.forEach(tab => {
            const theme = tab.dataset.theme;
            const themeCards = DB.getCardsByTheme(theme);
            const ownedThemeCards = themeCards.filter(card => DB.hasCard(card.id));

            const completion = themeCards.length > 0 ?
                Math.round((ownedThemeCards.length / themeCards.length) * 100) : 0;

            // Vérifie s'il y a des cartes améliorables dans ce thème
            const themeCardsWithInfo = CARD_SYSTEM.getCardsWithCollectionInfo(theme);
            const upgradeableInTheme = themeCardsWithInfo.filter(card => card.canUpgrade).length;

            // Supprime les anciens indicateurs
            const existingIndicator = tab.querySelector('.theme-completion');
            const existingUpgradeIndicator = tab.querySelector('.theme-upgrade-indicator');
            if (existingIndicator) existingIndicator.remove();
            if (existingUpgradeIndicator) existingUpgradeIndicator.remove();

            // Calcule les statistiques par rareté pour ce thème
            const rarityStats = this.calculateThemeRarityStats(theme);

            // Crée le nouvel indicateur de progression
            const indicator = document.createElement('div');
            indicator.className = 'theme-completion';

            // Détermine la couleur selon le pourcentage
            let indicatorClass = 'low';
            if (completion >= 100) indicatorClass = 'complete';
            else if (completion >= 75) indicatorClass = 'high';
            else if (completion >= 50) indicatorClass = 'medium';
            else if (completion >= 25) indicatorClass = 'low-medium';

            // Génère les segments de rareté
            const raritySegments = this.generateRaritySegments(rarityStats, completion);

            indicator.innerHTML = `
                <div class="completion-bar">
                    ${raritySegments}
                </div>
                <span class="completion-text">${completion}%</span>
            `;

            tab.appendChild(indicator);

            // Ajoute l'indicateur d'amélioration si nécessaire
            if (upgradeableInTheme > 0) {
                const upgradeIndicator = document.createElement('div');
                upgradeIndicator.className = 'theme-upgrade-indicator';
                upgradeIndicator.innerHTML = `🔺`;
                upgradeIndicator.title = `${upgradeableInTheme} carte(s) peuvent être améliorée(s)`;
                tab.appendChild(upgradeIndicator);
            }

            // Ajoute une classe pour styling différent selon la completion
            tab.classList.remove('complete', 'high', 'medium', 'low');
            tab.classList.add(indicatorClass);
        });
    }

    // Calcule les statistiques de rareté pour un thème
    calculateThemeRarityStats(theme) {
        const themeCards = CARD_SYSTEM.getCardsWithCollectionInfo(theme);
        const totalCards = themeCards.length;

        const rarityStats = {};

        // Initialise les compteurs
        Object.keys(CONFIG.RARITIES).forEach(rarity => {
            rarityStats[rarity] = {
                owned: 0,
                total: 0,
                percentage: 0,
                color: CONFIG.RARITIES[rarity].color
            };
        });

        // Compte les cartes par rareté actuelle
        themeCards.forEach(card => {
            const currentRarity = card.currentRarity || 'common';
            rarityStats[currentRarity].total++;

            if (card.owned) {
                rarityStats[currentRarity].owned++;
            }
        });

        // Calcule les pourcentages
        Object.keys(rarityStats).forEach(rarity => {
            const stats = rarityStats[rarity];
            if (totalCards > 0) {
                stats.percentage = (stats.owned / totalCards) * 100;
            }
        });

        return rarityStats;
    }

    // Génère les segments HTML pour la barre de progression
    generateRaritySegments(rarityStats, totalCompletion) {
        let segments = '';
        let position = 0;

        // Ordre des raretés à afficher
        const rarityOrder = ['common', 'rare', 'very_rare', 'epic', 'legendary'];

        rarityOrder.forEach(rarity => {
            const stats = rarityStats[rarity];
            if (stats.percentage > 0) {
                segments += `
                    <div class="completion-segment rarity-${rarity}"
                         style="
                            left: ${position}%;
                            width: ${stats.percentage}%;
                            background-color: ${stats.color};
                         "
                         title="${CONFIG.RARITIES[rarity].name}: ${stats.owned} cartes (${stats.percentage.toFixed(1)}%)">
                    </div>
                `;
                position += stats.percentage;
            }
        });

        return segments;
    }

    // Affiche les cartes de la collection
    renderCards() {
        const cards = CARD_SYSTEM.getCurrentThemeCards();
        this.elements.collectionGrid.innerHTML = '';

        if (cards.length === 0) {
            this.elements.collectionGrid.innerHTML = `
                <div class="no-cards">
                    <p>Aucune carte trouvée pour ce thème ou ces filtres.</p>
                </div>
            `;
            return;
        }

        cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.elements.collectionGrid.appendChild(cardElement);
        });

        // Active le scroll pour les descriptions trop longues après un court délai
        setTimeout(() => this.checkScrollableDescriptions(), 100);
    }

    // Vérifie quelles descriptions ont besoin de scroll
    checkScrollableDescriptions() {
        const descriptions = document.querySelectorAll('.card-description');

        descriptions.forEach(desc => {
            const inner = desc.querySelector('.card-description-inner');
            if (inner) {
                // Vérifie si le contenu dépasse la hauteur max
                if (inner.scrollHeight > desc.clientHeight + 5) {
                    desc.classList.add('needs-scroll');
                } else {
                    desc.classList.remove('needs-scroll');
                }
            }
        });
    }

    // Crée un élément carte
    createCardElement(card) {
        const cardDiv = document.createElement('div');
        const currentRarityKey = card.currentRarity || 'common';

        cardDiv.className = `card ${card.owned ? 'owned' : 'not-owned'} ${currentRarityKey}`;
        cardDiv.dataset.cardId = card.id;

        const rarityInfo = this.renderRarityInfo(card);
        const countDisplay = card.owned && card.count > 1 ? `<span class="card-count">×${card.count}</span>` : '';
        const upgradeIndicator = card.canUpgrade ? `<div class="card-upgrade-indicator" title="Peut être améliorée : ${card.upgradeInfo.cost} cartes → ${CONFIG.RARITIES[card.upgradeInfo.nextRarity].name}">🔺</div>` : '';

        cardDiv.innerHTML = `
            ${countDisplay}
            ${upgradeIndicator}
            <div class="card-image">
                ${this.renderCardVisual(card, 'medium')}
            </div>
            <div class="card-info">
                <h3 class="card-name">${card.owned ? card.name : '???'}</h3>
            </div>
            <div class="card-rarity-banner ${card.owned ? card.currentRarity : 'mystery'}" data-rarity="${card.owned ? card.currentRarity : 'mystery'}">
                <span class="rarity-text">${rarityInfo.display}</span>
            </div>
        `;

        // Ajoute l'événement de clic
        cardDiv.addEventListener('click', () => this.showCardModal(card));

        return cardDiv;
    }

    // Affiche la modal d'une carte
    showCardModal(card) {
        const currentRarityKey = card.currentRarity || 'common';
        const currentRarity = CONFIG.RARITIES[currentRarityKey];
        const points = CARD_SYSTEM.calculateCardPoints(card, currentRarityKey);

        // Recalcule les informations d'amélioration pour être sûr
        const upgradeInfo = card.owned ? CARD_SYSTEM.canUpgradeRarity(card.id) : null;

        this.elements.modalContent.innerHTML = `
            <div class="card-viewer">
                <div class="physical-card ${currentRarityKey}" id="modal-physical-card">
                    ${card.owned && card.count > 1 ? `<div class="card-count-badge">×${card.count}</div>` : ''}
                    <div class="card-border"></div>
                    <div class="card-header">
                        <h2 class="card-title">${card.owned ? card.name : '???'}</h2>
                        <div class="card-rarity-badge" style="color: ${currentRarity.color}">
                            ${currentRarity.emoji} ${currentRarity.name}
                        </div>
                    </div>

                    <div class="card-artwork">
                        <div class="artwork-frame">
                            ${this.renderCardVisual(card, 'large', 'modal-visual')}
                            ${card.owned ? '<div class="holographic-effect"></div>' : ''}
                        </div>
                    </div>

                    <div class="card-info-section">
                        ${card.owned ?
                            `<p class="card-description-text">${card.description}</p>` :
                            `<p class="card-description-text mystery">Découvrez cette carte en la collectant !</p>`
                        }

                        ${card.owned && currentRarityKey !== 'legendary' ? `
                            <div class="upgrade-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${upgradeInfo ? Math.min((card.count / upgradeInfo.cost) * 100, 100) : 0}%"></div>
                                </div>
                                <div class="progress-text">${card.count} / ${upgradeInfo ? upgradeInfo.cost : '?'} cartes</div>
                            </div>
                        ` : ''}
                    </div>

                </div>
            </div>
        `;

        // Boutons d'action
        this.elements.modalActions.innerHTML = '';

        // Toujours afficher le statut d'amélioration si la carte est possédée
        if (card.owned) {

            if (upgradeInfo.canUpgrade) {
                const upgradeBtn = document.createElement('button');
                upgradeBtn.className = 'modal-btn upgrade-btn';
                upgradeBtn.innerHTML = `
                    <span class="btn-icon">🔺</span>
                    <span class="btn-text">Améliorer la rareté</span>
                    <span class="btn-cost">Coût : ${upgradeInfo.cost} cartes → ${CONFIG.RARITIES[upgradeInfo.nextRarity].emoji} ${CONFIG.RARITIES[upgradeInfo.nextRarity].name}</span>
                `;
                upgradeBtn.addEventListener('click', () => this.handleCardUpgrade(card));
                this.elements.modalActions.appendChild(upgradeBtn);
            } else {
                // Afficher pourquoi on ne peut pas améliorer
                const infoDiv = document.createElement('div');
                infoDiv.className = 'upgrade-info-message';

                if (currentRarityKey === 'legendary') {
                    infoDiv.innerHTML = `
                        <span class="info-icon">👑</span>
                        <span class="info-text">Rareté maximale atteinte !</span>
                    `;
                } else {
                    infoDiv.innerHTML = `
                        <span class="info-icon">📊</span>
                        <span class="info-text">Prochain niveau : ${upgradeInfo.cost} cartes nécessaires (vous en avez ${upgradeInfo.current})</span>
                    `;
                }
                this.elements.modalActions.appendChild(infoDiv);
            }
        }


        this.elements.modal.style.display = 'block';
        this.currentModal = card;
    }

    // Ferme la modal
    closeModal() {
        this.elements.modal.style.display = 'none';
        this.currentModal = null;
    }

    // Gère la pioche d'une carte
    async handleDraw() {
        // Vérifie d'abord si on peut récupérer le crédit quotidien
        if (!DB.hasCredits() && DB.canClaimDailyCredit()) {
            const result = DB.claimDailyCredit();
            if (result.success) {
                this.showToast(result.message, 'success');
                this.render();
                return;
            } else {
                this.showToast(result.message, 'error');
                return;
            }
        }

        // Vérifie si une animation est déjà en cours
        if (DRAW_ANIMATION.isCurrentlyAnimating()) {
            return;
        }

        const result = CARD_SYSTEM.drawCard();

        if (result.success) {
            try {
                // Utilise toujours l'animation multiple (qui gère aussi les cartes uniques)
                if (result.totalDrawn >= 1) {
                    const animationResult = await DRAW_ANIMATION.showMultipleCardsAnimation(result.groupedCards);

                    // Si une seule carte, bascule sur le thème de la carte
                    if (result.totalDrawn === 1) {
                        const firstCard = Object.values(result.groupedCards)[0].card;
                        this.switchTheme(firstCard.theme);
                    }

                    // Après l'animation, met à jour l'affichage
                    this.render();

                    // Animation des nouvelles cartes dans la collection
                    setTimeout(() => {
                        Object.keys(result.groupedCards).forEach(cardId => {
                            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
                            if (cardElement) {
                                cardElement.classList.add('new-draw');
                                setTimeout(() => cardElement.classList.remove('new-draw'), 800);
                            }
                        });

                        // Si une seule carte, scroll vers elle
                        if (result.totalDrawn === 1) {
                            const firstCardId = Object.keys(result.groupedCards)[0];
                            const cardElement = document.querySelector(`[data-card-id="${firstCardId}"]`);
                            if (cardElement) {
                                cardElement.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                    inline: 'nearest'
                                });
                            }
                        }
                    }, 300);

                    // Message adapté selon le nombre de cartes
                    const message = result.totalDrawn === 1
                        ? `1 carte piochée !`
                        : `${result.totalDrawn} cartes piochées !`;
                    this.showToast(message, 'success');
                }

            } catch (error) {
                console.error('Erreur lors de l\'animation:', error);
                // Fallback sans animation
                this.showToast(`${result.totalDrawn} carte${result.totalDrawn > 1 ? 's' : ''} piochée${result.totalDrawn > 1 ? 's' : ''} !`, 'success');
                this.render();
            }
        } else {
            this.showToast(result.message, 'error');
        }
    }

    // Gère l'amélioration d'une carte avec animation
    async handleCardUpgrade(card) {
        const result = CARD_SYSTEM.upgradeCard(card.id);

        if (result.success) {
            // Met à jour l'affichage général IMMÉDIATEMENT (en arrière-plan)
            this.render();

            // Lance l'animation d'amélioration
            await this.animateCardUpgrade(result.newRarity);

            // Récupère les nouvelles informations de la carte après amélioration
            const updatedCards = CARD_SYSTEM.getCardsWithCollectionInfo();
            const updatedCard = updatedCards.find(c => c.id === card.id);

            // Réaffiche la modal seulement si elle est encore ouverte
            if (updatedCard && this.currentModal) {
                this.showCardModal(updatedCard);
            }

            // Message avec crédits gagnés s'il y en a
            let message = result.message;
            if (result.creditsEarned > 0) {
                message += ` (+${result.creditsEarned} crédit${result.creditsEarned > 1 ? 's' : ''} bonus)`;
            }
            this.showToast(message, 'success');
        } else {
            this.showToast(result.message, 'error');
        }
    }

    // Animation d'amélioration de carte
    async animateCardUpgrade(newRarity) {
        const cardElement = document.getElementById('modal-physical-card');
        if (!cardElement) return;

        const newRarityConfig = CONFIG.RARITIES[newRarity];

        // Phase 1: Effet de lueur
        cardElement.classList.add('upgrading');

        // Phase 2: Explosion de particules après 0.5s
        setTimeout(() => {
            this.createUpgradeParticles(cardElement, newRarity);
        }, 500);

        // Phase 3: Transformation de la carte après 1s
        setTimeout(() => {
            cardElement.className = `physical-card ${newRarity}`;

            // Met à jour les informations visuelles
            const rarityBadge = cardElement.querySelector('.card-rarity-badge');
            if (rarityBadge) {
                rarityBadge.innerHTML = `${newRarityConfig.emoji} ${newRarityConfig.name}`;
                rarityBadge.style.color = newRarityConfig.color;
            }

            // Effet de brillance finale
            cardElement.classList.add('upgrade-complete');

            // Nettoie les classes d'animation après 2s
            setTimeout(() => {
                cardElement.classList.remove('upgrading', 'upgrade-complete');
            }, 2000);
        }, 1000);

        // Retourne une promesse qui se résout après l'animation complète
        return new Promise(resolve => setTimeout(resolve, 2500));
    }

    // Crée des particules d'amélioration
    createUpgradeParticles(cardElement, rarity) {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'upgrade-particles';
        cardElement.appendChild(particlesContainer);

        const colors = {
            common: '#ffffff',
            rare: '#3b82f6',
            very_rare: '#10b981',
            epic: '#f59e0b',
            legendary: '#ef4444'
        };

        const particleCount = rarity === 'legendary' ? 30 : 20;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'upgrade-particle';
            particle.style.backgroundColor = colors[rarity];

            // Position aléatoire autour de la carte
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 50 + Math.random() * 100;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.transform = `translate(-50%, -50%)`;
            particle.style.setProperty('--end-x', `${x}px`);
            particle.style.setProperty('--end-y', `${y}px`);

            particlesContainer.appendChild(particle);
        }

        // Supprime les particules après l'animation
        setTimeout(() => {
            if (particlesContainer.parentNode) {
                particlesContainer.parentNode.removeChild(particlesContainer);
            }
        }, 1500);
    }

    // Change de thème
    switchTheme(theme) {
        // Met à jour les onglets
        this.elements.themeTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.theme === theme);
        });

        // Change le thème actuel
        CARD_SYSTEM.setCurrentTheme(theme);
        this.renderCards();
    }

    // Met à jour le bouton de pioche
    updateDrawButton() {
        const hasCredits = DB.hasCredits();
        const creditsCount = DB.getCredits();
        const canClaimDaily = DB.canClaimDailyCredit();
        const dailyTimeLeft = DB.getDailyCreditTimeLeft();

        // Vérifie automatiquement si on peut récupérer le crédit quotidien
        if (canClaimDaily && creditsCount < CONFIG.CREDITS.MAX_STORED) {
            const result = DB.claimDailyCredit();
            if (result.success) {
                this.showToast(result.message, 'success');
                this.updateStats();
                return; // Re-calcule après avoir ajouté le crédit
            }
        }

        // Active le bouton si on a des crédits OU si on peut récupérer le crédit quotidien
        this.elements.drawButton.disabled = !hasCredits && !canClaimDaily;

        // Met à jour le texte du bouton selon la situation
        if (hasCredits) {
            const cardText = creditsCount === 1 ? 'carte' : 'cartes';
            this.elements.drawButton.innerHTML = `🎁 Piocher ${creditsCount} ${cardText}`;
            this.elements.drawCooldown.style.display = 'none';
        } else if (canClaimDaily) {
            this.elements.drawButton.innerHTML = `🎁 Récupérer crédit gratuit`;
            this.elements.drawCooldown.style.display = 'none';
        } else {
            this.elements.drawButton.innerHTML = `🎁 Piocher une carte`;
            const formattedTime = UTILS.formatTimeLeft(dailyTimeLeft);
            this.elements.drawCooldown.textContent = `Prochain crédit gratuit dans ${formattedTime}`;
            this.elements.drawCooldown.style.display = 'block';
        }
    }

    // Démarre la mise à jour du cooldown
    startCooldownUpdate() {
        this.updateInterval = setInterval(() => {
            this.updateDrawButton();
            this.updateCreditCountdown();
        }, 1000);
    }

    // Affiche un toast de notification
    showToast(message, type = 'info', duration = 3000) {
        const toast = this.elements.toast;
        toast.textContent = message;
        toast.className = `toast ${type}`;

        // Force un reflow pour que l'animation fonctionne
        toast.offsetHeight;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // Ajoute un crédit bonus (touche secrète X)
    addBonusCredit() {
        const currentCredits = DB.getCredits();
        if (currentCredits >= CONFIG.CREDITS.MAX_STORED) {
            this.showToast('Maximum de crédits atteint !', 'warning');
            return;
        }

        const newCredits = DB.addCredits(1);
        this.updateStats();
        this.showToast(`+1 crédit bonus ! (${newCredits}/${CONFIG.CREDITS.MAX_STORED})`, 'success');
    }

    // Gestion des paramètres
    openSettings() {
        console.log('🔧 Ouverture des paramètres');
        this.elements.settingsModal.style.display = 'block';
        this.elements.passwordInput.value = '';
        this.elements.passwordSection.style.display = 'block';
        this.elements.adminControls.style.display = 'none';

        // Met le focus sur le champ mot de passe avec un léger délai
        setTimeout(() => {
            if (this.elements.passwordInput) {
                this.elements.passwordInput.focus();
            }
        }, 100);
    }

    closeSettings() {
        this.elements.settingsModal.style.display = 'none';
        this.elements.passwordInput.value = '';
        this.elements.passwordSection.style.display = 'block';
        this.elements.adminControls.style.display = 'none';
    }

    checkPassword(password) {
        if (password === '13042018') {
            this.elements.passwordSection.style.display = 'none';
            this.elements.adminControls.style.display = 'block';
            // Met le focus sur le champ de crédits avec un léger délai pour laisser le temps à l'affichage
            setTimeout(() => {
                if (this.elements.creditsAmountInput) {
                    this.elements.creditsAmountInput.focus();
                }
            }, 100);
        } else {
            this.elements.adminControls.style.display = 'none';
        }
    }

    validateAdminCredits() {
        const amount = parseInt(this.elements.creditsAmountInput.value);

        if (!amount || amount < 1 || amount > 99) {
            this.showToast('Veuillez entrer un nombre entre 1 et 99', 'error');
            return;
        }

        const currentCredits = DB.getCredits();
        const newCredits = DB.addCredits(amount);

        this.showToast(`+${amount} crédit${amount > 1 ? 's' : ''} bonus ajouté${amount > 1 ? 's' : ''} ! (${newCredits}/${CONFIG.CREDITS.MAX_STORED})`, 'success');
        this.updateStats();
        this.closeSettings();
    }

    // Nettoie les ressources
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Nettoie l'animation de pioche
        if (DRAW_ANIMATION) {
            DRAW_ANIMATION.destroy();
        }
    }
}

// Instance globale
const UI = new UIManager();