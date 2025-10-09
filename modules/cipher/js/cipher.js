// Jeu de Codage et Décodage
class CipherGame {
    constructor() {
        this.score = 0;
        this.correctCount = 0;
        this.level = 1;
        this.mode = 'encode'; // 'encode' ou 'decode'
        this.currentCipher = 'caesar';
        this.currentMessage = '';
        this.currentAnswer = '';
        this.hintUsed = false;
        this.caesarShift = 0;
        this.substitutionMap = {};

        // Messages de différents niveaux
        this.messages = {
            easy: ['BONJOUR', 'MERCI', 'SALUT', 'BRAVO', 'SUPER', 'COOL'],
            medium: ['CHATEAU', 'JARDIN', 'SOLEIL', 'FLEUR', 'OISEAU', 'RIVIERE'],
            hard: ['AVENTURE', 'MYSTERE', 'ENIGME', 'TRESOR', 'DECOUVERTE']
        };

        // Définition des ciphers
        this.ciphers = {
            caesar: {
                name: 'Chiffre de César',
                description: 'Chaque lettre est décalée de N positions dans l\'alphabet',
                encode: (text, shift) => this.caesarCipher(text, shift),
                decode: (text, shift) => this.caesarCipher(text, -shift)
            },
            reverse: {
                name: 'Inversé',
                description: 'Le texte est simplement inversé de droite à gauche',
                encode: (text) => text.split('').reverse().join(''),
                decode: (text) => text.split('').reverse().join('')
            },
            atbash: {
                name: 'Atbash',
                description: 'A devient Z, B devient Y, C devient X, etc.',
                encode: (text) => this.atbashCipher(text),
                decode: (text) => this.atbashCipher(text)
            },
            substitution: {
                name: 'Substitution',
                description: 'Chaque lettre est remplacée par une autre lettre aléatoire',
                encode: (text) => this.substitutionCipher(text, this.substitutionMap),
                decode: (text) => this.substitutionCipher(text, this.reverseMap(this.substitutionMap))
            }
        };
    }

    async init() {
        // Créer le header
        PageHeader.render({
            icon: '🔐',
            title: 'Codage et Décodage',
            subtitle: 'Apprends les techniques de cryptographie !',
            actions: [],
            stats: [
                { label: 'Essais aujourd\'hui', id: 'attempts-remaining', value: '3' },
                { label: 'Score', id: 'score', value: '0' },
                { label: 'Bonnes réponses', id: 'correct-count', value: '0' },
                { label: 'Niveau', id: 'level', value: '1' }
            ]
        });

        const remaining = await GameAttempts.initHeaderDisplay('cipher', 3);
        if (remaining === 0) {
            Toast.warning('Plus d\'essais pour aujourd\'hui ! Reviens demain.');
            return;
        }

        this.cacheElements();
        this.attachEvents();
        this.generateQuestion();
    }

    cacheElements() {
        this.elements = {
            cipherBtns: document.querySelectorAll('.cipher-btn'),
            cipherExplanation: document.getElementById('cipher-explanation'),
            messageLabel: document.getElementById('message-label'),
            originalMessage: document.getElementById('original-message'),
            answerInput: document.getElementById('answer-input'),
            validateBtn: document.getElementById('validate-btn'),
            cipherHint: document.getElementById('cipher-hint'),
            hintBtn: document.getElementById('hint-btn'),
            nextBtn: document.getElementById('next-btn'),
            score: document.getElementById('score'),
            correctCount: document.getElementById('correct-count'),
            level: document.getElementById('level')
        };
    }

    attachEvents() {
        // Cipher buttons
        this.elements.cipherBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentCipher = btn.dataset.cipher;
                this.elements.cipherBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.generateQuestion();
            });
        });

        // Actions
        this.elements.validateBtn.addEventListener('click', () => this.validateAnswer());
        this.elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.validateAnswer();
        });
        this.elements.hintBtn.addEventListener('click', () => this.showHint());
        this.elements.nextBtn.addEventListener('click', () => this.generateQuestion());
    }

    switchMode(mode) {
        this.mode = mode;
        this.generateQuestion();
    }

    generateQuestion() {
        this.hintUsed = false;
        this.elements.answerInput.value = '';
        this.elements.answerInput.focus();
        this.elements.cipherHint.style.display = 'none';

        // Choisir un message selon le niveau
        let messagePool;
        if (this.level <= 3) {
            messagePool = this.messages.easy;
        } else if (this.level <= 6) {
            messagePool = this.messages.medium;
        } else {
            messagePool = this.messages.hard;
        }

        const originalMessage = messagePool[Math.floor(Math.random() * messagePool.length)];

        // Générer les paramètres du cipher
        if (this.currentCipher === 'caesar') {
            // Décalage entre 1 et 6, direction aléatoire (gauche = négatif, droite = positif)
            const shift = Math.floor(Math.random() * 6) + 1;
            this.caesarShift = Math.random() < 0.5 ? shift : -shift;
            this.caesarDirection = this.caesarShift > 0 ? 'DROITE' : 'GAUCHE';
        } else if (this.currentCipher === 'substitution') {
            this.substitutionMap = this.generateSubstitutionMap();
        }

        // Toujours en mode décodage (sauf pour les ciphers simples)
        this.currentAnswer = originalMessage;
        this.currentMessage = this.ciphers[this.currentCipher].encode(originalMessage, this.caesarShift);
        this.elements.messageLabel.textContent = 'Message à décoder :';

        this.elements.originalMessage.textContent = this.currentMessage;
        this.renderCipherExplanation();
    }

    renderCipherExplanation() {
        const cipher = this.ciphers[this.currentCipher];
        let description = cipher.description;

        if (this.currentCipher === 'caesar') {
            description += ` - Décalage de ${Math.abs(this.caesarShift)} vers la ${this.caesarDirection}`;
        }

        this.elements.cipherExplanation.innerHTML = `
            <h3 class="cipher-name">${cipher.name}</h3>
            <p class="cipher-description">${description}</p>
        `;
    }

    caesarCipher(text, shift) {
        return text.split('').map(char => {
            if (char >= 'A' && char <= 'Z') {
                const code = ((char.charCodeAt(0) - 65 + shift + 26) % 26) + 65;
                return String.fromCharCode(code);
            }
            return char;
        }).join('');
    }

    atbashCipher(text) {
        return text.split('').map(char => {
            if (char >= 'A' && char <= 'Z') {
                return String.fromCharCode(90 - (char.charCodeAt(0) - 65));
            }
            return char;
        }).join('');
    }

    generateSubstitutionMap() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const shuffled = [...alphabet].sort(() => Math.random() - 0.5);

        const map = {};
        for (let i = 0; i < alphabet.length; i++) {
            map[alphabet[i]] = shuffled[i];
        }
        return map;
    }

    substitutionCipher(text, map) {
        return text.split('').map(char => map[char] || char).join('');
    }

    reverseMap(map) {
        const reversed = {};
        for (const [key, value] of Object.entries(map)) {
            reversed[value] = key;
        }
        return reversed;
    }

    validateAnswer() {
        const userAnswer = this.elements.answerInput.value.toUpperCase().trim();

        if (userAnswer === '') {
            Toast.warning('Entre une réponse !');
            return;
        }

        if (userAnswer === this.currentAnswer) {
            this.correctAnswer();
        } else {
            this.incorrectAnswer();
        }
    }

    async correctAnswer() {
        this.score += this.hintUsed ? 5 : 10;
        this.correctCount++;

        if (this.correctCount % 5 === 0) {
            this.level++;
        }

        this.updateStats();

        let message = `Bravo ! La réponse était : ${this.currentAnswer}`;

        // Récompense
        if (this.correctCount % 3 === 0) {
            const credits = this.hintUsed ? 1 : 2;
            await this.addCredits(credits);
            message += ` +${credits} 🪙`;
        }

        Toast.success(message);
    }

    async incorrectAnswer() {
        // Enregistrer la tentative ratée
        await GameAttempts.recordAttempt('cipher', {
            score: this.score,
            completed: false
        });

        // Mettre à jour l'affichage des essais restants
        const remaining = await GameAttempts.initHeaderDisplay('cipher', 3);

        if (remaining === 0) {
            Toast.error(`Incorrect. La bonne réponse était : ${this.currentAnswer}. Plus d'essais pour aujourd'hui !`);

            // Désactiver les contrôles
            this.elements.answerInput.disabled = true;
            this.elements.validateBtn.disabled = true;
            this.elements.hintBtn.disabled = true;
            this.elements.cipherBtns.forEach(btn => btn.disabled = true);

            setTimeout(() => {
                Toast.info('Reviens demain pour un nouveau défi !');
            }, 3000);
            return;
        }

        Toast.error(`Incorrect. La bonne réponse était : ${this.currentAnswer}`);
    }

    showHint() {
        if (this.hintUsed) return;

        this.hintUsed = true;
        this.elements.cipherHint.style.display = 'block';

        if (this.currentCipher === 'caesar') {
            this.showCaesarHint();
        } else if (this.currentCipher === 'atbash') {
            this.showAtbashHint();
        } else if (this.currentCipher === 'substitution') {
            this.showSubstitutionHint();
        } else if (this.currentCipher === 'reverse') {
            Toast.hint('Lis le message de droite à gauche !');
            this.elements.cipherHint.style.display = 'none';
        }
    }

    showCaesarHint() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const shifted = this.caesarCipher(alphabet, this.mode === 'encode' ? this.caesarShift : -this.caesarShift);

        this.elements.cipherHint.innerHTML = `
            <h4 class="hint-title">Table de correspondance :</h4>
            <div class="alphabet-display">
                <div class="alphabet-row">
                    <span class="alphabet-label">Original :</span>
                    <span class="alphabet-letters">${alphabet.split('').join(' ')}</span>
                </div>
                <div class="alphabet-row">
                    <span class="alphabet-label">Codé :</span>
                    <span class="alphabet-letters">${shifted.split('').join(' ')}</span>
                </div>
            </div>
        `;
    }

    showAtbashHint() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const atbash = this.atbashCipher(alphabet);

        this.elements.cipherHint.innerHTML = `
            <h4 class="hint-title">Table de correspondance :</h4>
            <div class="alphabet-display">
                <div class="alphabet-row">
                    <span class="alphabet-label">Original :</span>
                    <span class="alphabet-letters">${alphabet.split('').join(' ')}</span>
                </div>
                <div class="alphabet-row">
                    <span class="alphabet-label">Codé :</span>
                    <span class="alphabet-letters">${atbash.split('').join(' ')}</span>
                </div>
            </div>
        `;
    }

    showSubstitutionHint() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const map = this.mode === 'encode' ? this.substitutionMap : this.reverseMap(this.substitutionMap);
        const substituted = alphabet.split('').map(c => map[c]).join(' ');

        this.elements.cipherHint.innerHTML = `
            <h4 class="hint-title">Table de correspondance :</h4>
            <div class="alphabet-display">
                <div class="alphabet-row">
                    <span class="alphabet-label">Original :</span>
                    <span class="alphabet-letters">${alphabet.split('').join(' ')}</span>
                </div>
                <div class="alphabet-row">
                    <span class="alphabet-label">Codé :</span>
                    <span class="alphabet-letters">${substituted}</span>
                </div>
            </div>
        `;
    }


    updateStats() {
        this.elements.score.textContent = this.score;
        this.elements.correctCount.textContent = this.correctCount;
        this.elements.level.textContent = this.level;
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
const cipherGame = new CipherGame();
