// Bonus Mathématiques - Logique

// Configuration des bonus
const BONUS_CONFIG = {
    STORAGE_KEY: 'bonus_operations_count',
    HISTORY_KEY: 'bonus_operations_history',
    STATS_KEY: 'bonus_operations_stats',
    MAX_OPERATIONS_PER_TYPE: 3,
    REWARDS: {
        addition: 1,
        subtraction: 2,
        multiplication: 5
    },
    RANGES: {
        addition: { min: 100, max: 9999 },
        subtraction: { min: 100, max: 999 },
        multiplication: { min: 10, max: 99 }
    }
};

// État de l'application
let currentOperation = null;
let currentExercise = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeBonus();
    setupEventListeners();
    updateRemainingCounts();
    updateStatsDisplay();
});

// Initialisation du système de bonus
function initializeBonus() {
    const today = new Date().toDateString();
    const stored = UTILS.loadFromStorage(BONUS_CONFIG.STORAGE_KEY, {});

    // Réinitialiser si c'est un nouveau jour
    if (stored.date !== today) {
        const newData = {
            date: today,
            addition: 0,
            subtraction: 0,
            multiplication: 0
        };
        UTILS.saveToStorage(BONUS_CONFIG.STORAGE_KEY, newData);
    }
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Boutons de retour et historique
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('history-btn').addEventListener('click', () => {
        window.location.href = 'historique.html';
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
        showScreen('selection');
        currentOperation = null;
        currentExercise = null;
    });

    // Sélection d'opération
    document.querySelectorAll('.operation-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const operation = card.dataset.operation;
            if (canDoOperation(operation)) {
                startOperation(operation);
            }
        });
    });

    // Boutons de validation
    document.getElementById('validate-btn').addEventListener('click', validateAnswer);
    document.getElementById('clear-btn').addEventListener('click', clearInputs);
}

// Vérifie si l'opération est disponible
function canDoOperation(operation) {
    const data = UTILS.loadFromStorage(BONUS_CONFIG.STORAGE_KEY, {});
    return (data[operation] || 0) < BONUS_CONFIG.MAX_OPERATIONS_PER_TYPE;
}

// Met à jour les compteurs restants
function updateRemainingCounts() {
    const data = UTILS.loadFromStorage(BONUS_CONFIG.STORAGE_KEY, {});

    ['addition', 'subtraction', 'multiplication'].forEach(operation => {
        const used = data[operation] || 0;
        const remaining = BONUS_CONFIG.MAX_OPERATIONS_PER_TYPE - used;
        document.getElementById(`remaining-${operation}`).textContent = remaining;

        // Désactiver si épuisé
        const card = document.querySelector(`.operation-card[data-operation="${operation}"]`);
        if (remaining <= 0) {
            card.classList.add('disabled');
        } else {
            card.classList.remove('disabled');
        }
    });
}

// Affiche un écran
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`${screenName}-screen`).classList.add('active');
}

// Lance une opération
function startOperation(operation) {
    currentOperation = operation;

    // Générer l'exercice
    currentExercise = generateExercise(operation);

    // Afficher l'écran d'exercice
    showScreen('exercise');

    // Mettre à jour le titre
    const titles = {
        addition: '➕ Addition',
        subtraction: '➖ Soustraction',
        multiplication: '✖️ Multiplication'
    };
    document.getElementById('exercise-title').textContent = titles[operation];

    // Afficher l'opération
    displayOperation(operation, currentExercise);
}

// Génère un exercice selon le type
function generateExercise(operation) {
    const range = BONUS_CONFIG.RANGES[operation];

    switch (operation) {
        case 'addition':
            return generateAddition(range);
        case 'subtraction':
            return generateSubtraction(range);
        case 'multiplication':
            return generateMultiplication(range);
    }
}

// Génère une addition
function generateAddition(range) {
    const a = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const b = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const result = a + b;

    return { a, b, result, steps: [result] };
}

// Génère une soustraction (s'assurer que a > b)
function generateSubtraction(range) {
    let a = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    let b = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    if (b > a) [a, b] = [b, a];

    const result = a - b;
    return { a, b, result, steps: [result] };
}

// Génère une multiplication
function generateMultiplication(range) {
    const a = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const b = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    // Calculer les étapes intermédiaires
    const bStr = b.toString();
    const steps = [];

    for (let i = bStr.length - 1; i >= 0; i--) {
        const digit = parseInt(bStr[i]);
        const multiplier = Math.pow(10, bStr.length - 1 - i);
        steps.push(a * digit * multiplier);
    }

    const result = a * b;

    return { a, b, result, steps };
}

// Génère une division (s'assurer qu'elle tombe juste et que le résultat <= 99)
function generateDivision(range) {
    const b = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const result = Math.floor(Math.random() * 8) + 2; // Résultat entre 2 et 9 (max 99 quand b = 11)
    const a = b * result;

    return { a, b, result, steps: [result] };
}

// Affiche l'opération avec inputs
function displayOperation(operation, exercise) {
    const container = document.getElementById('operation-display');
    container.innerHTML = '';

    switch (operation) {
        case 'addition':
            displayAddition(container, exercise);
            break;
        case 'subtraction':
            displaySubtraction(container, exercise);
            break;
        case 'multiplication':
            displayMultiplication(container, exercise);
            break;
    }
}

// Affiche une addition posée
function displayAddition(container, exercise) {
    const maxOperandLength = Math.max(exercise.a.toString().length, exercise.b.toString().length);
    const resultLength = maxOperandLength + 1;
    const carryCount = maxOperandLength - 1;
    const aStr = exercise.a.toString();
    const bStr = exercise.b.toString();

    // Les retenues doivent commencer 1 position après le début (au-dessus du 2ème chiffre)
    const carrySpaces = 1;

    container.innerHTML = `
        <div class="operation-posed">
            <div class="operation-row carry-row">
                <span class="operation-symbol">&nbsp;</span>
                ${createCarryRow(carryCount, carrySpaces)}
            </div>
            <div class="operation-row">
                <span class="operation-symbol">&nbsp;</span>
                ${createAlignedNumber(aStr, resultLength)}
            </div>
            <div class="operation-row">
                <span class="operation-symbol">+</span>
                ${createAlignedNumber(bStr, resultLength)}
            </div>
            <div class="operation-line"></div>
            <div class="operation-row">
                <span class="operation-symbol">&nbsp;</span>
                ${createInputs(resultLength, 'result')}
            </div>
        </div>
    `;

    focusFirstInput();
}

// Affiche une soustraction posée
function displaySubtraction(container, exercise) {
    const maxLength = Math.max(exercise.a.toString().length, exercise.b.toString().length);
    const carryCount = maxLength - 1;
    const aStr = exercise.a.toString();
    const bStr = exercise.b.toString();

    // Les retenues doivent commencer 1 position après le début (au-dessus du 2ème chiffre)
    const carrySpaces = 1;

    container.innerHTML = `
        <div class="operation-posed">
            <div class="operation-row carry-row">
                <span class="operation-symbol">&nbsp;</span>
                ${createCarryRow(carryCount, carrySpaces)}
            </div>
            <div class="operation-row">
                <span class="operation-symbol">&nbsp;</span>
                ${createAlignedNumber(aStr, maxLength)}
            </div>
            <div class="operation-row">
                <span class="operation-symbol">-</span>
                ${createAlignedNumber(bStr, maxLength)}
            </div>
            <div class="operation-line"></div>
            <div class="operation-row">
                <span class="operation-symbol">&nbsp;</span>
                ${createInputs(maxLength, 'result')}
            </div>
        </div>
    `;

    focusFirstInput();
}

// Affiche une multiplication posée
function displayMultiplication(container, exercise) {
    const aStr = exercise.a.toString();
    const bStr = exercise.b.toString();
    const maxLength = Math.max(aStr.length, bStr.length);
    const resultLength = exercise.result.toString().length;

    // Calculer la longueur maximale de toutes les lignes
    const stepsLengths = exercise.steps.map(s => s.toString().length);
    const maxLineLength = Math.max(maxLength, resultLength, ...stepsLengths);

    let html = `
        <div class="operation-posed">
            <div class="operation-row">
                <span class="operation-symbol">&nbsp;</span>
                ${createAlignedNumber(aStr, maxLineLength)}
            </div>
            <div class="operation-row">
                <span class="operation-symbol">×</span>
                ${createAlignedNumber(bStr, maxLineLength)}
            </div>
            <div class="operation-line"></div>
    `;

    // Étapes intermédiaires (alignées à droite)
    exercise.steps.forEach((step, index) => {
        const stepLength = step.toString().length;
        html += `
            <div class="operation-row">
                <span class="operation-symbol">&nbsp;</span>
                ${createAlignedInputs(stepLength, maxLineLength, `step${index}`)}
            </div>`;
    });

    if (exercise.steps.length > 1) {
        html += `<div class="operation-line"></div>`;
    }

    html += `
            <div class="operation-row">
                <span class="operation-symbol">&nbsp;</span>
                ${createAlignedInputs(resultLength, maxLineLength, 'result')}
            </div>
        </div>
    `;

    container.innerHTML = html;
    focusFirstInput();
}

// Affiche une division posée
function displayDivision(container, exercise) {
    const resultLength = exercise.result.toString().length;
    const divisor = exercise.b.toString();
    const dividend = exercise.a.toString();

    container.innerHTML = `
        <div class="operation-posed division-posed">
            <div class="division-result">
                ${createInputs(resultLength, 'result')}
            </div>
            <div class="division-main">
                <span class="division-divisor">${divisor}</span>
                <span class="division-separator">│</span>
                <span class="division-dividend">${dividend}</span>
            </div>
        </div>
    `;

    focusFirstInput();
}

// Crée un nombre aligné (chaque chiffre dans un span)
function createAlignedNumber(number, totalLength) {
    const str = number.toString().padStart(totalLength, ' ');
    return str.split('').map(char =>
        char === ' ' ? '<span class="digit-space">&nbsp;</span>' : `<span class="digit-number">${char}</span>`
    ).join('');
}

// Crée une ligne de retenues avec alignement
function createCarryRow(carryCount, spacesCount) {
    let html = '';

    // Ajouter des espaces à gauche pour l'alignement
    for (let i = 0; i < spacesCount; i++) {
        html += '<span class="digit-space">&nbsp;</span>';
    }

    // Ajouter les inputs de retenues
    for (let i = 0; i < carryCount; i++) {
        html += `<input type="text" class="digit-input carry-input" data-index="${i}" data-carry="true" maxlength="1" inputmode="numeric" pattern="[0-9]">`;
    }

    return html;
}

// Crée des inputs pour saisir des chiffres
function createInputs(length, prefix) {
    let inputs = '';
    for (let i = 0; i < length; i++) {
        inputs += `<input type="text" class="digit-input" data-index="${i}" data-prefix="${prefix}" maxlength="1" inputmode="numeric" pattern="[0-9]">`;
    }
    return inputs;
}

// Crée des inputs alignés à droite (avec espaces à gauche)
function createAlignedInputs(inputLength, totalLength, prefix) {
    const spacesNeeded = totalLength - inputLength;
    let html = '';

    // Ajouter des espaces à gauche
    for (let i = 0; i < spacesNeeded; i++) {
        html += '<span class="digit-space">&nbsp;</span>';
    }

    // Ajouter les inputs
    for (let i = 0; i < inputLength; i++) {
        html += `<input type="text" class="digit-input" data-index="${i}" data-prefix="${prefix}" maxlength="1" inputmode="numeric" pattern="[0-9]">`;
    }

    return html;
}

// Focus sur le dernier input de la première ligne d'inputs (droite de la première ligne)
function focusFirstInput() {
    setTimeout(() => {
        const inputs = document.querySelectorAll('.digit-input');
        if (inputs.length > 0) {
            // Trouver le premier groupe d'inputs (première ligne)
            const firstPrefix = inputs[0].dataset.prefix;
            const firstLineInputs = Array.from(inputs).filter(input => input.dataset.prefix === firstPrefix);

            // Focus sur le dernier input de cette première ligne (le plus à droite)
            if (firstLineInputs.length > 0) {
                firstLineInputs[firstLineInputs.length - 1].focus();
            }

            setupInputNavigation();
        }
    }, 100);
}

// Navigation entre les inputs (de droite à gauche, puis ligne suivante)
function setupInputNavigation() {
    const inputs = document.querySelectorAll('.digit-input');

    // Grouper les inputs par ligne (prefix)
    const inputsByLine = {};
    inputs.forEach(input => {
        const prefix = input.dataset.prefix;
        if (!inputsByLine[prefix]) {
            inputsByLine[prefix] = [];
        }
        inputsByLine[prefix].push(input);
    });

    // Obtenir l'ordre des lignes
    const lineOrder = Object.keys(inputsByLine);

    inputs.forEach((input, globalIndex) => {
        input.addEventListener('input', (e) => {
            // Autoriser uniquement les chiffres
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            if (e.target.value) {
                const currentPrefix = e.target.dataset.prefix;
                const currentLine = inputsByLine[currentPrefix];
                const indexInLine = currentLine.indexOf(e.target);

                // Si on n'est pas au début de la ligne, aller à gauche
                if (indexInLine > 0) {
                    currentLine[indexInLine - 1].focus();
                } else {
                    // On est au début de la ligne, passer à la ligne suivante
                    const currentLineIndex = lineOrder.indexOf(currentPrefix);
                    if (currentLineIndex < lineOrder.length - 1) {
                        const nextLinePrefix = lineOrder[currentLineIndex + 1];
                        const nextLine = inputsByLine[nextLinePrefix];
                        // Focus sur le dernier input de la ligne suivante (droite)
                        nextLine[nextLine.length - 1].focus();
                    }
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            const currentPrefix = e.target.dataset.prefix;
            const currentLine = inputsByLine[currentPrefix];
            const indexInLine = currentLine.indexOf(e.target);

            // Tab : aller à gauche dans la ligne
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                if (indexInLine > 0) {
                    currentLine[indexInLine - 1].focus();
                } else {
                    // Passer à la ligne suivante
                    const currentLineIndex = lineOrder.indexOf(currentPrefix);
                    if (currentLineIndex < lineOrder.length - 1) {
                        const nextLinePrefix = lineOrder[currentLineIndex + 1];
                        const nextLine = inputsByLine[nextLinePrefix];
                        nextLine[nextLine.length - 1].focus();
                    }
                }
            }

            // Shift+Tab : aller à droite dans la ligne
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                if (indexInLine < currentLine.length - 1) {
                    currentLine[indexInLine + 1].focus();
                } else {
                    // Passer à la ligne précédente
                    const currentLineIndex = lineOrder.indexOf(currentPrefix);
                    if (currentLineIndex > 0) {
                        const prevLinePrefix = lineOrder[currentLineIndex - 1];
                        const prevLine = inputsByLine[prevLinePrefix];
                        prevLine[0].focus();
                    }
                }
            }

            // Retour arrière : aller à droite dans la ligne si vide
            if (e.key === 'Backspace' && !e.target.value && indexInLine < currentLine.length - 1) {
                currentLine[indexInLine + 1].focus();
            }

            // Flèches : gauche/droite dans la ligne
            if (e.key === 'ArrowLeft' && indexInLine > 0) {
                currentLine[indexInLine - 1].focus();
            }
            if (e.key === 'ArrowRight' && indexInLine < currentLine.length - 1) {
                currentLine[indexInLine + 1].focus();
            }

            // Flèches haut/bas : changer de ligne
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const currentLineIndex = lineOrder.indexOf(currentPrefix);
                if (currentLineIndex > 0) {
                    const prevLinePrefix = lineOrder[currentLineIndex - 1];
                    const prevLine = inputsByLine[prevLinePrefix];
                    const targetIndex = Math.min(indexInLine, prevLine.length - 1);
                    prevLine[targetIndex].focus();
                }
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const currentLineIndex = lineOrder.indexOf(currentPrefix);
                if (currentLineIndex < lineOrder.length - 1) {
                    const nextLinePrefix = lineOrder[currentLineIndex + 1];
                    const nextLine = inputsByLine[nextLinePrefix];
                    const targetIndex = Math.min(indexInLine, nextLine.length - 1);
                    nextLine[targetIndex].focus();
                }
            }

            // Enter pour valider
            if (e.key === 'Enter') {
                validateAnswer();
            }
        });

        // Touch events pour mobile/tablette
        input.addEventListener('focus', (e) => {
            // Scroll l'input en vue si nécessaire
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
}

// Efface tous les inputs
function clearInputs() {
    document.querySelectorAll('.digit-input').forEach(input => {
        input.value = '';
        input.classList.remove('correct', 'incorrect');
    });
    focusFirstInput();
}

// Valide la réponse
function validateAnswer() {
    const allInputs = document.querySelectorAll('.digit-input:not([data-carry])');

    // Grouper les inputs par préfixe (result, step0, step1, etc.)
    const answers = {};
    allInputs.forEach(input => {
        const prefix = input.dataset.prefix;
        if (!answers[prefix]) answers[prefix] = '';
        answers[prefix] += input.value;
    });

    // Vérifier chaque réponse
    let allCorrect = true;

    if (currentOperation === 'multiplication' && currentExercise.steps.length > 1) {
        // Vérifier les étapes intermédiaires
        currentExercise.steps.forEach((step, index) => {
            const stepAnswer = answers[`step${index}`];
            if (parseInt(stepAnswer) !== step) {
                allCorrect = false;
                markInputsAs(`step${index}`, 'incorrect');
            } else {
                markInputsAs(`step${index}`, 'correct');
            }
        });
    }

    // Vérifier le résultat final
    const finalAnswer = parseInt(answers.result);
    if (finalAnswer !== currentExercise.result) {
        allCorrect = false;
        markInputsAs('result', 'incorrect');
    } else {
        markInputsAs('result', 'correct');
    }

    // Afficher le résultat
    if (allCorrect) {
        handleSuccess();
    } else {
        handleError();
    }
}

// Marque les inputs d'un groupe
function markInputsAs(prefix, className) {
    document.querySelectorAll(`.digit-input[data-prefix="${prefix}"]`).forEach(input => {
        input.classList.remove('correct', 'incorrect');
        input.classList.add(className);
    });
}

// Gère le succès
function handleSuccess() {
    const reward = BONUS_CONFIG.REWARDS[currentOperation];

    // Sauvegarder dans l'historique
    saveToHistory(true);

    // Mettre à jour le compteur
    const data = UTILS.loadFromStorage(BONUS_CONFIG.STORAGE_KEY, {});
    data[currentOperation] = (data[currentOperation] || 0) + 1;
    UTILS.saveToStorage(BONUS_CONFIG.STORAGE_KEY, data);

    // Mettre à jour les stats
    updateStats(currentOperation, true, reward);

    // Ajouter les crédits
    let credits = UTILS.loadFromStorage(CONFIG.STORAGE_KEYS.CREDITS, CONFIG.CREDITS.INITIAL);
    credits = Math.min(credits + reward, CONFIG.CREDITS.MAX_STORED);
    UTILS.saveToStorage(CONFIG.STORAGE_KEYS.CREDITS, credits);

    // Afficher le message
    const resultMsg = document.getElementById('result-message');
    resultMsg.textContent = `🎉 Bravo ! Tu as gagné ${reward} carte${reward > 1 ? 's' : ''} !`;
    resultMsg.className = 'result-message success show';

    showToast(`🎁 +${reward} carte${reward > 1 ? 's' : ''} !`);

    // Retour à la sélection après 2 secondes
    setTimeout(() => {
        updateRemainingCounts();
        updateStatsDisplay();
        showScreen('selection');
        resultMsg.classList.remove('show');
        currentOperation = null;
        currentExercise = null;
    }, 2000);
}

// Gère l'erreur
function handleError() {
    // Sauvegarder dans l'historique
    saveToHistory(false);

    // Incrémenter le compteur (échec = essai utilisé)
    const data = UTILS.loadFromStorage(BONUS_CONFIG.STORAGE_KEY, {});
    data[currentOperation] = (data[currentOperation] || 0) + 1;
    UTILS.saveToStorage(BONUS_CONFIG.STORAGE_KEY, data);

    // Mettre à jour les stats
    updateStats(currentOperation, false, 0);

    const resultMsg = document.getElementById('result-message');
    resultMsg.textContent = '❌ Oups ! C\'était pas bon, tu as perdu un essai !';
    resultMsg.className = 'result-message error show';

    showToast('❌ Mauvaise réponse ! Un essai en moins.');

    // Retour à la sélection après 2 secondes
    setTimeout(() => {
        updateRemainingCounts();
        updateStatsDisplay();
        showScreen('selection');
        resultMsg.classList.remove('show');
        currentOperation = null;
        currentExercise = null;
    }, 2000);
}

// Affiche un toast
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Sauvegarde dans l'historique
function saveToHistory(success) {
    const history = UTILS.loadFromStorage(BONUS_CONFIG.HISTORY_KEY, []);
    const today = new Date().toDateString();

    // Récupérer les réponses de l'utilisateur
    const userAnswers = {};
    const allInputs = document.querySelectorAll('.digit-input');
    allInputs.forEach(input => {
        const prefix = input.dataset.prefix;
        if (!userAnswers[prefix]) userAnswers[prefix] = '';
        userAnswers[prefix] += input.value;
    });

    const entry = {
        date: today,
        timestamp: Date.now(),
        operation: currentOperation,
        exercise: currentExercise,
        userAnswers: userAnswers,
        success: success,
        cardsEarned: success ? BONUS_CONFIG.REWARDS[currentOperation] : 0
    };

    history.push(entry);
    UTILS.saveToStorage(BONUS_CONFIG.HISTORY_KEY, history);
}

// Met à jour les statistiques
function updateStats(operation, success, cardsEarned) {
    const today = new Date().toDateString();
    const stats = UTILS.loadFromStorage(BONUS_CONFIG.STATS_KEY, {});

    // Réinitialiser si nouveau jour
    if (stats.date !== today) {
        stats.date = today;
        stats.addition = { success: 0, failed: 0, cards: 0 };
        stats.subtraction = { success: 0, failed: 0, cards: 0 };
        stats.multiplication = { success: 0, failed: 0, cards: 0 };
    }

    // Mettre à jour les stats
    if (!stats[operation]) {
        stats[operation] = { success: 0, failed: 0, cards: 0 };
    }

    if (success) {
        stats[operation].success++;
        stats[operation].cards += cardsEarned;
    } else {
        stats[operation].failed++;
    }

    UTILS.saveToStorage(BONUS_CONFIG.STATS_KEY, stats);
}

// Affiche les statistiques du jour
function updateStatsDisplay() {
    const today = new Date().toDateString();
    const stats = UTILS.loadFromStorage(BONUS_CONFIG.STATS_KEY, {});

    // Créer le conteneur s'il n'existe pas
    let statsContainer = document.getElementById('stats-display');
    if (!statsContainer) {
        statsContainer = document.createElement('div');
        statsContainer.id = 'stats-display';
        statsContainer.className = 'stats-display';
        const selectionScreen = document.getElementById('selection-screen');
        if (selectionScreen) {
            selectionScreen.appendChild(statsContainer);
        }
    }

    // Si pas de stats ou ancien jour
    if (!stats.date || stats.date !== today) {
        statsContainer.innerHTML = '<p class="stats-empty">Aucune carte gagnée aujourd\'hui</p>';
        return;
    }

    // Calculer le total
    const additionSucces = stats.addition?.success || 0;
    const subtractionSuccess = stats.subtraction?.success || 0;
    const multiplicationSuccess = stats.multiplication?.success || 0;

    const additionCards = additionSucces * BONUS_CONFIG.REWARDS.addition;
    const subtractionCards = subtractionSuccess * BONUS_CONFIG.REWARDS.subtraction;
    const multiplicationCards = multiplicationSuccess * BONUS_CONFIG.REWARDS.multiplication;

    const total = additionCards + subtractionCards + multiplicationCards;

    if (total === 0) {
        statsContainer.innerHTML = '<p class="stats-empty">Aucune carte gagnée aujourd\'hui</p>';
        return;
    }

    // Construire le calcul
    const parts = [];
    if (additionSucces > 0) parts.push(`(${additionSucces} × 1)`);
    if (subtractionSuccess > 0) parts.push(`(${subtractionSuccess} × 2)`);
    if (multiplicationSuccess > 0) parts.push(`(${multiplicationSuccess} × 5)`);

    const calculation = parts.join(' + ');

    statsContainer.innerHTML = `
        <div class="stats-title">🎁 Cartes gagnées aujourd'hui :</div>
        <div class="stats-calculation">${calculation} = <strong>${total}</strong> carte${total > 1 ? 's' : ''}</div>
    `;
}
