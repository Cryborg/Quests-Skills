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
            actions: [
                {
                    icon: '⭐',
                    text: 'Noter ce jeu',
                    id: 'rate-game-btn-word-search',
                    className: 'page-header-btn-secondary'
                },
                {
                    icon: '❓',
                    text: 'Aide',
                    id: 'help-btn-word-search',
                    className: 'page-header-btn-secondary'
                }
            ],
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

        // Initialiser le bouton d'aide
        setTimeout(() => {
            if (typeof GameHelpModal !== 'undefined') {
                GameHelpModal.initHeaderButton('help-btn-word-search', {
                    title: 'Mots Mêlés',
                    icon: '🔍',
                    objective: 'Trouve tous les mots cachés dans la grille avant que le temps ne s\'écoule trop. Les mots peuvent être placés horizontalement, verticalement ou en diagonale, dans n\'importe quel sens.',
                    rules: [
                        {
                            title: 'Sélection des mots',
                            description: 'Clique (ou touche) sur la première lettre d\'un mot et glisse jusqu\'à la dernière lettre. Les mots peuvent être horizontaux, verticaux ou diagonaux.'
                        },
                        {
                            title: 'Validation',
                            description: 'Relâche pour valider ta sélection. Si le mot est correct, il sera marqué en vert et rayé de la liste.'
                        },
                        {
                            title: 'Indices limités',
                            description: 'Tu disposes de 3 indices maximum. Utilise-les avec parcimonie car chaque indice utilisé réduit ta récompense finale.'
                        },
                        {
                            title: 'Grille thématique',
                            description: 'Les mots de la grille proviennent d\'un thème aléatoire parmi ceux que tu as débloqués en collectionnant des cartes.'
                        }
                    ],
                    controls: {
                        desktop: [
                            'Clic gauche maintenu + glisser : sélectionner un mot',
                            'Relâcher : valider la sélection'
                        ],
                        mobile: [
                            'Toucher + glisser : sélectionner un mot',
                            'Relâcher : valider la sélection'
                        ]
                    },
                    scoring: {
                        base: '3 crédits',
                        bonuses: [
                            '+1 crédit par minute gagnée (si tu termines en moins de 5 minutes)'
                        ],
                        penalties: [
                            '-1 crédit par indice utilisé'
                        ]
                    },
                    tips: [
                        'Commence par chercher les mots les plus longs, ils sont plus faciles à repérer',
                        'Scanne la grille méthodiquement ligne par ligne ou colonne par colonne',
                        'Les diagonales sont souvent les plus difficiles à voir, concentre-toi dessus en dernier',
                        'N\'oublie pas que les mots peuvent être écrits dans n\'importe quel sens (gauche-droite, droite-gauche, haut-bas, bas-haut, et toutes les diagonales)',
                        'Utilise un indice si tu es vraiment bloqué, mais essaie de terminer sans pour maximiser tes crédits'
                    ]
                });
            }
        }, 100);

        // Initialiser le bouton de notation
        setTimeout(() => {
            if (typeof GameRatingModal !== 'undefined') {
                GameRatingModal.initHeaderButton('word-search');
            }
        }, 100);

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

        // Vérifier s'il y a une partie sauvegardée
        await this.checkForSavedGame();
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
        this.elements.newGameBtn.addEventListener('click', () => this.confirmNewGame());
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

    async checkForSavedGame() {
        const user = authService.getCurrentUser();
        if (!user) return;

        try {
            const response = await authService.fetchAPI(`/word-search/games/${user.id}/current`);
            const data = await response.json();

            if (data.game) {
                // Afficher une modal pour demander si l'utilisateur veut reprendre
                const resume = await confirm('Partie en cours détectée ! Voulez-vous reprendre votre partie ou commencer une nouvelle ?');

                if (resume) {
                    await this.loadSavedGame(data.game);
                } else {
                    await this.deleteSavedGame();
                    this.startNewGame();
                }
            } else {
                this.startNewGame();
            }
        } catch (error) {
            console.error('Failed to check for saved game:', error);
            this.startNewGame();
        }
    }

    async loadSavedGame(game) {
        // Charger l'état de la partie
        this.grid = game.grid;
        this.words = game.words;
        this.foundWords = new Set(game.foundWords);
        this.timer = game.timer;
        this.hintsUsed = game.hints_used;

        // Rendre l'interface
        this.renderGrid();
        this.renderWordsList();
        this.updateStats();
        this.startTimer();

        // Marquer les mots trouvés visuellement
        this.foundWords.forEach(wordId => {
            this.markWordAsFound(wordId);
        });

        this.elements.hintBtn.disabled = this.hintsUsed >= this.maxHints;
        this.elements.hintBtn.textContent = `💡 Indice (${this.maxHints - this.hintsUsed})`;

        Toast.info('Partie reprise !');
    }

    async confirmNewGame() {
        // Si une partie est en cours, demander confirmation
        if (this.foundWords.size > 0 && this.foundWords.size < this.words.length) {
            const confirmed = await confirm('Êtes-vous sûr de vouloir abandonner la partie en cours ?');
            if (!confirmed) return;
        }

        await this.deleteSavedGame();
        this.startNewGame();
    }

    async saveGame() {
        const user = authService.getCurrentUser();
        if (!user) return;

        // Ne pas sauvegarder si la partie est terminée
        if (this.foundWords.size === this.words.length) return;

        try {
            await authService.fetchAPI(`/word-search/games/${user.id}/save`, {
                method: 'POST',
                body: JSON.stringify({
                    grid: this.grid,
                    words: this.words,
                    foundWords: Array.from(this.foundWords),
                    timer: this.timer,
                    hintsUsed: this.hintsUsed
                })
            });
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    }

    async deleteSavedGame() {
        const user = authService.getCurrentUser();
        if (!user) return;

        try {
            await authService.fetchAPI(`/word-search/games/${user.id}/current`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Failed to delete saved game:', error);
        }
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
        this.timer = 0;

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

                // Sauvegarder la progression
                this.saveGame();

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
                    this.updateStats();
                    this.elements.hintBtn.textContent = `💡 Indice (${this.maxHints - this.hintsUsed})`;
                    Toast.hint(`Regarde le mot "${word}" - une lettre est mise en évidence !`);
                    if (this.hintsUsed >= this.maxHints) {
                        this.elements.hintBtn.disabled = true;
                    }

                    // Sauvegarder la progression
                    this.saveGame();
                    return;
                }
            }
        }
    }

    async gameWon() {
        this.stopTimer();

        // Supprimer la sauvegarde car la partie est terminée
        await this.deleteSavedGame();

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

        // Afficher le timer initial
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = this.formatTime(this.timer);
        }

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
