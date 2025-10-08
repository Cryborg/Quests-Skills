// Jeu de Suite Logique de Nombres
class NumberSequenceGame {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.level = 1;
        this.currentSequence = null;
        this.hintUsed = false;

        // Types de suites
        this.sequenceTypes = [
            {
                name: 'addition',
                generate: (start, step, length) => {
                    const seq = [];
                    for (let i = 0; i < length; i++) {
                        seq.push(start + i * step);
                    }
                    return seq;
                },
                hint: (step) => `Chaque nombre augmente de ${step}`
            },
            {
                name: 'multiplication',
                generate: (start, step, length) => {
                    const seq = [];
                    for (let i = 0; i < length; i++) {
                        seq.push(start * Math.pow(step, i));
                    }
                    return seq;
                },
                hint: (step) => `Chaque nombre est multiplié par ${step}`
            },
            {
                name: 'squares',
                generate: (start, step, length) => {
                    const seq = [];
                    for (let i = 0; i < length; i++) {
                        const n = start + i;
                        seq.push(n * n);
                    }
                    return seq;
                },
                hint: () => `Suite des carrés (n × n)`
            },
            {
                name: 'alternating',
                generate: (start, step, length) => {
                    const seq = [];
                    for (let i = 0; i < length; i++) {
                        seq.push(start + (i % 2 === 0 ? 0 : step));
                    }
                    return seq;
                },
                hint: (step) => `Les nombres alternent entre deux valeurs`
            }
        ];
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
            hintBtn: document.getElementById('hint-btn'),
            skipBtn: document.getElementById('skip-btn'),
            hintSection: document.getElementById('hint-section'),
            hintText: document.getElementById('hint-text')
        };
    }

    attachEvents() {
        this.elements.validateBtn.addEventListener('click', () => this.validateAnswer());
        this.elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.validateAnswer();
        });
        this.elements.hintBtn.addEventListener('click', () => this.showHint());
        this.elements.skipBtn.addEventListener('click', () => this.skipSequence());
    }

    generateSequence() {
        this.hintUsed = false;
        this.elements.hintSection.style.display = 'none';
        this.elements.answerInput.value = '';
        this.elements.answerInput.focus();

        // Difficulté basée sur le niveau
        const sequenceLength = Math.min(4 + Math.floor(this.level / 3), 7);

        // Choisir le type de suite selon le niveau
        let type;
        if (this.level <= 3) {
            type = this.sequenceTypes[0]; // Addition simple
        } else if (this.level <= 6) {
            const idx = Math.random() < 0.7 ? 0 : 1;
            type = this.sequenceTypes[idx]; // Addition ou multiplication
        } else {
            type = this.sequenceTypes[Math.floor(Math.random() * this.sequenceTypes.length)];
        }

        // Paramètres selon le niveau
        const start = Math.floor(Math.random() * (this.level * 2)) + 1;
        let step;

        if (type.name === 'addition') {
            step = Math.floor(Math.random() * Math.min(this.level + 2, 10)) + 1;
        } else if (type.name === 'multiplication') {
            step = Math.floor(Math.random() * 3) + 2; // 2 ou 3
        } else if (type.name === 'squares') {
            step = 1;
        } else if (type.name === 'alternating') {
            step = Math.floor(Math.random() * 5) + 3;
        }

        const fullSequence = type.generate(start, step, sequenceLength + 1);
        const answer = fullSequence[fullSequence.length - 1];
        const displaySequence = fullSequence.slice(0, -1);

        this.currentSequence = {
            display: displaySequence,
            answer,
            type: type.name,
            hint: type.hint(step)
        };

        this.renderSequence();
    }

    renderSequence() {
        this.elements.sequenceDisplay.innerHTML = this.currentSequence.display
            .map(num => `<div class="sequence-number">${num}</div>`)
            .join('');
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
        this.score += this.hintUsed ? 5 : 10;
        this.streak++;

        if (this.streak % 5 === 0) {
            this.level++;
        }

        this.updateStats();

        // Récompense
        if (this.streak % 3 === 0) {
            const credits = this.hintUsed ? 1 : 2;
            await this.addCredits(credits);
            Toast.success(`Bravo ! La réponse était ${this.currentSequence.answer} - Bonus : +${credits} 🪙`);
        } else {
            Toast.success(`Bravo ! La réponse était ${this.currentSequence.answer}`);
        }

        setTimeout(() => this.generateSequence(), 2000);
    }

    incorrectAnswer() {
        this.streak = 0;
        this.updateStats();

        Toast.error(`Incorrect. La réponse était ${this.currentSequence.answer}`);

        setTimeout(() => this.generateSequence(), 2500);
    }

    showHint() {
        if (this.hintUsed) return;

        this.hintUsed = true;
        this.elements.hintSection.style.display = 'block';
        this.elements.hintText.textContent = this.currentSequence.hint;
        Toast.hint(this.currentSequence.hint);
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
