// Jeu de Mots Croisés
class CrosswordGame {
    constructor() {
        this.gridSize = 10;
        this.grid = [];
        this.words = [];
        this.placedWords = [];
        this.currentWord = null;
        this.currentDirection = null;
        this.hintsUsed = 0;
        this.maxHints = 3;
        this.timer = 0;
        this.timerInterval = null;
    }

    async init() {
        // Créer le header avec les stats
        PageHeader.render({
            icon: '🔠',
            title: 'Mots Croisés',
            subtitle: 'Remplis la grille avec les bonnes lettres !',
            actions: [],
            stats: [
                { label: 'Essais aujourd\'hui', id: 'attempts-remaining', value: '...' },
                { label: 'Mots trouvés', id: 'words-found', value: '0/0' },
                { label: 'Temps', id: 'timer', value: '00:00' },
                { label: 'Indices', id: 'hints-used', value: '0/3' }
            ]
        });

        // Initialiser le compteur d'essais
        const remaining = await GameAttempts.initHeaderDisplay('crossword', 3);

        if (remaining === 0) {
            Toast.warning('Plus d\'essais pour aujourd\'hui ! Reviens demain.');
            return;
        }

        // Charger les mots depuis la base de données
        await this.loadWords();

        this.cacheElements();
        this.attachEvents();
        this.startNewGame();
    }

    async loadWords() {
        try {
            const user = authService.getCurrentUser();
            if (!user) {
                Toast.error('Utilisateur non connecté');
                return;
            }

            const response = await authService.fetchAPI(`/word-search/themes/${user.id}/available`);
            const data = await response.json();

            // Récupérer tous les mots avec leurs définitions
            this.allWords = [];
            data.themes.forEach(theme => {
                if (theme.words && theme.words.length > 0) {
                    theme.words.forEach(w => {
                        if (w.definition) { // Seulement les mots avec définitions
                            this.allWords.push({
                                word: w.word,
                                definition: w.definition
                            });
                        }
                    });
                }
            });

            console.log('📚 Loaded words with definitions:', this.allWords.length);
        } catch (error) {
            console.error('Failed to load words:', error);
            Toast.error('Erreur lors du chargement des mots');
        }
    }

    cacheElements() {
        this.elements = {
            grid: document.getElementById('crossword-grid'),
            horizontalClues: document.getElementById('horizontal-clues'),
            verticalClues: document.getElementById('vertical-clues'),
            newGameBtn: document.getElementById('new-game-btn'),
            hintBtn: document.getElementById('hint-btn')
        };
    }

    attachEvents() {
        this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.elements.hintBtn.addEventListener('click', () => this.useHint());
    }

    startNewGame() {
        // Sélectionner 12-15 mots aléatoires avec définitions
        if (!this.allWords || this.allWords.length === 0) {
            Toast.error('Aucun mot disponible avec des définitions');
            return;
        }

        // Sélectionner des mots de longueur variée (3-8 lettres pour une grille 10x10)
        const suitableWords = this.allWords.filter(w => w.word.length >= 3 && w.word.length <= 8);

        if (suitableWords.length < 12) {
            Toast.error('Pas assez de mots disponibles');
            return;
        }

        const numWords = Math.min(12 + Math.floor(Math.random() * 4), suitableWords.length);
        const shuffled = this.shuffleArray([...suitableWords]);
        this.words = shuffled.slice(0, numWords);

        this.hintsUsed = 0;
        this.placedWords = [];
        this.currentWord = null;

        this.initializeGrid();
        this.generateCrossword();

        console.log(`🎯 Génération: ${this.placedWords.length}/${this.words.length} mots placés`);

        // Si trop peu de mots ont été placés, réessayer (max 5 fois)
        if (this.placedWords.length < 6 && !this.retryCount) {
            this.retryCount = (this.retryCount || 0) + 1;
            if (this.retryCount < 5) {
                console.log('⚠️ Pas assez de mots, nouvelle tentative...');
                this.startNewGame();
                return;
            }
        }
        this.retryCount = 0;

        this.renderGrid();
        this.renderClues();
        this.updateStats();
        this.startTimer();

        this.elements.hintBtn.disabled = false;
        this.elements.hintBtn.textContent = `💡 Indice (${this.maxHints - this.hintsUsed})`;
    }

    initializeGrid() {
        this.grid = Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(null).map(() => ({
                letter: null,
                black: true,
                number: null,
                wordIds: []
            }))
        );
    }

    generateCrossword() {
        // Générer plusieurs grilles et garder la meilleure
        const numAttempts = 50;
        let bestGrid = null;
        let bestScore = 0;

        for (let attempt = 0; attempt < numAttempts; attempt++) {
            this.initializeGrid();
            this.placedWords = [];

            const result = this.generateSingleGrid();

            if (result.score > bestScore) {
                bestScore = result.score;
                bestGrid = {
                    grid: JSON.parse(JSON.stringify(this.grid)),
                    placedWords: JSON.parse(JSON.stringify(this.placedWords))
                };
            }
        }

        if (bestGrid) {
            this.grid = bestGrid.grid;
            this.placedWords = bestGrid.placedWords;
        }
    }

    generateSingleGrid() {
        // Mélanger les mots et trier par longueur (mélange de longs et courts)
        const shuffledWords = this.shuffleArray([...this.words]);

        // Trier pour alterner entre mots longs et courts
        shuffledWords.sort((a, b) => {
            const diff = Math.abs(a.word.length - 6) - Math.abs(b.word.length - 6);
            return diff !== 0 ? diff : Math.random() - 0.5;
        });

        // Placer le premier mot au centre
        const firstWord = shuffledWords[0];
        const startRow = Math.floor(this.gridSize / 2);
        const startCol = Math.floor((this.gridSize - firstWord.word.length) / 2);

        this.placeWord(firstWord, startRow, startCol, 'horizontal', 1);

        // Essayer de placer les autres mots avec plusieurs passages
        let wordNumber = 2;
        const unplacedWords = [];

        // Premier passage : essayer tous les mots
        for (let i = 1; i < shuffledWords.length; i++) {
            if (this.tryPlaceWord(shuffledWords[i], wordNumber)) {
                wordNumber++;
            } else {
                unplacedWords.push(shuffledWords[i]);
            }
        }

        // Deuxième passage : réessayer les mots non placés
        for (const word of unplacedWords) {
            if (this.tryPlaceWord(word, wordNumber)) {
                wordNumber++;
            }
        }

        // Calculer le score (nombre de mots placés + nombre d'intersections)
        const intersections = this.countIntersections();
        const score = this.placedWords.length * 10 + intersections;

        return { score, wordsPlaced: this.placedWords.length };
    }

    countIntersections() {
        let count = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col].wordIds.length > 1) {
                    count++;
                }
            }
        }
        return count;
    }

    tryPlaceWord(wordData, wordNumber) {
        const word = wordData.word;

        // Collecter toutes les intersections possibles
        const possiblePlacements = [];

        // Essayer de croiser avec chaque mot déjà placé
        for (const placedWord of this.placedWords) {
            // Trouver toutes les lettres communes
            for (let i = 0; i < word.length; i++) {
                for (let j = 0; j < placedWord.word.length; j++) {
                    if (word[i] === placedWord.word[j]) {
                        // Calculer la position pour placer perpendiculairement
                        const newDirection = placedWord.direction === 'horizontal' ? 'vertical' : 'horizontal';

                        let row, col;
                        if (newDirection === 'horizontal') {
                            // Le mot sera horizontal, croise le mot vertical à la position j
                            row = placedWord.row + j;
                            col = placedWord.col - i;
                        } else {
                            // Le mot sera vertical, croise le mot horizontal à la position j
                            row = placedWord.row - i;
                            col = placedWord.col + j;
                        }

                        if (this.canPlaceWord(word, row, col, newDirection)) {
                            possiblePlacements.push({ row, col, direction: newDirection });
                        }
                    }
                }
            }
        }

        // Si on a trouvé des placements possibles, en choisir un au hasard
        if (possiblePlacements.length > 0) {
            const placement = possiblePlacements[Math.floor(Math.random() * possiblePlacements.length)];
            this.placeWord(wordData, placement.row, placement.col, placement.direction, wordNumber);
            return true;
        }

        return false;
    }

    canPlaceWord(word, row, col, direction) {
        if (row < 0 || col < 0) return false;

        const endRow = direction === 'vertical' ? row + word.length - 1 : row;
        const endCol = direction === 'horizontal' ? col + word.length - 1 : col;

        if (endRow >= this.gridSize || endCol >= this.gridSize) return false;

        let hasIntersection = false;

        // Vérifier l'espace avant
        if (direction === 'horizontal') {
            if (col > 0 && this.grid[row][col - 1].letter !== null) return false;
        } else {
            if (row > 0 && this.grid[row - 1][col].letter !== null) return false;
        }

        // Vérifier l'espace après
        if (direction === 'horizontal') {
            if (endCol + 1 < this.gridSize && this.grid[row][endCol + 1].letter !== null) return false;
        } else {
            if (endRow + 1 < this.gridSize && this.grid[endRow + 1][col].letter !== null) return false;
        }

        // Vérifier chaque position
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'vertical' ? row + i : row;
            const c = direction === 'horizontal' ? col + i : col;

            const cell = this.grid[r][c];

            // Si la cellule a une lettre
            if (cell.letter !== null) {
                // Elle doit correspondre exactement
                if (cell.letter !== word[i]) {
                    return false;
                }
                hasIntersection = true;
            } else {
                // Vérifier les cellules adjacentes perpendiculaires
                if (direction === 'horizontal') {
                    // Vérifier au-dessus et en-dessous
                    if (r > 0 && this.grid[r - 1][c].letter !== null) return false;
                    if (r < this.gridSize - 1 && this.grid[r + 1][c].letter !== null) return false;
                } else {
                    // Vérifier à gauche et à droite
                    if (c > 0 && this.grid[r][c - 1].letter !== null) return false;
                    if (c < this.gridSize - 1 && this.grid[r][c + 1].letter !== null) return false;
                }
            }
        }

        // Un mot doit croiser au moins un mot existant (sauf le premier)
        return this.placedWords.length === 0 || hasIntersection;
    }

    placeWord(wordData, row, col, direction, wordNumber) {
        const word = wordData.word;

        for (let i = 0; i < word.length; i++) {
            const r = direction === 'vertical' ? row + i : row;
            const c = direction === 'horizontal' ? col + i : col;

            this.grid[r][c].letter = word[i];
            this.grid[r][c].black = false;
            this.grid[r][c].wordIds.push(wordNumber);
        }

        // Numéroter la première case
        this.grid[row][col].number = wordNumber;

        this.placedWords.push({
            ...wordData,
            row,
            col,
            direction,
            number: wordNumber,
            cells: word.split('').map((letter, i) => ({
                row: direction === 'vertical' ? row + i : row,
                col: direction === 'horizontal' ? col + i : col,
                letter
            }))
        });
    }

    renderGrid() {
        // Le CSS gère grid-template-columns en responsive
        this.elements.grid.innerHTML = '';

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                const cellDiv = document.createElement('div');
                cellDiv.className = `crossword-cell ${cell.black ? 'black' : ''}`;
                cellDiv.dataset.row = row;
                cellDiv.dataset.col = col;

                if (!cell.black) {
                    if (cell.number) {
                        const numberSpan = document.createElement('span');
                        numberSpan.className = 'cell-number';
                        numberSpan.textContent = cell.number;
                        cellDiv.appendChild(numberSpan);
                    }

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.dataset.row = row;
                    input.dataset.col = col;
                    input.addEventListener('input', (e) => this.handleInput(e));
                    input.addEventListener('keydown', (e) => this.handleKeyDown(e));
                    input.addEventListener('focus', (e) => this.handleFocus(e));
                    cellDiv.appendChild(input);
                }

                this.elements.grid.appendChild(cellDiv);
            }
        }
    }

    renderClues() {
        const horizontal = this.placedWords.filter(w => w.direction === 'horizontal')
            .sort((a, b) => a.number - b.number);
        const vertical = this.placedWords.filter(w => w.direction === 'vertical')
            .sort((a, b) => a.number - b.number);

        this.elements.horizontalClues.innerHTML = horizontal.map(word => `
            <div class="clue-item" data-word-number="${word.number}" data-direction="horizontal">
                <span class="clue-number">${word.number}.</span>
                <span class="clue-text">${word.definition}</span>
            </div>
        `).join('');

        this.elements.verticalClues.innerHTML = vertical.map(word => `
            <div class="clue-item" data-word-number="${word.number}" data-direction="vertical">
                <span class="clue-number">${word.number}.</span>
                <span class="clue-text">${word.definition}</span>
            </div>
        `).join('');

        // Ajouter les événements sur les définitions
        document.querySelectorAll('.clue-item').forEach(clue => {
            clue.addEventListener('click', () => {
                const wordNumber = parseInt(clue.dataset.wordNumber);
                const direction = clue.dataset.direction;
                this.selectWord(wordNumber, direction);
            });
        });
    }

    selectWord(wordNumber, direction) {
        const word = this.placedWords.find(w => w.number === wordNumber && w.direction === direction);
        if (!word) return;

        this.currentWord = word;
        this.currentDirection = direction;

        // Mettre en surbrillance le mot avec bordure
        this.highlightWord(word);

        // Focus sur la première cellule vide du mot
        const firstEmptyCell = word.cells.find(cell => {
            const input = document.querySelector(`input[data-row="${cell.row}"][data-col="${cell.col}"]`);
            return input && !input.value;
        });

        const targetCell = firstEmptyCell || word.cells[0];
        const input = document.querySelector(`input[data-row="${targetCell.row}"][data-col="${targetCell.col}"]`);

        if (input) {
            // Scroll automatique vers la cellule
            const cellDiv = input.closest('.crossword-cell');
            if (cellDiv) {
                cellDiv.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }

            // Focus après le scroll
            setTimeout(() => {
                input.focus();
            }, 300);
        }

        // Mettre à jour les définitions actives
        document.querySelectorAll('.clue-item').forEach(clue => {
            clue.classList.remove('active');
        });
        document.querySelector(`.clue-item[data-word-number="${wordNumber}"][data-direction="${direction}"]`)?.classList.add('active');
    }

    highlightWord(word) {
        document.querySelectorAll('.crossword-cell').forEach(cell => {
            cell.classList.remove('highlighted', 'selected', 'word-selected');
        });

        word.cells.forEach(cell => {
            const cellDiv = document.querySelector(`.crossword-cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
            if (cellDiv) {
                cellDiv.classList.add('highlighted', 'word-selected');
            }
        });
    }

    handleInput(e) {
        const input = e.target;
        const value = input.value.toUpperCase().replace(/[^A-Z]/g, '');
        input.value = value;

        if (value) {
            this.moveToNextCellInDirection(input);
            this.checkCompletion();
        }
    }

    handleKeyDown(e) {
        const input = e.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);

        if (e.key === 'Backspace' && !input.value) {
            this.moveToPreviousCell(input);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.moveInDirection(row, col, 0, 1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.moveInDirection(row, col, 0, -1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.moveInDirection(row, col, 1, 0);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.moveInDirection(row, col, -1, 0);
        }
    }

    handleFocus(e) {
        const input = e.target;
        const cellDiv = input.closest('.crossword-cell');
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);

        document.querySelectorAll('.crossword-cell').forEach(c => c.classList.remove('selected'));
        cellDiv.classList.add('selected');

        // Déterminer la direction automatiquement si pas encore définie
        if (!this.currentDirection) {
            // Trouver les mots qui passent par cette case
            const wordsAtCell = this.placedWords.filter(word =>
                word.cells.some(cell => cell.row === row && cell.col === col)
            );

            if (wordsAtCell.length > 0) {
                // Prendre le premier mot horizontal, sinon le premier vertical
                const horizontalWord = wordsAtCell.find(w => w.direction === 'horizontal');
                this.currentWord = horizontalWord || wordsAtCell[0];
                this.currentDirection = this.currentWord.direction;
                this.highlightWord(this.currentWord);
            }
        }
    }

    moveToNextCellInDirection(currentInput) {
        if (!this.currentDirection) return;

        const row = parseInt(currentInput.dataset.row);
        const col = parseInt(currentInput.dataset.col);

        // Trouver la prochaine cellule vide dans la direction
        let nextRow = row;
        let nextCol = col;
        let found = false;

        // Chercher jusqu'à 10 cases max (taille de la grille)
        for (let i = 1; i <= this.gridSize; i++) {
            if (this.currentDirection === 'horizontal') {
                nextCol = col + i;
            } else {
                nextRow = row + i;
            }

            // Vérifier que la cellule existe et n'est pas noire
            if (nextRow >= this.gridSize || nextCol >= this.gridSize) break;
            if (this.grid[nextRow][nextCol].black) break;

            const nextInput = document.querySelector(`input[data-row="${nextRow}"][data-col="${nextCol}"]`);

            // Si la cellule est vide, on s'y arrête
            if (nextInput && !nextInput.value) {
                nextInput.focus();
                found = true;
                break;
            }
        }

        // Si aucune cellule vide trouvée, ne rien faire (rester sur la cellule actuelle)
    }

    moveToNextCell(currentInput) {
        if (!this.currentWord) return;

        const row = parseInt(currentInput.dataset.row);
        const col = parseInt(currentInput.dataset.col);

        const currentIndex = this.currentWord.cells.findIndex(c => c.row === row && c.col === col);
        if (currentIndex === -1 || currentIndex === this.currentWord.cells.length - 1) return;

        const nextCell = this.currentWord.cells[currentIndex + 1];
        const nextInput = document.querySelector(`input[data-row="${nextCell.row}"][data-col="${nextCell.col}"]`);
        if (nextInput) nextInput.focus();
    }

    moveToPreviousCell(currentInput) {
        if (!this.currentWord) return;

        const row = parseInt(currentInput.dataset.row);
        const col = parseInt(currentInput.dataset.col);

        const currentIndex = this.currentWord.cells.findIndex(c => c.row === row && c.col === col);
        if (currentIndex === -1 || currentIndex === 0) return;

        const prevCell = this.currentWord.cells[currentIndex - 1];
        const prevInput = document.querySelector(`input[data-row="${prevCell.row}"][data-col="${prevCell.col}"]`);
        if (prevInput) prevInput.focus();
    }

    moveInDirection(row, col, dRow, dCol) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (newRow < 0 || newRow >= this.gridSize || newCol < 0 || newCol >= this.gridSize) return;
        if (this.grid[newRow][newCol].black) return;

        const nextInput = document.querySelector(`input[data-row="${newRow}"][data-col="${newCol}"]`);
        if (nextInput) nextInput.focus();
    }

    checkCompletion() {
        let allCorrect = true;
        let foundWords = 0;

        this.placedWords.forEach(word => {
            let wordCorrect = true;

            word.cells.forEach(cell => {
                const input = document.querySelector(`input[data-row="${cell.row}"][data-col="${cell.col}"]`);
                const cellDiv = input?.closest('.crossword-cell');

                if (input && cellDiv) {
                    if (input.value.toUpperCase() === cell.letter) {
                        cellDiv.classList.remove('error');
                        cellDiv.classList.add('correct');
                    } else {
                        wordCorrect = false;
                        allCorrect = false;
                        cellDiv.classList.remove('correct');
                        if (input.value) {
                            cellDiv.classList.add('error');
                        }
                    }
                } else {
                    wordCorrect = false;
                    allCorrect = false;
                }
            });

            if (wordCorrect) {
                foundWords++;
                // Marquer la définition comme complétée
                document.querySelectorAll(`.clue-item[data-word-number="${word.number}"]`).forEach(clue => {
                    clue.classList.add('completed');
                });
            }
        });

        this.updateStats();

        if (allCorrect) {
            this.gameWon();
        }
    }

    async gameWon() {
        this.stopTimer();

        const timeBonus = Math.max(0, 600 - this.timer); // Bonus si < 10min
        const hintPenalty = this.hintsUsed * 2;
        const totalCredits = 5 + Math.floor(timeBonus / 120) - hintPenalty;

        await CreditsManager.addCredits(totalCredits, `Mots croisés complétés en ${this.formatTime(this.timer)}`);

        setTimeout(() => {
            Toast.success(`Bravo ! Grille complétée en ${this.formatTime(this.timer)} ! Récompense : +${totalCredits} crédits`);
        }, 500);
    }

    useHint() {
        if (this.hintsUsed >= this.maxHints) {
            Toast.error('Plus d\'indices disponibles');
            return;
        }

        // Trouver une cellule vide
        for (const word of this.placedWords) {
            for (const cell of word.cells) {
                const input = document.querySelector(`input[data-row="${cell.row}"][data-col="${cell.col}"]`);
                if (input && !input.value) {
                    input.value = cell.letter;
                    input.closest('.crossword-cell').classList.add('correct');
                    this.hintsUsed++;
                    this.elements.hintBtn.textContent = `💡 Indice (${this.maxHints - this.hintsUsed})`;

                    if (this.hintsUsed >= this.maxHints) {
                        this.elements.hintBtn.disabled = true;
                    }

                    Toast.hint('Une lettre a été révélée !');
                    this.checkCompletion();
                    return;
                }
            }
        }
    }

    updateStats() {
        const foundWords = this.placedWords.filter(word => {
            return word.cells.every(cell => {
                const input = document.querySelector(`input[data-row="${cell.row}"][data-col="${cell.col}"]`);
                return input && input.value.toUpperCase() === cell.letter;
            });
        }).length;

        const wordsFoundElement = document.getElementById('words-found');
        if (wordsFoundElement) {
            wordsFoundElement.textContent = `${foundWords}/${this.placedWords.length}`;
        }

        const hintsElement = document.getElementById('hints-used');
        if (hintsElement) {
            hintsElement.textContent = `${this.hintsUsed}/${this.maxHints}`;
        }
    }

    startTimer() {
        this.stopTimer();
        this.timer = 0;
        this.timerInterval = setInterval(() => {
            this.timer++;
            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.textContent = this.formatTime(this.timer);
            }
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

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Instance globale
const crosswordGame = new CrosswordGame();
