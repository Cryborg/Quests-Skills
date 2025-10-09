// Jeu de Suite Logique de Nombres
class NumberSequenceGame {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.level = 1;
        this.currentSequence = null;
        this.maxLevel = 8;
    }

    async init() {
        // Créer le header avec les stats
        PageHeader.render({
            icon: '🔢',
            title: 'Suites Logiques',
            subtitle: 'Trouve le nombre qui complète la suite !',
            actions: [],
            stats: [
                { label: 'Essais aujourd\'hui', id: 'attempts-remaining', value: '3' },
                { label: 'Score', id: 'score', value: '0' },
                { label: 'Série', id: 'streak', value: '0 🔥' },
                { label: 'Niveau', id: 'level', value: '1' }
            ]
        });

        // Initialiser le compteur d'essais
        const remaining = await GameAttempts.initHeaderDisplay('number-sequence', 3);

        if (remaining === 0) {
            Toast.warning('Plus d\'essais pour aujourd\'hui ! Reviens demain.');
            return;
        }

        this.cacheElements();
        this.attachEvents();
        this.generateSequence();
    }

    cacheElements() {
        this.elements = {
            sequenceDisplay: document.getElementById('sequence-display'),
            answerInput: document.getElementById('answer-input'),
            validateBtn: document.getElementById('validate-btn'),
            skipBtn: document.getElementById('skip-btn')
        };
    }

    attachEvents() {
        this.elements.validateBtn.addEventListener('click', () => this.validateAnswer());
        this.elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.validateAnswer();
        });
        this.elements.skipBtn.addEventListener('click', () => this.skipSequence());
    }

    generateSequence() {
        this.elements.answerInput.value = '';
        this.elements.answerInput.focus();

        const sequenceLength = 4;
        let sequence, answer;

        if (this.level <= 2) {
            // Niveau 1-2 : Addition avec step 2 à 5
            const step = Math.floor(Math.random() * 4) + 2; // 2 à 5
            const start = Math.floor(Math.random() * 10) + 1; // 1 à 10
            sequence = [];
            for (let i = 0; i < sequenceLength; i++) {
                sequence.push(start + i * step);
            }
            answer = start + sequenceLength * step;

        } else if (this.level <= 4) {
            // Niveau 3-4 : Soustraction avec step -1 à -3
            const step = -(Math.floor(Math.random() * 3) + 1); // -1 à -3
            const start = Math.floor(Math.random() * 20) + 20; // 20 à 40 pour éviter les négatifs
            sequence = [];
            for (let i = 0; i < sequenceLength; i++) {
                sequence.push(start + i * step);
            }
            answer = start + sequenceLength * step;

        } else if (this.level <= 6) {
            // Niveau 5-6 : Multiplication x2 à x3 (résultat final ≤ 100)
            const step = Math.floor(Math.random() * 2) + 2; // 2 ou 3
            let start;

            // Choix sécurisé du start pour garantir résultat ≤ 100
            // Pour x2 : max start = 100 / (2^4) = 6.25 → max 6
            // Pour x3 : max start = 100 / (3^4) = 1.23 → max 1, mais on prend 2 minimum
            if (step === 2) {
                start = Math.floor(Math.random() * 4) + 2; // 2 à 5
            } else { // step === 3
                start = 2; // Fixe à 2 pour x3 (2*81 = 162 > 100, donc on limite)
            }

            sequence = [];
            for (let i = 0; i < sequenceLength; i++) {
                sequence.push(start * Math.pow(step, i));
            }
            answer = start * Math.pow(step, sequenceLength);

        } else {
            // Niveau 7-8 : Multiplication x3 à x5 (résultat final ≤ 1000)
            const step = Math.floor(Math.random() * 3) + 3; // 3 à 5
            let start;

            // Choix sécurisé du start pour garantir résultat ≤ 1000
            // Pour x3 : max start = 1000 / (3^4) = 12.3 → max 12
            // Pour x4 : max start = 1000 / (4^4) = 3.9 → max 3
            // Pour x5 : max start = 1000 / (5^4) = 1.6 → max 1, mais on prend 2 minimum
            if (step === 3) {
                start = Math.floor(Math.random() * 3) + 2; // 2 à 4
            } else if (step === 4) {
                start = Math.floor(Math.random() * 2) + 2; // 2 à 3
            } else { // step === 5
                start = 2; // Fixe à 2 pour x5
            }

            sequence = [];
            for (let i = 0; i < sequenceLength; i++) {
                sequence.push(start * Math.pow(step, i));
            }
            answer = start * Math.pow(step, sequenceLength);
        }

        this.currentSequence = {
            display: sequence,
            answer
        };

        this.renderSequence();
    }

    renderSequence() {
        const numbersHtml = this.currentSequence.display
            .map(num => `<div class="sequence-number">${num}</div>`)
            .join('');

        this.elements.sequenceDisplay.innerHTML = numbersHtml + '<div class="question-mark" id="question-mark">?</div>';
    }

    validateAnswer() {
        const userAnswer = parseInt(this.elements.answerInput.value);

        if (isNaN(userAnswer)) {
            Toast.error('Entre un nombre valide');
            return;
        }

        if (userAnswer === this.currentSequence.answer) {
            this.correctAnswer();
        } else {
            this.incorrectAnswer();
        }
    }

    async correctAnswer() {
        this.score += 10;
        this.streak++;

        if (this.streak % 2 === 0 && this.level < this.maxLevel) {
            this.level++;
        }

        this.updateStats();

        // Animation de validation
        this.showValidationAnimation('✅');

        // Vérifier si tous les niveaux sont terminés
        if (this.level === this.maxLevel && this.streak % 2 === 0) {
            await this.completeAllLevels();
            return;
        }

        // Récompense
        if (this.streak % 3 === 0) {
            await this.addCredits(2);
            Toast.success(`Bravo ! La réponse était ${this.currentSequence.answer} - Bonus : +2 🪙`);
        } else {
            Toast.success(`Bravo ! La réponse était ${this.currentSequence.answer}`);
        }

        setTimeout(() => this.generateSequence(), 2000);
    }

    showValidationAnimation(emoji) {
        const questionMark = document.getElementById('question-mark');
        if (!questionMark) return;

        // Remplacer le ? par l'emoji
        questionMark.textContent = emoji;
        questionMark.className = 'question-mark';

        // Force reflow pour redémarrer l'animation
        void questionMark.offsetWidth;

        if (emoji === '✅') {
            questionMark.classList.add('show-correct');
        } else {
            questionMark.classList.add('show-incorrect');
        }
    }

    async completeAllLevels() {
        // Bloquer le jeu pour aujourd'hui
        await GameAttempts.recordAttempt('number-sequence', {
            score: this.score,
            completed: true,
            allLevelsCompleted: true
        });

        // Donner 10 crédits bonus
        await this.addCredits(10);

        Toast.success('🎉 Félicitations ! Tu as terminé tous les niveaux ! +10 🪙 bonus !');

        // Désactiver les contrôles
        this.elements.answerInput.disabled = true;
        this.elements.validateBtn.disabled = true;
        this.elements.skipBtn.disabled = true;

        setTimeout(() => {
            Toast.info('Reviens demain pour un nouveau défi !');
        }, 3000);
    }

    async incorrectAnswer() {
        this.streak = 0;
        this.updateStats();

        // Animation de validation
        this.showValidationAnimation('❌');

        // Enregistrer la tentative ratée
        await GameAttempts.recordAttempt('number-sequence', {
            score: this.score,
            completed: false
        });

        // Mettre à jour l'affichage des essais restants
        const remaining = await GameAttempts.initHeaderDisplay('number-sequence', 3);

        if (remaining === 0) {
            Toast.error(`Incorrect. La réponse était ${this.currentSequence.answer}. Plus d'essais pour aujourd'hui !`);

            // Désactiver les contrôles
            this.elements.answerInput.disabled = true;
            this.elements.validateBtn.disabled = true;
            this.elements.skipBtn.disabled = true;

            setTimeout(() => {
                Toast.info('Reviens demain pour un nouveau défi !');
            }, 3000);
            return;
        }

        Toast.error(`Incorrect. La réponse était ${this.currentSequence.answer}`);

        setTimeout(() => this.generateSequence(), 2500);
    }

    skipSequence() {
        this.streak = 0;
        this.updateStats();

        Toast.hint(`Passé. La réponse était ${this.currentSequence.answer}`);

        setTimeout(() => this.generateSequence(), 1500);
    }

    updateStats() {
        const scoreElement = document.getElementById('score');
        const streakElement = document.getElementById('streak');
        const levelElement = document.getElementById('level');

        if (scoreElement) scoreElement.textContent = this.score;
        if (streakElement) streakElement.textContent = `${this.streak} 🔥`;
        if (levelElement) levelElement.textContent = this.level;
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
const sequenceGame = new NumberSequenceGame();
