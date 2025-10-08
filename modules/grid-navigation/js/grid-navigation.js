// Jeu de Déplacement sur Quadrillage
class GridNavigationGame {
    constructor() {
        this.score = 0;
        this.correctCount = 0;
        this.level = 1;
        this.gridSize = 5;
        this.cellSize = 80;
        this.currentPosition = { x: 0, y: 0 };
        this.targetPosition = { x: 0, y: 0 };
        this.startPosition = { x: 0, y: 0 };
        this.programmedMoves = []; // Les mouvements programmés par le joueur
        this.hintUsed = false;
    }

    async init() {
        // Créer le header avec les essais restants
        PageHeader.render({
            icon: '🧭',
            title: 'Déplacement sur Quadrillage',
            subtitle: 'Programme le chemin pour atteindre la case cible !',
            actions: [],
            stats: [
                { label: 'Essais aujourd\'hui', id: 'attempts-remaining', value: '3' },
                { label: 'Score', id: 'score', value: '0' },
                { label: 'Bonnes réponses', id: 'correct-count', value: '0' },
                { label: 'Niveau', id: 'level', value: '1' }
            ]
        });

        // Initialiser le compteur d'essais
        const remaining = await GameAttempts.initHeaderDisplay('grid-navigation', 3);

        if (remaining === 0) {
            Toast.warning('Plus d\'essais pour aujourd\'hui ! Reviens demain.');
            return;
        }

        this.cacheElements();
        this.attachEvents();
        this.setupCanvas();
        this.generateChallenge();
    }

    cacheElements() {
        this.elements = {
            canvas: document.getElementById('grid-canvas'),
            instructions: document.getElementById('instructions'),
            movementInstructions: document.getElementById('movement-instructions'),
            controlButtons: document.querySelectorAll('.control-btn'),
            clearBtn: document.getElementById('clear-btn'),
            validateBtn: document.getElementById('validate-btn'),
            hintBtn: document.getElementById('hint-btn'),
            nextBtn: document.getElementById('next-btn'),
            score: document.getElementById('score'),
            correctCount: document.getElementById('correct-count'),
            level: document.getElementById('level')
        };

        this.ctx = this.elements.canvas.getContext('2d');
    }

    attachEvents() {
        this.elements.controlButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction;
                this.handleMove(direction);
            });
        });

        this.elements.clearBtn.addEventListener('click', () => this.clearProgram());
        this.elements.validateBtn.addEventListener('click', () => this.executeProgram());
        this.elements.hintBtn.addEventListener('click', () => this.showHint());
        this.elements.nextBtn.addEventListener('click', () => this.generateChallenge());

        // Clavier
        document.addEventListener('keydown', (e) => {
            const keyMap = {
                'ArrowUp': 'up',
                'ArrowDown': 'down',
                'ArrowLeft': 'left',
                'ArrowRight': 'right'
            };

            if (keyMap[e.key]) {
                e.preventDefault();
                this.handleMove(keyMap[e.key]);
            }
        });
    }

    setupCanvas() {
        const totalSize = this.gridSize * this.cellSize;
        this.elements.canvas.width = totalSize;
        this.elements.canvas.height = totalSize;
    }

    generateChallenge() {
        this.hintUsed = false;
        this.programmedMoves = [];
        this.elements.nextBtn.style.display = 'none';
        this.clearFeedback();

        // Position de départ aléatoire
        this.startPosition = {
            x: Math.floor(Math.random() * this.gridSize),
            y: Math.floor(Math.random() * this.gridSize)
        };

        // Position cible aléatoire (différente du départ)
        do {
            this.targetPosition = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (this.targetPosition.x === this.startPosition.x && this.targetPosition.y === this.startPosition.y);

        this.currentPosition = { ...this.startPosition };

        // Afficher le programme vide
        this.renderInstructions();

        // Dessiner la grille
        this.drawGrid();

        // Activer les boutons
        this.elements.controlButtons.forEach(btn => btn.disabled = false);
        this.elements.validateBtn.disabled = false;
        this.elements.clearBtn.disabled = false;
    }

    clearFeedback() {
        // Réinitialiser le feedback visuel
        this.elements.movementInstructions.classList.remove('correct', 'incorrect');
        this.elements.instructions.classList.remove('correct', 'incorrect');
    }

    generateMovementSequence(numMoves) {
        const directions = ['up', 'down', 'left', 'right'];
        const movements = [];
        let lastDirection = null;

        for (let i = 0; i < numMoves; i++) {
            // Éviter deux mouvements opposés consécutifs
            let availableDirections = directions.filter(dir => {
                if (!lastDirection) return true;
                if (lastDirection === 'up' && dir === 'down') return false;
                if (lastDirection === 'down' && dir === 'up') return false;
                if (lastDirection === 'left' && dir === 'right') return false;
                if (lastDirection === 'right' && dir === 'left') return false;
                return true;
            });

            const direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
            movements.push(direction);
            lastDirection = direction;
        }

        return movements;
    }

    calculateTargetPosition(start, movements) {
        let pos = { ...start };

        for (const move of movements) {
            switch (move) {
                case 'up':
                    pos.y = Math.max(0, pos.y - 1);
                    break;
                case 'down':
                    pos.y = Math.min(this.gridSize - 1, pos.y + 1);
                    break;
                case 'left':
                    pos.x = Math.max(0, pos.x - 1);
                    break;
                case 'right':
                    pos.x = Math.min(this.gridSize - 1, pos.x + 1);
                    break;
            }
        }

        return pos;
    }

    renderInstructions() {
        const directionEmojis = {
            up: '⬆️',
            down: '⬇️',
            left: '⬅️',
            right: '➡️'
        };

        const directionNames = {
            up: 'Haut',
            down: 'Bas',
            left: 'Gauche',
            right: 'Droite'
        };

        if (this.programmedMoves.length === 0) {
            this.elements.movementInstructions.innerHTML = '<p style="color: var(--text-secondary);">Programme ton chemin avec les flèches ci-dessous</p>';
        } else {
            this.elements.movementInstructions.innerHTML = this.programmedMoves
                .map((dir, index) => {
                    return `<div class="instruction-step">
                        ${directionEmojis[dir]} ${directionNames[dir]}
                    </div>`;
                })
                .join('');
        }
    }

    handleMove(direction) {
        // Ajouter le mouvement au programme
        this.programmedMoves.push(direction);
        this.renderInstructions();
    }

    movePlayer(direction) {
        switch (direction) {
            case 'up':
                this.currentPosition.y = Math.max(0, this.currentPosition.y - 1);
                break;
            case 'down':
                this.currentPosition.y = Math.min(this.gridSize - 1, this.currentPosition.y + 1);
                break;
            case 'left':
                this.currentPosition.x = Math.max(0, this.currentPosition.x - 1);
                break;
            case 'right':
                this.currentPosition.x = Math.min(this.gridSize - 1, this.currentPosition.x + 1);
                break;
        }
    }

    clearProgram() {
        this.programmedMoves = [];
        this.renderInstructions();
    }

    async executeProgram() {
        if (this.programmedMoves.length === 0) {
            Toast.warning('Programme vide ! Ajoute des mouvements.');
            return;
        }

        // Désactiver les boutons pendant l'exécution
        this.elements.controlButtons.forEach(btn => btn.disabled = true);
        this.elements.validateBtn.disabled = true;
        this.elements.clearBtn.disabled = true;

        // Réinitialiser la position
        this.currentPosition = { ...this.startPosition };

        // Exécuter chaque mouvement avec animation
        for (let i = 0; i < this.programmedMoves.length; i++) {
            await this.animateMove(this.programmedMoves[i]);
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Vérifier si on est arrivé
        if (this.currentPosition.x === this.targetPosition.x &&
            this.currentPosition.y === this.targetPosition.y) {
            this.correctAnswer();
        } else {
            this.incorrectAnswer();
        }
    }

    async animateMove(direction) {
        this.movePlayer(direction);
        this.drawGrid();
    }

    async correctAnswer() {
        this.score += this.hintUsed ? 5 : 10;
        this.correctCount++;

        if (this.correctCount % 5 === 0) {
            this.level++;
        }

        this.updateStats();

        // Message de succès
        let message = 'Bravo ! Tu as atteint la case cible !';

        // Récompense
        if (this.correctCount % 3 === 0) {
            const credits = this.hintUsed ? 1 : 2;
            await this.addCredits(credits);
            message += ` +${credits} 🪙`;
        }

        Toast.success(message);

        this.elements.controlButtons.forEach(btn => btn.disabled = true);
        this.elements.validateBtn.disabled = true;
        this.elements.clearBtn.disabled = true;
        this.elements.nextBtn.style.display = 'block';
    }

    incorrectAnswer() {
        Toast.error('Tu n\'es pas arrivé à la bonne case ! Réessaye.');

        // Réinitialiser le programme
        this.programmedMoves = [];
        this.renderInstructions();

        // Réactiver les boutons pour réessayer
        this.elements.controlButtons.forEach(btn => btn.disabled = false);
        this.elements.validateBtn.disabled = false;
        this.elements.clearBtn.disabled = false;
    }

    showHint() {
        if (this.hintUsed) return;

        this.hintUsed = true;

        // Calculer le chemin le plus court
        const dx = this.targetPosition.x - this.startPosition.x;
        const dy = this.targetPosition.y - this.startPosition.y;

        let hint = '💡 Indice : ';
        if (dx > 0) hint += `${Math.abs(dx)} fois à droite `;
        else if (dx < 0) hint += `${Math.abs(dx)} fois à gauche `;

        if (dy > 0) hint += `${Math.abs(dy)} fois en bas`;
        else if (dy < 0) hint += `${Math.abs(dy)} fois en haut`;

        Toast.hint(hint);
    }

    drawGrid() {
        const ctx = this.ctx;
        const size = this.cellSize;

        // Effacer le canvas
        ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);

        // Dessiner les cellules
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                // Bordure de cellule
                ctx.strokeStyle = '#667eea';
                ctx.lineWidth = 2;
                ctx.strokeRect(x * size, y * size, size, size);

                // Remplissage
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
            }
        }

        // Dessiner la case de départ
        ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.fillRect(
            this.startPosition.x * size + 5,
            this.startPosition.y * size + 5,
            size - 10,
            size - 10
        );

        // Dessiner la case cible
        ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.fillRect(
            this.targetPosition.x * size + 5,
            this.targetPosition.y * size + 5,
            size - 10,
            size - 10
        );

        // Dessiner le joueur
        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(
            this.currentPosition.x * size + size / 2,
            this.currentPosition.y * size + size / 2,
            size / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Dessiner un symbole sur la cible
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            '🎯',
            this.targetPosition.x * size + size / 2,
            this.targetPosition.y * size + size / 2
        );
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
const gridGame = new GridNavigationGame();
