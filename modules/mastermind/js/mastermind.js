class MastermindGame {
    constructor() {
        // Configuration des couleurs disponibles par niveau
        // Niveau 3 : 3 couleurs exactement
        // Niveau 4 : 4 couleurs utilisées + 1 couleur en trop
        // Niveau 5 : 5 couleurs utilisées + 2 couleurs en trop
        this.colorSets = {
            3: ['red', 'blue', 'green'],
            4: ['red', 'blue', 'green', 'yellow', 'purple'], // 5 couleurs affichées, 4 utilisées
            5: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'] // 7 couleurs affichées, 5 utilisées
        };

        // Nombre de couleurs dans la combinaison secrète par niveau
        this.secretLengthByLevel = {
            3: 3,
            4: 4,
            5: 5
        };

        // Nombre d'essais selon la difficulté
        this.maxAttemptsByLevel = {
            3: 4,
            4: 6,
            5: 8
        };

        // État du jeu
        this.difficulty = null;
        this.secret = [];
        this.currentAttempt = [];
        this.attempts = [];
        this.maxAttempts = 10;
        this.selectedColor = null;
        this.gameOver = false;
        this.excludedColors = new Set(); // Couleurs marquées comme absentes
        this.lockedColors = new Set(); // Couleurs bien placées (verrouillées)

        // Clé localStorage pour sauvegarder les parties
        this.STORAGE_KEY_PREFIX = 'mastermind_game_';
    }

    async init() {
        PageHeader.render({
            icon: '🎯',
            title: 'Mastermind',
            subtitle: 'Trouvez la combinaison secrète !',
            actions: [],
            stats: [
                { label: 'Essais restants', id: 'attempts-remaining', value: '3' },
                { label: 'Parties', id: 'attempts-stat', value: '0' },
                { label: 'Niveau', id: 'difficulty-stat', value: '-' }
            ],
            reward: {
                baseCredits: 3,
                bonusText: '+ bonus rapidité'
            }
        });

        // Initialiser le compteur d'essais journaliers
        this.remainingAttempts = await GameAttempts.initHeaderDisplay('mastermind', 3);

        if (this.remainingAttempts === 0) {
            Toast.info('Plus d\'essais rémunérés aujourd\'hui, mais tu peux continuer à jouer pour t\'entraîner !');
        }

        this.cacheElements();
        this.attachEvents();
        this.showDifficultySelector();
    }

    cacheElements() {
        this.elements = {
            difficultySelector: document.getElementById('difficulty-selector'),
            gameContainer: document.getElementById('game-container'),
            colorPalette: document.getElementById('color-palette'),
            attemptsHistory: document.getElementById('attempts-history'),
            resetBtn: document.getElementById('reset-btn'),
            backToMenuBtn: document.getElementById('back-to-menu-btn')
        };
    }

    attachEvents() {
        // Sélection de difficulté - utiliser event delegation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.difficulty-btn')) {
                const btn = e.target.closest('.difficulty-btn');
                const level = parseInt(btn.dataset.level);
                this.handleDifficultySelection(level);
            }
        });

        // Boutons
        this.elements.resetBtn.addEventListener('click', () => this.resetGame());
        this.elements.backToMenuBtn.addEventListener('click', () => this.showDifficultySelector());
    }

    async handleDifficultySelection(level) {
        // Vérifier s'il y a une partie sauvegardée
        const savedGame = this.loadGame(level);

        if (savedGame && !savedGame.gameOver) {
            const confirmed = await window.confirm(
                `Une partie est en cours pour ce niveau (${savedGame.attempts.length}/${savedGame.maxAttempts} essais).\n\nVoulez-vous la reprendre ?`
            );

            if (confirmed) {
                this.loadAndStartGame(level, savedGame);
            } else {
                this.clearSavedGame(level);
                this.startGame(level);
            }
        } else {
            this.startGame(level);
        }
    }

    showDifficultySelector() {
        this.elements.difficultySelector.style.display = 'block';
        this.elements.gameContainer.style.display = 'none';
    }

    startGame(level) {
        this.difficulty = level;
        this.maxAttempts = this.maxAttemptsByLevel[level];
        this.secretLength = this.secretLengthByLevel[level];
        this.secret = this.generateSecret();
        this.currentAttempt = [];
        this.attempts = [];
        this.gameOver = false;
        this.selectedColor = null;
        this.excludedColors = new Set();
        this.lockedColors = new Set();

        this.elements.difficultySelector.style.display = 'none';
        this.elements.gameContainer.style.display = 'block';

        // Mettre à jour les stats du header
        this.updateHeaderStats();

        // Mettre à jour le badge de récompense selon le niveau
        this.updateRewardBadge();

        this.renderColorPalette();
        this.renderAllAttempts();

        const extraColors = this.colorSets[level].length - this.secretLength;
        const extraText = extraColors > 0 ? ` (+ ${extraColors} couleur${extraColors > 1 ? 's' : ''} en trop)` : '';
        Toast.info(`Niveau ${level} - ${this.secretLength} couleurs à trouver${extraText} en ${this.maxAttempts} essais max !`);
    }

    generateSecret() {
        const colors = [...this.colorSets[this.difficulty]];
        const secret = [];

        // Générer une combinaison sans doublons avec le bon nombre de couleurs
        for (let i = 0; i < this.secretLength; i++) {
            const randomIndex = Math.floor(Math.random() * colors.length);
            secret.push(colors[randomIndex]);
            colors.splice(randomIndex, 1); // Retirer la couleur pour éviter les doublons
        }

        return secret;
    }

    renderColorPalette() {
        const colors = this.colorSets[this.difficulty];
        this.elements.colorPalette.innerHTML = '';

        colors.forEach(color => {
            const peg = document.createElement('div');
            peg.className = `color-peg color-${color}`;
            peg.dataset.color = color;

            // Vérifier si la couleur est exclue ou verrouillée
            const isExcluded = this.excludedColors.has(color);
            const isLocked = this.lockedColors.has(color);

            if (isExcluded || isLocked) {
                peg.classList.add('disabled');
                if (isExcluded) {
                    peg.title = 'Couleur absente de la solution';
                } else {
                    peg.title = 'Couleur bien placée';
                }
            }

            peg.addEventListener('click', () => {
                if (this.gameOver) return;

                // Réévaluer l'état de la couleur au moment du clic
                const isCurrentlyExcluded = this.excludedColors.has(color);
                const isCurrentlyLocked = this.lockedColors.has(color);

                // Empêcher l'utilisation des couleurs exclues ou verrouillées
                if (isCurrentlyExcluded || isCurrentlyLocked) {
                    if (isCurrentlyExcluded) {
                        Toast.info('Cette couleur est absente de la solution');
                    } else {
                        Toast.info('Cette couleur est déjà bien placée');
                    }
                    return;
                }

                // Trouver le premier emplacement libre (undefined)
                let firstFreeIndex = -1;
                for (let i = 0; i < this.secretLength; i++) {
                    if (this.currentAttempt[i] === undefined) {
                        firstFreeIndex = i;
                        break;
                    }
                }

                // Si aucun emplacement libre, la tentative est complète
                if (firstFreeIndex === -1) {
                    Toast.info('Tous les emplacements sont remplis');
                    return;
                }

                // Ajouter la couleur au premier slot libre
                this.currentAttempt[firstFreeIndex] = color;
                this.renderAllAttempts();

                // Validation automatique quand tous les emplacements sont remplis
                const filledCount = this.currentAttempt.filter(c => c !== undefined).length;
                if (filledCount === this.secretLength) {
                    setTimeout(() => this.validateAttempt(), 300);
                }
            });

            this.elements.colorPalette.appendChild(peg);
        });
    }


    async validateAttempt() {
        if (this.gameOver) return;

        const feedback = this.checkAttempt(this.currentAttempt);
        console.log('Feedback:', feedback, 'Difficulty:', this.difficulty);

        this.attempts.push({
            attempt: [...this.currentAttempt],
            feedback: feedback
        });

        // Mettre à jour les sets de couleurs exclues et verrouillées
        for (let i = 0; i < this.secretLength; i++) {
            const color = this.currentAttempt[i];
            if (feedback[i] === 'correct') {
                this.lockedColors.add(color);
            } else if (feedback[i] === 'absent') {
                this.excludedColors.add(color);
            }
        }

        // Re-render la palette pour afficher les couleurs désactivées
        this.renderColorPalette();
        this.renderAllAttempts();

        // Mettre à jour les stats du header
        this.updateHeaderStats();

        // Vérifier victoire (toutes les positions sont correctes)
        const isWin = feedback.every(f => f === 'correct');
        if (isWin) {
            console.log('VICTOIRE !');
            this.gameOver = true;
            this.saveGame(); // Sauvegarder l'état final
            this.clearSavedGame(this.difficulty); // Puis supprimer la sauvegarde
            await this.handleVictory();
            return;
        }

        // Vérifier défaite
        if (this.attempts.length >= this.maxAttempts) {
            this.gameOver = true;
            this.saveGame(); // Sauvegarder l'état final
            this.clearSavedGame(this.difficulty); // Puis supprimer la sauvegarde
            await this.handleDefeat();
            return;
        }

        // Préparer la prochaine tentative en gardant les couleurs bien placées
        const newAttempt = [];
        for (let i = 0; i < this.secretLength; i++) {
            if (feedback[i] === 'correct') {
                newAttempt[i] = this.currentAttempt[i]; // Garder la couleur bien placée
            }
        }
        this.currentAttempt = newAttempt;

        // Sauvegarder la partie après chaque tentative
        this.saveGame();

        this.renderAllAttempts();

        // Désélectionner la couleur
        document.querySelectorAll('.color-peg').forEach(p => p.classList.remove('selected'));
        this.selectedColor = null;
    }

    checkAttempt(attempt) {
        // Retourne un tableau de feedback pour chaque position
        // 'correct' = vert (bonne couleur, bonne position)
        // 'present' = orange (couleur existe mais mauvaise position)
        // 'absent' = rouge (couleur n'existe pas)
        const feedback = [];
        const secretCopy = [...this.secret];
        const attemptCopy = [...attempt];

        // D'abord, marquer les positions correctes
        for (let i = 0; i < this.secretLength; i++) {
            if (attemptCopy[i] === secretCopy[i]) {
                feedback[i] = 'correct';
                secretCopy[i] = null; // Marquer comme utilisé
                attemptCopy[i] = null;
            }
        }

        // Ensuite, vérifier les couleurs présentes mais mal placées
        for (let i = 0; i < this.secretLength; i++) {
            if (attemptCopy[i] !== null) {
                const index = secretCopy.indexOf(attemptCopy[i]);
                if (index !== -1) {
                    feedback[i] = 'present';
                    secretCopy[index] = null; // Marquer comme utilisé
                } else {
                    feedback[i] = 'absent';
                }
            }
        }

        return feedback;
    }

    renderAllAttempts() {
        this.elements.attemptsHistory.innerHTML = '';

        // Afficher tous les essais (remplis et vides) + la tentative en cours
        for (let attemptIndex = 0; attemptIndex < this.maxAttempts; attemptIndex++) {
            const row = document.createElement('div');
            row.className = 'attempt-row';

            // Numéro de tentative
            const attemptNum = document.createElement('div');
            attemptNum.className = 'attempt-number';
            attemptNum.textContent = `#${attemptIndex + 1}`;
            row.appendChild(attemptNum);

            // Pions de la tentative avec feedback individuel
            const pegsContainer = document.createElement('div');
            pegsContainer.className = 'pegs-container';

            const entry = this.attempts[attemptIndex];
            const isCurrentAttempt = attemptIndex === this.attempts.length;

            if (entry) {
                // Tentative déjà validée
                entry.attempt.forEach((color, i) => {
                    const pegWrapper = document.createElement('div');
                    pegWrapper.className = 'peg-wrapper';

                    const peg = document.createElement('div');
                    peg.className = `peg filled color-${color}`;

                    // Si c'est une couleur bien placée, ajouter la classe locked
                    if (entry.feedback[i] === 'correct') {
                        peg.classList.add('locked');
                    }

                    pegWrapper.appendChild(peg);

                    // Indicateur de feedback sous le pion
                    const indicator = document.createElement('div');
                    indicator.className = `feedback-indicator ${entry.feedback[i]}`;
                    indicator.textContent = entry.feedback[i] === 'correct' ? '✓' :
                                           entry.feedback[i] === 'present' ? '?' : '✗';
                    pegWrapper.appendChild(indicator);

                    pegsContainer.appendChild(pegWrapper);
                });
            } else if (isCurrentAttempt && !this.gameOver) {
                // Tentative en cours
                row.classList.add('current-attempt');

                for (let i = 0; i < this.secretLength; i++) {
                    const pegWrapper = document.createElement('div');
                    pegWrapper.className = 'peg-wrapper';

                    const peg = document.createElement('div');
                    peg.className = 'peg';
                    peg.dataset.index = i;

                    if (this.currentAttempt[i]) {
                        peg.classList.add('filled', `color-${this.currentAttempt[i]}`);

                        // Vérifier si c'est un emplacement bloqué
                        const lastAttempt = this.attempts[this.attempts.length - 1];
                        if (lastAttempt && lastAttempt.feedback[i] === 'correct') {
                            peg.classList.add('locked');
                            peg.title = 'Bien placé !';
                        }
                    }

                    // Clic pour supprimer le dernier pion non bloqué
                    peg.addEventListener('click', () => {
                        if (this.gameOver) return;

                        // Ne pas permettre de supprimer les pions bloqués
                        if (peg.classList.contains('locked')) {
                            Toast.info('Cette couleur est bien placée !');
                            return;
                        }

                        // Supprimer le dernier pion non vide
                        for (let j = this.secretLength - 1; j >= 0; j--) {
                            if (this.currentAttempt[j] !== undefined) {
                                const lastAttempt = this.attempts[this.attempts.length - 1];
                                if (!lastAttempt || lastAttempt.feedback[j] !== 'correct') {
                                    this.currentAttempt[j] = undefined;
                                    this.renderAllAttempts();
                                    return;
                                }
                            }
                        }
                    });

                    pegWrapper.appendChild(peg);
                    pegsContainer.appendChild(pegWrapper);
                }
            } else {
                // Tentative vide (pas encore jouée)
                for (let i = 0; i < this.secretLength; i++) {
                    const pegWrapper = document.createElement('div');
                    pegWrapper.className = 'peg-wrapper';

                    const peg = document.createElement('div');
                    peg.className = 'peg empty';
                    pegWrapper.appendChild(peg);

                    pegsContainer.appendChild(pegWrapper);
                }
                row.classList.add('empty-attempt');
            }

            row.appendChild(pegsContainer);
            this.elements.attemptsHistory.appendChild(row);
        }
    }

    async handleVictory() {
        const attemptCount = this.attempts.length;

        // Afficher l'animation de victoire
        VictoryAnimation.show();

        // Vérifier s'il reste des essais rémunérés
        if (this.remainingAttempts > 0) {
            // Calcul des crédits selon le niveau de difficulté (base = nombre de couleurs)
            const baseCredits = this.secretLength; // 3, 4 ou 5 crédits selon le niveau
            let bonusCredits = 0;

            // Bonus de rapidité selon le nombre de tentatives
            if (this.difficulty === 3) {
                bonusCredits = attemptCount <= 2 ? 2 : attemptCount <= 3 ? 1 : 0;
            } else if (this.difficulty === 4) {
                bonusCredits = attemptCount <= 3 ? 2 : attemptCount <= 4 ? 1 : 0;
            } else if (this.difficulty === 5) {
                bonusCredits = attemptCount <= 4 ? 3 : attemptCount <= 6 ? 2 : 1;
            }

            const totalCredits = baseCredits + bonusCredits;

            await this.addCredits(totalCredits);

            // Enregistrer la tentative
            await GameAttempts.recordAttempt('mastermind', {
                completed: true,
                difficulty: this.difficulty,
                attempts: attemptCount,
                maxAttempts: this.maxAttempts
            });

            // Mettre à jour l'affichage des essais restants
            this.remainingAttempts = await GameAttempts.initHeaderDisplay('mastermind', 3);

            setTimeout(() => {
                Toast.success(`Bravo ! Trouvé en ${attemptCount} tentative${attemptCount > 1 ? 's' : ''} ! +${totalCredits} crédits`);
            }, 2000);
        } else {
            // Mode entraînement - pas de crédits
            setTimeout(() => {
                Toast.success(`Bravo ! Trouvé en ${attemptCount} tentative${attemptCount > 1 ? 's' : ''} ! (mode entraînement)`);
            }, 2000);
        }
    }

    async handleDefeat() {
        Toast.error(`Perdu ! La combinaison était : ${this.secret.map(c => this.getColorEmoji(c)).join(' ')}`);

        // Enregistrer la tentative uniquement si c'était un essai rémunéré
        if (this.remainingAttempts > 0) {
            await GameAttempts.recordAttempt('mastermind', {
                completed: false,
                difficulty: this.difficulty,
                attempts: this.maxAttempts,
                maxAttempts: this.maxAttempts
            });

            // Mettre à jour l'affichage des essais restants
            this.remainingAttempts = await GameAttempts.initHeaderDisplay('mastermind', 3);
        }

        // Révéler la solution
        setTimeout(() => {
            this.currentAttempt = [...this.secret];
            this.renderCurrentAttempt();
        }, 2000);
    }

    getColorEmoji(color) {
        const emojis = {
            red: '🔴',
            blue: '🔵',
            green: '🟢',
            yellow: '🟡',
            purple: '🟣',
            orange: '🟠',
            cyan: '🔵',
            pink: '🩷'
        };
        return emojis[color] || '⚪';
    }

    resetGame() {
        if (this.difficulty) {
            this.clearSavedGame(this.difficulty);
            this.startGame(this.difficulty);
        }
    }

    saveGame() {
        if (!this.difficulty) return;

        const gameState = {
            difficulty: this.difficulty,
            secret: this.secret,
            secretLength: this.secretLength,
            currentAttempt: this.currentAttempt,
            attempts: this.attempts,
            maxAttempts: this.maxAttempts,
            gameOver: this.gameOver,
            excludedColors: Array.from(this.excludedColors),
            lockedColors: Array.from(this.lockedColors)
        };

        const key = this.STORAGE_KEY_PREFIX + this.difficulty;
        localStorage.setItem(key, JSON.stringify(gameState));
    }

    loadGame(level) {
        const key = this.STORAGE_KEY_PREFIX + level;
        const saved = localStorage.getItem(key);

        if (!saved) return null;

        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Error loading saved game:', e);
            return null;
        }
    }

    clearSavedGame(level) {
        const key = this.STORAGE_KEY_PREFIX + level;
        localStorage.removeItem(key);
    }

    loadAndStartGame(level, savedGame) {
        this.difficulty = level;
        this.maxAttempts = savedGame.maxAttempts;
        this.secretLength = savedGame.secretLength;
        this.secret = savedGame.secret;
        this.currentAttempt = savedGame.currentAttempt;
        this.attempts = savedGame.attempts;
        this.gameOver = savedGame.gameOver;
        this.selectedColor = null;
        this.excludedColors = new Set(savedGame.excludedColors || []);
        this.lockedColors = new Set(savedGame.lockedColors || []);

        // Si les Sets sont vides mais qu'il y a des attempts, reconstruire depuis l'historique
        if ((this.excludedColors.size === 0 && this.lockedColors.size === 0) && this.attempts.length > 0) {
            this.attempts.forEach(entry => {
                entry.attempt.forEach((color, i) => {
                    if (entry.feedback[i] === 'correct') {
                        this.lockedColors.add(color);
                    } else if (entry.feedback[i] === 'absent') {
                        this.excludedColors.add(color);
                    }
                });
            });
        }

        this.elements.difficultySelector.style.display = 'none';
        this.elements.gameContainer.style.display = 'block';

        // Mettre à jour les stats du header
        this.updateHeaderStats();

        // Mettre à jour le badge de récompense selon le niveau
        this.updateRewardBadge();

        this.renderColorPalette();
        this.renderAllAttempts();

        Toast.info(`Partie reprise - ${this.attempts.length}/${this.maxAttempts} essais utilisés`);
    }

    updateHeaderStats() {
        // Mettre à jour le nombre d'essais
        const attemptsStatEl = document.getElementById('attempts-stat');
        if (attemptsStatEl) {
            attemptsStatEl.textContent = `${this.attempts.length}/${this.maxAttempts}`;
        }

        // Mettre à jour le niveau
        const difficultyStatEl = document.getElementById('difficulty-stat');
        if (difficultyStatEl) {
            const difficultyNames = {
                3: 'Facile',
                4: 'Moyen',
                5: 'Difficile'
            };
            difficultyStatEl.textContent = difficultyNames[this.difficulty] || '-';
        }
    }

    updateRewardBadge() {
        // Mettre à jour le montant des crédits dans le badge
        const rewardAmountEl = document.querySelector('.reward-badge__amount');
        if (rewardAmountEl && this.secretLength) {
            rewardAmountEl.textContent = this.secretLength;
        }
    }

    async addCredits(amount) {
        const user = authService.getCurrentUser();
        if (!user) return;

        try {
            await authService.fetchAPI(`/users/${user.id}/credits`, {
                method: 'POST',
                body: JSON.stringify({ amount })
            });
        } catch (error) {
            console.error('Failed to add credits:', error);
        }
    }
}

// Instance globale
const mastermindGame = new MastermindGame();
