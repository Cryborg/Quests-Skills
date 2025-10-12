// Jeu de Mots Mêlés
class WordSearchGame {
    constructor() {
        this.gridSize = 12;
        this.grid = [];
        this.words = [];
        this.foundWords = new Set();
        this.selecting = false;
        this.selectedCells = [];
        this.startCell = null;
        this.timer = 0;
        this.timerInterval = null;
        this.hintsUsed = 0;
        this.maxHints = 3;

        // Listes de mots par thème (chargées depuis la BDD)
        this.wordLists = {};
    }

    async init() {
        // Créer le header avec les stats
        PageHeader.render({
            icon: '🔍',
            title: 'Mots Mêlés',
            subtitle: 'Trouve tous les mots cachés dans la grille !',
            actions: [],
            stats: [
                { label: 'Essais aujourd\'hui', id: 'attempts-remaining', value: '...' },
                { label: 'Mots trouvés', id: 'words-found', value: '0/0' },
                { label: 'Temps', id: 'timer', value: '00:00' },
                { label: 'Indices', id: 'hints-used', value: '0/3' }
            ],
            reward: {
                baseCredits: 3,
                bonusText: '+ bonus temps'
            }
        });

        // Initialiser le compteur d'essais
        const remaining = await GameAttempts.initHeaderDisplay('word-search', 3);

        if (remaining === 0) {
            Toast.warning('Plus d\'essais pour aujourd\'hui ! Reviens demain.');
            return;
        }

        // Charger les listes de mots depuis la base de données
        await this.loadWordLists();

        this.cacheElements();
        this.attachEvents();
        this.startNewGame();
    }

    async loadWordLists() {
        try {
            const user = authService.getCurrentUser();
            if (!user) {
                Toast.error('Utilisateur non connecté');
                return;
            }

            const response = await authService.fetchAPI(`/word-search/themes/${user.id}/available`);
            const data = await response.json();

            // Transformer les thèmes en wordLists
            this.wordLists = {};
            data.themes.forEach(theme => {
                if (theme.words && theme.words.length > 0) {
                    this.wordLists[theme.slug] = theme.words.map(w => w.word);
                }
            });

            console.log('📚 Loaded word lists:', this.wordLists);

            // Vérifier qu'on a au moins un thème
            if (Object.keys(this.wordLists).length === 0) {
                Toast.error('Aucun thème de mots mêlés disponible');
            }
        } catch (error) {
            console.error('Failed to load word lists:', error);
            Toast.error('Erreur lors du chargement des mots');
        }
    }

    cacheElements() {
        this.elements = {
            grid: document.getElementById('word-grid'),
            wordsList: document.getElementById('words-list'),
            newGameBtn: document.getElementById('new-game-btn'),
            hintBtn: document.getElementById('hint-btn')
        };
    }

    attachEvents() {
        this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.elements.hintBtn.addEventListener('click', () => this.useHint());

        // Events souris
        this.elements.grid.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.elements.grid.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.elements.grid.addEventListener('mouseup', () => this.onMouseUp());

        // Events tactiles
        this.elements.grid.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.elements.grid.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.elements.grid.addEventListener('touchend', () => this.onMouseUp());
    }

    startNewGame() {
        // Choisir un thème aléatoire
        const themes = Object.keys(this.wordLists);
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];

        // Sélectionner jusqu'à 10 mots du thème
        const themeWords = [...this.wordLists[randomTheme]];
        const numWords = Math.min(10, themeWords.length); // Jusqu'à 10 mots (ou moins si pas assez de mots)
        this.words = this.shuffleArray(themeWords).slice(0, numWords);

        this.foundWords.clear();
        this.hintsUsed = 0;
        this.selectedCells = [];
        this.selecting = false;

        this.initializeGrid();
        this.placeWords();
        this.fillEmptyCells();
        this.renderGrid();
        this.renderWordsList();
        this.updateStats();
        this.startTimer();

        this.elements.hintBtn.disabled = false;
        this.elements.hintBtn.textContent = `💡 Indice (${this.maxHints - this.hintsUsed})`;
    }

    initializeGrid() {
        this.grid = Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(null).map(() => ({ letter: '', wordId: null }))
        );
    }

    placeWords() {
        const directions = [
            { dx: 0, dy: 1 },   // Horizontal droite
            { dx: 1, dy: 0 },   // Vertical bas
            { dx: 1, dy: 1 },   // Diagonale bas-droite
            { dx: 1, dy: -1 }   // Diagonale bas-gauche
        ];

        this.words.forEach((word, wordIndex) => {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 100) {
                const direction = directions[Math.floor(Math.random() * directions.length)];
                const row = Math.floor(Math.random() * this.gridSize);
                const col = Math.floor(Math.random() * this.gridSize);

                if (this.canPlaceWord(word, row, col, direction)) {
                    this.placeWord(word, row, col, direction, wordIndex);
                    placed = true;
                }
                attempts++;
            }
        });
    }

    canPlaceWord(word, row, col, direction) {
        for (let i = 0; i < word.length; i++) {
            const newRow = row + i * direction.dy;
            const newCol = col + i * direction.dx;

            if (newRow < 0 || newRow >= this.gridSize ||
                newCol < 0 || newCol >= this.gridSize) {
                return false;
            }

            const cell = this.grid[newRow][newCol];
            if (cell.letter !== '' && cell.letter !== word[i]) {
                return false;
            }
        }
        return true;
    }

    placeWord(word, row, col, direction, wordId) {
        for (let i = 0; i < word.length; i++) {
            const newRow = row + i * direction.dy;
            const newCol = col + i * direction.dx;
            this.grid[newRow][newCol] = { letter: word[i], wordId };
        }
    }

    fillEmptyCells() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col].letter === '') {
                    this.grid[row][col].letter = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
    }

    renderGrid() {
        this.elements.grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        this.elements.grid.innerHTML = '';

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.textContent = this.grid[row][col].letter;
                cell.dataset.row = row;
                cell.dataset.col = col;
                this.elements.grid.appendChild(cell);
            }
        }
    }

    renderWordsList() {
        // Créer un tableau avec les mots et leurs indices originaux
        const wordsWithIndices = this.words.map((word, index) => ({ word, index }));

        // Trier par ordre alphabétique
        wordsWithIndices.sort((a, b) => a.word.localeCompare(b.word));

        // Générer le HTML
        this.elements.wordsList.innerHTML = wordsWithIndices.map(({ word, index }) => `
            <div class="word-item ${this.foundWords.has(index) ? 'found' : ''}" data-word-id="${index}">
                ${word}
            </div>
        `).join('');
    }

    onMouseDown(e) {
        const cell = e.target.closest('.grid-cell');
        if (!cell) return;

        this.selecting = true;
        this.startCell = { row: parseInt(cell.dataset.row), col: parseInt(cell.dataset.col) };
        this.selectedCells = [this.startCell];
        this.updateSelection();
    }

    onMouseMove(e) {
        if (!this.selecting) return;

        const cell = e.target.closest('.grid-cell');
        if (!cell) return;

        const currentCell = { row: parseInt(cell.dataset.row), col: parseInt(cell.dataset.col) };
        this.selectedCells = this.getCellsInLine(this.startCell, currentCell);
        this.updateSelection();
    }

    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = element?.closest('.grid-cell');
        if (!cell) return;

        this.selecting = true;
        this.startCell = { row: parseInt(cell.dataset.row), col: parseInt(cell.dataset.col) };
        this.selectedCells = [this.startCell];
        this.updateSelection();
    }

    onTouchMove(e) {
        e.preventDefault();
        if (!this.selecting) return;

        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = element?.closest('.grid-cell');
        if (!cell) return;

        const currentCell = { row: parseInt(cell.dataset.row), col: parseInt(cell.dataset.col) };
        this.selectedCells = this.getCellsInLine(this.startCell, currentCell);
        this.updateSelection();
    }

    onMouseUp() {
        if (!this.selecting) return;

        this.checkWord();
        this.selecting = false;
        this.selectedCells = [];
        this.updateSelection();
    }

    getCellsInLine(start, end) {
        const cells = [];
        const dx = Math.sign(end.col - start.col);
        const dy = Math.sign(end.row - start.row);

        // Vérifier que c'est une ligne droite (horizontale, verticale ou diagonale)
        if (dx !== 0 && dy !== 0 && Math.abs(end.row - start.row) !== Math.abs(end.col - start.col)) {
            return [start];
        }

        let row = start.row;
        let col = start.col;

        while (row !== end.row || col !== end.col) {
            cells.push({ row, col });
            if (row !== end.row) row += dy;
            if (col !== end.col) col += dx;
        }
        cells.push(end);

        return cells;
    }

    updateSelection() {
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('selecting');
        });

        this.selectedCells.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) cell.classList.add('selecting');
        });
    }

    checkWord() {
        if (this.selectedCells.length < 2) return;

        const selectedWord = this.selectedCells
            .map(({ row, col }) => this.grid[row][col].letter)
            .join('');

        const reversedWord = selectedWord.split('').reverse().join('');

        this.words.forEach((word, index) => {
            if ((selectedWord === word || reversedWord === word) && !this.foundWords.has(index)) {
                this.foundWords.add(index);
                this.markWordAsFound(index);
                this.renderWordsList();
                this.updateStats();

                if (this.foundWords.size === this.words.length) {
                    this.gameWon();
                }
            }
        });
    }

    markWordAsFound(wordId) {
        document.querySelectorAll('.grid-cell').forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            if (this.grid[row][col].wordId === wordId) {
                cell.classList.add('found');
            }
        });
    }

    useHint() {
        if (this.hintsUsed >= this.maxHints) {
            Toast.error('Plus d\'indices disponibles');
            return;
        }

        // Trouver un mot pas encore trouvé
        const unfoundWords = this.words
            .map((word, index) => ({ word, index }))
            .filter(({ index }) => !this.foundWords.has(index));

        if (unfoundWords.length === 0) return;

        const { word, index } = unfoundWords[0];

        // Révéler la première lettre du mot
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell.wordId === index) {
                    const cellEl = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cellEl) {
                        cellEl.style.background = 'rgba(245, 158, 11, 0.3)';
                        cellEl.style.borderColor = '#f59e0b';
                    }
                    this.hintsUsed++;
                    this.elements.hintBtn.textContent = `💡 Indice (${this.maxHints - this.hintsUsed})`;
                    Toast.hint(`Regarde le mot "${word}" - une lettre est mise en évidence !`);
                    if (this.hintsUsed >= this.maxHints) {
                        this.elements.hintBtn.disabled = true;
                    }
                    return;
                }
            }
        }
    }

    async gameWon() {
        this.stopTimer();

        const timeBonus = Math.max(0, 300 - this.timer); // Bonus si < 5min
        const hintPenalty = this.hintsUsed * 1;
        const totalCredits = 3 + Math.floor(timeBonus / 60) - hintPenalty;

        // Ajouter les crédits via le gestionnaire centralisé
        await CreditsManager.addCredits(totalCredits, `Mots mêlés complétés en ${this.formatTime(this.timer)}`);

        setTimeout(() => {
            Toast.success(`Bravo ! Tous les mots trouvés en ${this.formatTime(this.timer)} ! Récompense : +${totalCredits} crédits`);
        }, 500);
    }

    updateStats() {
        // Mettre à jour les stats dans le header
        const wordsFoundElement = document.getElementById('words-found');
        if (wordsFoundElement) {
            wordsFoundElement.textContent = `${this.foundWords.size}/${this.words.length}`;
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
const wordSearchGame = new WordSearchGame();
