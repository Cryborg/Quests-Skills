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
        this.obstacles = []; // Les obstacles sur la grille
        this.hintUsed = false;
        this.visitedCells = new Set(); // Cases uniques visitées
        this.visitedOrder = []; // Ordre des cases visitées (pour détecter les répétitions)
        this.minPathLength = 0; // Chemin le plus court
        this.maxPathLength = 0; // Chemin le plus long possible
        this.hasRepeatedCell = false; // Flag pour détecter si le joueur repasse sur une case
        this.repeatedPositions = []; // Positions où il y a eu répétition (pour affichage en rouge)
        this.currentDirection = 'down'; // Direction actuelle du sprite (par défaut face)
        this.playerSprites = {}; // Sprites du joueur
        this.spritesLoaded = false;
    }

    async init() {
        // Créer le header avec les essais restants
        PageHeader.render({
            icon: '🧭',
            title: 'Déplacement sur Quadrillage',
            subtitle: 'Programme le chemin pour atteindre la case cible !',
            actions: [
                {
                    icon: '⭐',
                    text: 'Noter ce jeu',
                    id: 'rate-game-btn-grid-navigation',
                    className: 'page-header-btn-secondary'
                }
            ],
            stats: [
                { label: 'Essais aujourd\'hui', id: 'attempts-remaining', value: '3' },
                { label: 'Score', id: 'score', value: '0' },
                { label: 'Bonnes réponses', id: 'correct-count', value: '0' },
                { label: 'Niveau', id: 'level', value: '1' }
            ],
            reward: {
                baseCredits: 4,
                bonusText: '+ bonus niveau'
            }
        });

        // Initialiser le compteur d'essais
        const remaining = await GameAttempts.initHeaderDisplay('grid-navigation', 3);

        if (remaining === 0) {
            Toast.warning('Plus d\'essais pour aujourd\'hui ! Reviens demain.');
            return;
        }

        // Initialiser le bouton de notation
        setTimeout(() => {
            if (typeof GameRatingModal !== 'undefined') {
                GameRatingModal.initHeaderButton('grid-navigation');
            }
        }, 100);

        this.cacheElements();
        this.attachEvents();
        this.setupCanvas();
        await this.loadSprites();
        this.generateChallenge();
    }

    async loadSprites() {
        const spriteNames = {
            up: 'player-back.png',
            down: 'player-front.png',
            left: 'player-left.png',
            right: 'player-right.png'
        };

        const loadPromises = Object.entries(spriteNames).map(([direction, filename]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.playerSprites[direction] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load sprite: ${filename}`);
                    resolve(); // Continue même si une image ne charge pas
                };
                img.src = `images/${filename}`;
            });
        });

        await Promise.all(loadPromises);
        this.spritesLoaded = Object.keys(this.playerSprites).length > 0;
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
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (!this.elements.validateBtn.disabled) {
                    this.executeProgram();
                }
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
        this.visitedCells = new Set();
        this.visitedOrder = [];
        this.visitedPositions = []; // Pour afficher le trail visuel
        this.repeatedPositions = [];
        this.hasRepeatedCell = false;
        this.elements.nextBtn.style.display = 'none';
        this.clearFeedback();

        // Distance minimale basée sur le niveau (3 à 7 cases)
        const minDistance = Math.min(3 + Math.floor(this.level / 3), 7);

        let validLevel = false;
        let attempts = 0;
        const maxAttempts = 50;

        // Générer un niveau valide avec pathfinding
        while (!validLevel && attempts < maxAttempts) {
            attempts++;

            // Position de départ aléatoire
            this.startPosition = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };

            // Position cible avec distance minimale
            do {
                this.targetPosition = {
                    x: Math.floor(Math.random() * this.gridSize),
                    y: Math.floor(Math.random() * this.gridSize)
                };
            } while (this.getManhattanDistance(this.startPosition, this.targetPosition) < minDistance);

            // Générer des obstacles
            this.generateObstacles();

            // Vérifier qu'un chemin existe avec A*
            const shortestPath = this.findPath(this.startPosition, this.targetPosition);
            if (shortestPath && shortestPath.length >= minDistance) {
                validLevel = true;
                this.minPathLength = shortestPath.length;

                // Calculer le chemin le plus long
                const longestPath = this.findLongestPath(this.startPosition, this.targetPosition);
                this.maxPathLength = longestPath ? longestPath.length : this.minPathLength;
            }
        }

        // Si pas de niveau valide après 50 tentatives, générer sans obstacles
        if (!validLevel) {
            this.obstacles = [];
            const shortestPath = this.findPath(this.startPosition, this.targetPosition);
            this.minPathLength = shortestPath ? shortestPath.length : 0;
            const longestPath = this.findLongestPath(this.startPosition, this.targetPosition);
            this.maxPathLength = longestPath ? longestPath.length : this.minPathLength;
        }

        this.currentPosition = { ...this.startPosition };

        // Afficher le programme vide et les stats du niveau
        this.renderInstructions();
        this.renderLevelStats();

        // Dessiner la grille
        this.drawGrid();

        // Activer les boutons
        this.elements.controlButtons.forEach(btn => btn.disabled = false);
        this.elements.validateBtn.disabled = false;
        this.elements.clearBtn.disabled = false;
    }

    getManhattanDistance(pos1, pos2) {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }

    clearFeedback() {
        // Réinitialiser le feedback visuel
        this.elements.movementInstructions.classList.remove('correct', 'incorrect');
        this.elements.instructions.classList.remove('correct', 'incorrect');
    }

    generateObstacles() {
        this.obstacles = [];

        // Nombre d'obstacles basé sur le niveau (minimum 3, max 8)
        const numObstacles = Math.min(3 + Math.floor(this.level / 2), 8);

        for (let i = 0; i < numObstacles; i++) {
            let obstacle;
            let attempts = 0;

            // Générer un obstacle qui n'est ni sur le départ ni sur la cible ni sur un autre obstacle
            do {
                obstacle = {
                    x: Math.floor(Math.random() * this.gridSize),
                    y: Math.floor(Math.random() * this.gridSize)
                };
                attempts++;

                // Éviter une boucle infinie si la grille est trop pleine
                if (attempts > 50) break;

            } while (
                (obstacle.x === this.startPosition.x && obstacle.y === this.startPosition.y) ||
                (obstacle.x === this.targetPosition.x && obstacle.y === this.targetPosition.y) ||
                this.obstacles.some(obs => obs.x === obstacle.x && obs.y === obstacle.y)
            );

            if (attempts <= 50) {
                this.obstacles.push(obstacle);
            }
        }
    }

    isObstacle(x, y) {
        return this.obstacles.some(obs => obs.x === x && obs.y === y);
    }

    // Algorithme pour trouver le chemin le plus long (DFS avec backtracking)
    findLongestPath(start, end) {
        const visited = new Set();
        const key = (pos) => `${pos.x},${pos.y}`;
        let longestPath = null;

        const dfs = (current, path) => {
            const currentKey = key(current);

            // Si on atteint la cible
            if (current.x === end.x && current.y === end.y) {
                if (!longestPath || path.length > longestPath.length) {
                    longestPath = [...path];
                }
                return;
            }

            // Marquer comme visité
            visited.add(currentKey);

            // Explorer les voisins
            const neighbors = [
                { x: current.x, y: current.y - 1 },
                { x: current.x, y: current.y + 1 },
                { x: current.x - 1, y: current.y },
                { x: current.x + 1, y: current.y }
            ];

            for (const neighbor of neighbors) {
                // Vérifier si valide
                if (neighbor.x < 0 || neighbor.x >= this.gridSize ||
                    neighbor.y < 0 || neighbor.y >= this.gridSize) {
                    continue;
                }

                // Vérifier si obstacle
                if (this.isObstacle(neighbor.x, neighbor.y)) {
                    continue;
                }

                // Vérifier si déjà visité
                const neighborKey = key(neighbor);
                if (visited.has(neighborKey)) {
                    continue;
                }

                // Récursion
                path.push(neighbor);
                dfs(neighbor, path);
                path.pop();
            }

            // Démarquer comme visité (backtracking)
            visited.delete(currentKey);
        };

        // Lancer la recherche
        dfs(start, [start]);
        return longestPath;
    }

    // Algorithme A* pour trouver un chemin
    findPath(start, end) {
        const openSet = [start];
        const closedSet = [];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const key = (pos) => `${pos.x},${pos.y}`;

        gScore.set(key(start), 0);
        fScore.set(key(start), this.getManhattanDistance(start, end));

        while (openSet.length > 0) {
            // Trouver le nœud avec le plus petit fScore
            let current = openSet[0];
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (fScore.get(key(openSet[i])) < fScore.get(key(current))) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }

            // Si on a atteint la cible
            if (current.x === end.x && current.y === end.y) {
                const path = [];
                let temp = current;
                while (cameFrom.has(key(temp))) {
                    path.unshift(temp);
                    temp = cameFrom.get(key(temp));
                }
                path.unshift(start);
                return path;
            }

            openSet.splice(currentIndex, 1);
            closedSet.push(current);

            // Vérifier les voisins (haut, bas, gauche, droite)
            const neighbors = [
                { x: current.x, y: current.y - 1 }, // haut
                { x: current.x, y: current.y + 1 }, // bas
                { x: current.x - 1, y: current.y }, // gauche
                { x: current.x + 1, y: current.y }  // droite
            ];

            for (const neighbor of neighbors) {
                // Vérifier si le voisin est valide
                if (neighbor.x < 0 || neighbor.x >= this.gridSize ||
                    neighbor.y < 0 || neighbor.y >= this.gridSize) {
                    continue;
                }

                // Vérifier si c'est un obstacle
                if (this.isObstacle(neighbor.x, neighbor.y)) {
                    continue;
                }

                // Vérifier si déjà dans closedSet
                if (closedSet.some(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
                    continue;
                }

                const tentativeGScore = gScore.get(key(current)) + 1;

                const neighborInOpenSet = openSet.find(pos => pos.x === neighbor.x && pos.y === neighbor.y);

                if (!neighborInOpenSet) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore.get(key(neighbor))) {
                    continue;
                }

                cameFrom.set(key(neighbor), current);
                gScore.set(key(neighbor), tentativeGScore);
                fScore.set(key(neighbor), tentativeGScore + this.getManhattanDistance(neighbor, end));
            }
        }

        return null; // Pas de chemin trouvé
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

    renderLevelStats() {
        const statsHtml = `
            <div class="level-stats">
                <div class="stat-item">
                    <span class="stat-label">🌟 Score à atteindre :</span>
                    <span class="stat-value">${this.maxPathLength} cases</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">⚠️ Pas de répétition !</span>
                </div>
            </div>
        `;

        // Insérer avant les instructions de mouvement
        const existingStats = document.querySelector('.level-stats');
        if (existingStats) {
            existingStats.remove();
        }
        this.elements.movementInstructions.insertAdjacentHTML('beforebegin', statsHtml);
    }

    renderInstructions() {
        const directionEmojis = {
            up: '⬆️',
            down: '⬇️',
            left: '⬅️',
            right: '➡️'
        };

        if (this.programmedMoves.length === 0) {
            this.elements.movementInstructions.innerHTML = '<p style="color: var(--text-secondary);">Programme ton chemin avec les flèches ci-dessous</p>';
        } else {
            this.elements.movementInstructions.innerHTML = this.programmedMoves
                .map((dir, index) => {
                    return `<div class="instruction-step">
                        ${directionEmojis[dir]}
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
        // Retourne true si le mouvement est valide, false si on tape un mur
        let hitWall = false;

        switch (direction) {
            case 'up':
                if (this.currentPosition.y === 0) {
                    hitWall = true;
                } else {
                    this.currentPosition.y--;
                    this.currentDirection = 'up';
                }
                break;
            case 'down':
                if (this.currentPosition.y === this.gridSize - 1) {
                    hitWall = true;
                } else {
                    this.currentPosition.y++;
                    this.currentDirection = 'down';
                }
                break;
            case 'left':
                if (this.currentPosition.x === 0) {
                    hitWall = true;
                } else {
                    this.currentPosition.x--;
                    this.currentDirection = 'left';
                }
                break;
            case 'right':
                if (this.currentPosition.x === this.gridSize - 1) {
                    hitWall = true;
                } else {
                    this.currentPosition.x++;
                    this.currentDirection = 'right';
                }
                break;
        }

        return !hitWall;
    }

    clearProgram() {
        this.programmedMoves = [];
        this.currentPosition = { ...this.startPosition };
        this.visitedPositions = []; // Effacer le trail
        this.renderInstructions();
        this.drawGrid();
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

        // Réinitialiser la position et les cases visitées
        this.currentPosition = { ...this.startPosition };
        this.visitedCells = new Set();
        this.visitedOrder = [];
        this.visitedPositions = [];
        this.hasRepeatedCell = false;

        // Ajouter la position de départ
        const key = (pos) => `${pos.x},${pos.y}`;
        const currentKey = key(this.currentPosition);
        this.visitedCells.add(currentKey);
        this.visitedOrder.push(currentKey);
        this.visitedPositions.push({ ...this.currentPosition });

        // Exécuter chaque mouvement avec animation
        let hitObstacle = false;
        for (let i = 0; i < this.programmedMoves.length; i++) {
            const validMove = await this.animateMove(this.programmedMoves[i]);

            // Vérifier si on a tapé un mur
            if (!validMove) {
                hitObstacle = true;
                Toast.error('💥 Collision avec un mur !');
                await new Promise(resolve => setTimeout(resolve, 500));
                break;
            }

            const cellKey = key(this.currentPosition);

            // Vérifier si on repasse sur une case déjà visitée
            if (this.visitedCells.has(cellKey)) {
                this.hasRepeatedCell = true;
                this.repeatedPositions.push({ ...this.currentPosition });
                // Ne pas arrêter, juste marquer la répétition
            }

            // Ajouter la case visitée
            this.visitedCells.add(cellKey);
            this.visitedOrder.push(cellKey);
            this.visitedPositions.push({ ...this.currentPosition });

            // Vérifier si on a heurté un obstacle
            if (this.isObstacle(this.currentPosition.x, this.currentPosition.y)) {
                hitObstacle = true;
                Toast.error('💥 Collision avec un obstacle !');
                await new Promise(resolve => setTimeout(resolve, 500));
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Vérifier le résultat
        if (hitObstacle) {
            this.incorrectAnswer();
        } else if (this.currentPosition.x === this.targetPosition.x &&
            this.currentPosition.y === this.targetPosition.y) {
            // Arrivé à destination
            if (this.hasRepeatedCell) {
                // Score minimal si répétition
                this.incorrectAnswer();
            } else {
                // Score normal
                this.correctAnswer();
            }
        } else {
            this.incorrectAnswer();
        }
    }

    async animateMove(direction) {
        const validMove = this.movePlayer(direction);
        this.drawGrid();
        return validMove;
    }

    async correctAnswer() {
        const uniqueCells = this.visitedCells.size;

        // Nouveau système de scoring : casesVisitées directement
        // Plus on visite de cases, plus on gagne de points !
        const earnedPoints = uniqueCells;

        this.score += earnedPoints;
        this.correctCount++;
        this.level++;

        this.updateStats();

        // Message de succès avec statistiques
        let message = `Bravo ! ${uniqueCells}/${this.maxPathLength} cases visitées (+${earnedPoints} pts)`;

        // Évaluation
        if (uniqueCells === this.maxPathLength) {
            message = '🌟 SCORE PARFAIT ! Toutes les cases visitées ! ' + message;
        } else if (uniqueCells >= this.maxPathLength - 2) {
            message = '🎯 Excellent ! ' + message;
        } else if (uniqueCells >= this.maxPathLength - 5) {
            message = '👍 Bien ! ' + message;
        }

        // Récompense en crédits toutes les 3 réussites
        if (this.correctCount % 3 === 0) {
            const credits = 2;
            await this.addCredits(credits);
            message += ` +${credits} 🪙`;
        }

        Toast.success(message);

        this.elements.controlButtons.forEach(btn => btn.disabled = true);
        this.elements.validateBtn.disabled = true;
        this.elements.clearBtn.disabled = true;

        // Vérifier si c'est la fin du jeu (niveau 10 terminé)
        if (this.level > 10) {
            setTimeout(() => {
                this.showGameEnd();
            }, 2000);
        } else {
            // Lancer automatiquement le niveau suivant après 2 secondes
            setTimeout(() => {
                this.generateChallenge();
            }, 2000);
        }
    }

    async incorrectAnswer() {
        // Si le joueur a repassé sur une case mais est arrivé à destination, il gagne 1 point
        if (this.hasRepeatedCell &&
            this.currentPosition.x === this.targetPosition.x &&
            this.currentPosition.y === this.targetPosition.y) {

            const minPoints = 1;
            this.score += minPoints;
            this.correctCount++;
            this.level++;

            this.updateStats();

            Toast.warning(`⚠️ Cases répétées ! Score minimum : +${minPoints} pt`);

            this.elements.controlButtons.forEach(btn => btn.disabled = true);
            this.elements.validateBtn.disabled = true;
            this.elements.clearBtn.disabled = true;

            // Vérifier si c'est la fin du jeu (niveau 10 terminé)
            if (this.level > 10) {
                setTimeout(() => {
                    this.showGameEnd();
                }, 2000);
            } else {
                setTimeout(() => {
                    this.generateChallenge();
                }, 2000);
            }
            return;
        }

        // Sinon, échec total - enregistrer la tentative ratée
        await GameAttempts.recordAttempt('grid-navigation', {
            score: this.score,
            completed: false
        });

        // Mettre à jour l'affichage des essais restants
        const remaining = await GameAttempts.initHeaderDisplay('grid-navigation', 3);

        if (remaining === 0) {
            Toast.error('Plus d\'essais pour aujourd\'hui ! Reviens demain.');
            this.showGameEnd();
            return;
        }

        Toast.error('Tu n\'es pas arrivé à la bonne case ! Réessaye.');

        this.elements.controlButtons.forEach(btn => btn.disabled = true);
        this.elements.validateBtn.disabled = true;
        this.elements.clearBtn.disabled = true;

        // Auto-restart après 2 secondes
        setTimeout(() => {
            this.programmedMoves = [];
            this.currentPosition = { ...this.startPosition };
            this.visitedPositions = []; // Effacer le trail
            this.renderInstructions();
            this.drawGrid();

            this.elements.controlButtons.forEach(btn => btn.disabled = false);
            this.elements.validateBtn.disabled = false;
            this.elements.clearBtn.disabled = false;
        }, 2000);
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

        // Dessiner les obstacles
        ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
        this.obstacles.forEach(obstacle => {
            ctx.fillRect(
                obstacle.x * size + 5,
                obstacle.y * size + 5,
                size - 10,
                size - 10
            );

            // Dessiner une croix sur l'obstacle
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(obstacle.x * size + 15, obstacle.y * size + 15);
            ctx.lineTo(obstacle.x * size + size - 15, obstacle.y * size + size - 15);
            ctx.moveTo(obstacle.x * size + size - 15, obstacle.y * size + 15);
            ctx.lineTo(obstacle.x * size + 15, obstacle.y * size + size - 15);
            ctx.stroke();
        });

        // Dessiner le trail (cases visitées)
        ctx.fillStyle = 'rgba(102, 126, 234, 0.5)';
        this.visitedPositions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(
                pos.x * size + size / 2,
                pos.y * size + size / 2,
                8,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });

        // Dessiner les répétitions en rouge (étoile d'explosion)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.strokeStyle = 'rgba(220, 38, 38, 1)';
        ctx.lineWidth = 2;
        this.repeatedPositions.forEach(pos => {
            const cx = pos.x * size + size / 2;
            const cy = pos.y * size + size / 2;
            const outerRadius = 12;
            const innerRadius = 5;
            const spikes = 8;

            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI / spikes) * i - Math.PI / 2;
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // Dessiner le joueur (par-dessus le trail)
        if (this.spritesLoaded && this.playerSprites[this.currentDirection]) {
            const sprite = this.playerSprites[this.currentDirection];
            const spriteSize = size * 0.8; // 80% de la taille de la case
            const offsetX = (size - spriteSize) / 2;
            const offsetY = (size - spriteSize) / 2;

            ctx.drawImage(
                sprite,
                this.currentPosition.x * size + offsetX,
                this.currentPosition.y * size + offsetY,
                spriteSize,
                spriteSize
            );
        } else {
            // Fallback: cercle bleu si les sprites ne sont pas chargés
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
        }

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

    showGameEnd() {
        // Créer un écran de fin de jeu
        const gameArea = document.querySelector('.game-area');
        gameArea.innerHTML = `
            <div class="game-end-screen">
                <h2 class="game-end-title">🎉 PARTIE TERMINÉE ! 🎉</h2>
                <div class="game-end-stats">
                    <div class="end-stat-card">
                        <div class="end-stat-label">Score final</div>
                        <div class="end-stat-value">${this.score}</div>
                    </div>
                    <div class="end-stat-card">
                        <div class="end-stat-label">Puzzles résolus</div>
                        <div class="end-stat-value">${this.correctCount}</div>
                    </div>
                    <div class="end-stat-card">
                        <div class="end-stat-label">Niveau atteint</div>
                        <div class="end-stat-value">${this.level}</div>
                    </div>
                </div>
                <p class="game-end-message">
                    ${this.score >= 200 ? '🌟 Performance légendaire !' :
                      this.score >= 150 ? '🎯 Excellent score !' :
                      this.score >= 100 ? '👍 Bon travail !' :
                      '💪 Continue de t\'entraîner !'}
                </p>
                <button id="restart-game-btn" class="btn-primary">🔄 Rejouer</button>
            </div>
        `;

        // Gérer le bouton rejouer
        document.getElementById('restart-game-btn').addEventListener('click', () => {
            location.reload();
        });
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
