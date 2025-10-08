// Jeu de Sudoku Simple (4x4 et 6x6)
class SudokuGame {
    constructor() {
        this.completedCount = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.difficulty = 'easy'; // 'easy' = 4x4, 'medium' = 6x6
        this.gridSize = 4;
        this.blockRows = 2; // Pour 4x4, blocs de 2x2
        this.blockCols = 2;
        this.grid = [];
        this.solution = [];
        this.selectedCell = null;
        this.hintsUsed = 0;
        this.sessionManager = new GameSessionManager('sudoku');
    }

    async init() {
        // Créer le header avec les stats
        PageHeader.render({
            icon: '🧩',
            title: 'Sudoku Simple',
            subtitle: 'Remplis la grille avec les bons chiffres !',
            actions: [],
            stats: [
                { label: 'Essais aujourd\'hui', id: 'attempts-remaining', value: '3' },
                { label: 'Réussis', id: 'completed-count', value: '0' },
                { label: 'Temps', id: 'timer', value: '00:00' },
                { label: 'Erreurs', id: 'errors', value: '0' }
            ]
        });

        // Initialiser le compteur d'essais
        const remaining = await GameAttempts.initHeaderDisplay('sudoku', 3);

        if (remaining === 0) {
            Toast.warning('Plus d\'essais pour aujourd\'hui ! Reviens demain.');
            return;
        }

        this.cacheElements();
        this.attachEvents();
        await this.sessionManager.init();
        this.newGame();
    }

    cacheElements() {
        this.elements = {
            difficultyBtns: document.querySelectorAll('.difficulty-btn'),
            sudokuGrid: document.getElementById('sudoku-grid'),
            numberPad: document.getElementById('number-pad'),
            hintBtn: document.getElementById('hint-btn'),
            checkBtn: document.getElementById('check-btn'),
            newGameBtn: document.getElementById('new-game-btn')
        };
    }

    attachEvents() {
        // Difficulté
        this.elements.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.dataset.difficulty;
                this.setDifficulty(difficulty);
            });
        });

        // Actions
        this.elements.hintBtn.addEventListener('click', () => this.showHint());
        this.elements.checkBtn.addEventListener('click', () => this.checkSolution());
        this.elements.newGameBtn.addEventListener('click', () => this.newGame());

        // Clavier
        document.addEventListener('keydown', (e) => {
            if (this.selectedCell !== null) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= this.gridSize) {
                    this.placeNumber(num);
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                    this.eraseCell();
                }
            }
        });
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;

        // Mettre à jour les boutons
        this.elements.difficultyBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });

        if (difficulty === 'easy') {
            this.gridSize = 4;
            this.blockRows = 2;
            this.blockCols = 2;
        } else {
            this.gridSize = 6;
            this.blockRows = 2;
            this.blockCols = 3;
        }

        this.newGame();
    }

    newGame() {
        this.hintsUsed = 0;
        this.selectedCell = null;
        this.initialCells = null; // Réinitialiser les cellules initiales
        this.sessionManager.resetErrors();
        this.updateStats();

        // Générer une grille
        this.generateSudoku();
        this.renderGrid();
        this.renderNumberPad();

        // Démarrer le timer
        this.stopTimer();
        this.timer = 0;
        this.startTimer();
    }

    generateSudoku() {
        // Créer une grille vide
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
        this.solution = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));

        // Générer une solution complète valide avec backtracking
        this.solveSudoku(this.solution);

        // Copier la solution dans la grille
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = this.solution[i][j];
            }
        }

        // Retirer des cases selon la difficulté
        // 4x4 : 8 cases (sur 16) = 50% de la grille vide
        // 6x6 : 12 cases (sur 36) = ~33% de la grille vide
        const cellsToRemove = this.difficulty === 'easy' ? 8 : 12;
        this.removeCells(cellsToRemove);
    }

    // Résoudre le sudoku avec backtracking (utilisé pour générer une grille valide)
    solveSudoku(grid) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (grid[row][col] === 0) {
                    // Essayer les nombres dans un ordre aléatoire pour générer des grilles variées
                    const numbers = this.shuffleArray([...Array(this.gridSize).keys()].map(x => x + 1));

                    for (const num of numbers) {
                        if (this.isValidPlacement(grid, row, col, num)) {
                            grid[row][col] = num;

                            if (this.solveSudoku(grid)) {
                                return true;
                            }

                            grid[row][col] = 0;
                        }
                    }

                    return false;
                }
            }
        }

        return true;
    }


    isValidPlacement(grid, row, col, num) {
        // Vérifier la ligne
        for (let x = 0; x < this.gridSize; x++) {
            if (grid[row][x] === num) return false;
        }

        // Vérifier la colonne
        for (let x = 0; x < this.gridSize; x++) {
            if (grid[x][col] === num) return false;
        }

        // Vérifier le bloc
        const startRow = Math.floor(row / this.blockRows) * this.blockRows;
        const startCol = Math.floor(col / this.blockCols) * this.blockCols;

        for (let i = 0; i < this.blockRows; i++) {
            for (let j = 0; j < this.blockCols; j++) {
                if (grid[startRow + i][startCol + j] === num) return false;
            }
        }

        return true;
    }

    removeCells(count) {
        let removed = 0;
        const cells = [];

        // Créer une liste de toutes les cellules
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                cells.push({ row: i, col: j });
            }
        }

        // Mélanger
        this.shuffleArray(cells);

        // Retirer des cellules
        for (const cell of cells) {
            if (removed >= count) break;
            this.grid[cell.row][cell.col] = 0;
            removed++;
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    renderGrid() {
        this.elements.sudokuGrid.innerHTML = '';
        this.elements.sudokuGrid.className = `sudoku-grid size-${this.gridSize}`;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const value = this.grid[row][col];
                const isFixed = this.solution[row][col] !== 0 && value !== 0 && this.isInitialCell(row, col);

                if (value !== 0) {
                    cell.textContent = value;
                    if (isFixed) {
                        cell.classList.add('fixed');
                    }
                }

                cell.addEventListener('click', () => this.selectCell(row, col, isFixed));

                this.elements.sudokuGrid.appendChild(cell);
            }
        }
    }

    isInitialCell(row, col) {
        // Une cellule initiale est une cellule qui était remplie dès le début
        // On doit tracker ça différemment... Utilisons un Set
        if (!this.initialCells) {
            this.initialCells = new Set();
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    if (this.grid[i][j] !== 0) {
                        this.initialCells.add(`${i},${j}`);
                    }
                }
            }
        }
        return this.initialCells.has(`${row},${col}`);
    }

    renderNumberPad() {
        this.elements.numberPad.innerHTML = '';

        for (let i = 1; i <= this.gridSize; i++) {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.textContent = i;
            btn.addEventListener('click', () => this.placeNumber(i));
            this.elements.numberPad.appendChild(btn);
        }

        // Bouton effacer
        const eraseBtn = document.createElement('button');
        eraseBtn.className = 'number-btn erase';
        eraseBtn.textContent = '✖';
        eraseBtn.addEventListener('click', () => this.eraseCell());
        this.elements.numberPad.appendChild(eraseBtn);
    }

    selectCell(row, col, isFixed) {
        if (isFixed) return;

        this.selectedCell = { row, col };

        // Mettre à jour visuellement
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('selected');
        });

        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');
    }

    placeNumber(num) {
        if (this.selectedCell === null) return;

        const { row, col } = this.selectedCell;

        // Vérifier si c'est une cellule fixe
        if (this.isInitialCell(row, col)) return;

        // Placer le nombre
        this.grid[row][col] = num;

        // Mettre à jour visuellement (pas de couleur tant que pas validé)
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = num;
        cell.classList.remove('error', 'correct');

        // Vérifier si la grille est complète et valider automatiquement
        if (this.isGridComplete()) {
            setTimeout(() => this.checkSolution(), 300);
        }
    }

    eraseCell() {
        if (this.selectedCell === null) return;

        const { row, col } = this.selectedCell;

        // Vérifier si c'est une cellule fixe
        if (this.isInitialCell(row, col)) return;

        this.grid[row][col] = 0;

        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = '';
        cell.classList.remove('error', 'correct');
    }

    isGridComplete() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) return false;
            }
        }
        return true;
    }

    async checkSolution() {
        // Compter les erreurs et marquer visuellement
        let errorCount = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // Ignorer les cellules initiales
                if (this.isInitialCell(row, col)) continue;

                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (!cell) continue;

                if (this.grid[row][col] !== this.solution[row][col]) {
                    cell.classList.add('error');
                    cell.classList.remove('correct');
                    errorCount++;
                    this.sessionManager.addError();
                } else {
                    cell.classList.add('correct');
                    cell.classList.remove('error');
                }
            }
        }

        const allCorrect = errorCount === 0;

        if (allCorrect) {
            this.stopTimer();
            this.completedCount++;
            this.updateStats();

            // Sauvegarder la session et obtenir la récompense
            const result = await this.sessionManager.saveSession(true);
            const feedbackMsg = this.sessionManager.getFeedbackMessage(result.cardsEarned);

            Toast.success(`Sudoku résolu en ${this.formatTime(this.timer)} ! ${feedbackMsg}`);

            // Rafraîchir les crédits dans la nav
            if (result.cardsEarned > 0) {
                await navigationUI.refresh();
            }
        } else {
            Toast.error(`${errorCount} erreur${errorCount > 1 ? 's' : ''} dans la grille !`);

            setTimeout(() => {
                // Retirer les marquages visuels après 3 secondes
                document.querySelectorAll('.sudoku-cell').forEach(cell => {
                    cell.classList.remove('error', 'correct');
                });
            }, 3000);
        }
    }

    showHint() {
        // Trouver une cellule vide
        const emptyCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length === 0) {
            Toast.info('La grille est complète !');
            return;
        }

        // Choisir une cellule au hasard et révéler sa valeur
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.grid[randomCell.row][randomCell.col] = this.solution[randomCell.row][randomCell.col];

        const cell = document.querySelector(`[data-row="${randomCell.row}"][data-col="${randomCell.col}"]`);
        cell.textContent = this.solution[randomCell.row][randomCell.col];
        cell.classList.add('correct');

        this.hintsUsed++;

        Toast.hint('Une case a été révélée !');
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateStats();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateStats() {
        // Mettre à jour les stats dans le header
        const completedCountElement = document.getElementById('completed-count');
        if (completedCountElement) {
            completedCountElement.textContent = this.completedCount;
        }

        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = this.formatTime(this.timer);
        }

        const errorsElement = document.getElementById('errors');
        if (errorsElement) {
            errorsElement.textContent = this.sessionManager.errors;
        }
    }
}

// Instance globale
const sudokuGame = new SudokuGame();
