// Bonus Mathématiques - Logique

// Configuration des bonus
const BONUS_CONFIG = {
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
let currentUser = null; // Utilisateur connecté

// Initialisation du système de bonus (appelée depuis index.html après l'auth)
async function initializeBonus() {
    // Récupérer l'utilisateur connecté
    currentUser = authService.getCurrentUser();

    if (!currentUser) {
        console.error('User not authenticated');
        window.location.href = '/';
        return;
    }

    // Créer le header de page
    PageHeader.render({
        icon: '🎓',
        title: 'Bonus Mathématiques',
        subtitle: 'Résous des opérations pour gagner des cartes bonus !',
        actions: [
            { icon: '📊', text: 'Historique', id: 'history-btn' },
            { icon: '🔙', text: 'Retour', id: 'back-btn' }
        ]
    });

    // Configurer les événements
    setupEventListeners();

    // Mettre à jour l'affichage
    await updateRemainingCounts();
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Bouton retour - ramène sur la sélection si en exercice, sinon page d'accueil
    document.getElementById('back-btn').addEventListener('click', () => {
        const exerciseScreen = document.getElementById('exercise-screen');
        if (exerciseScreen.classList.contains('active')) {
            // Si on est dans un exercice, retour à la sélection
            showScreen('selection');
            currentOperation = null;
            currentExercise = null;
        } else {
            // Sinon retour à l'accueil (page des cartes)
            window.location.href = '../cards/index.html';
        }
    });

    document.getElementById('history-btn').addEventListener('click', () => {
        window.location.href = 'historique.html';
    });

    // Sélection d'opération
    document.querySelectorAll('.operation-card').forEach(card => {
        card.addEventListener('click', async (e) => {
            const operation = card.dataset.operation;
            if (await canDoOperation(operation)) {
                startOperation(operation);
            }
        });
    });

    // Boutons de validation
    document.getElementById('validate-btn').addEventListener('click', validateAnswer);
    document.getElementById('clear-btn').addEventListener('click', clearInputs);
}

// Charge les tentatives d'aujourd'hui depuis l'API
async function getTodayAttempts() {
    try {
        const response = await authService.fetchAPI(`/users/${currentUser.id}/attempts`);
        const allAttempts = await response.json();

        // Filtrer pour aujourd'hui uniquement
        const today = new Date().toDateString();
        return allAttempts.filter(attempt => {
            const attemptDate = new Date(attempt.created_at).toDateString();
            return attemptDate === today;
        });
    } catch (error) {
        console.error('Failed to load attempts:', error);
        return [];
    }
}

// Compte les tentatives par type d'opération
function countAttemptsByOperation(attempts) {
    const counts = {
        addition: 0,
        subtraction: 0,
        multiplication: 0
    };

    attempts.forEach(attempt => {
        try {
            const exercise = JSON.parse(attempt.exercise);
            if (exercise.operation && counts.hasOwnProperty(exercise.operation)) {
                counts[exercise.operation]++;
            }
        } catch (e) {
            console.error('Failed to parse attempt:', e);
        }
    });

    return counts;
}

// Vérifie si l'opération est disponible
async function canDoOperation(operation) {
    const attempts = await getTodayAttempts();
    const counts = countAttemptsByOperation(attempts);
    return counts[operation] < BONUS_CONFIG.MAX_OPERATIONS_PER_TYPE;
}

// Met à jour les compteurs restants
async function updateRemainingCounts() {
    const attempts = await getTodayAttempts();
    const counts = countAttemptsByOperation(attempts);
    let totalRemaining = 0;

    ['addition', 'subtraction', 'multiplication'].forEach(operation => {
        const used = counts[operation] || 0;
        const remaining = BONUS_CONFIG.MAX_OPERATIONS_PER_TYPE - used;
        totalRemaining += remaining;
        document.getElementById(`remaining-${operation}`).textContent = remaining;

        // Désactiver si épuisé
        const card = document.querySelector(`.operation-card[data-operation="${operation}"]`);
        if (remaining <= 0) {
            card.classList.add('disabled');
        } else {
            card.classList.remove('disabled');
        }
    });

    // Mettre à jour la sidebar si elle existe
    if (window.navigationUI) {
        const totalMax = BONUS_CONFIG.MAX_OPERATIONS_PER_TYPE * 3; // 3 types d'opérations
        navigationUI.updateMathAttempts(totalRemaining, totalMax);
    }
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
        const inputs = document.querySelectorAll('.digit-input:not([data-carry])');
        if (inputs.length > 0) {
            // Trouver le premier groupe d'inputs non-retenue (première ligne)
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
async function handleSuccess() {
    const reward = BONUS_CONFIG.REWARDS[currentOperation];

    // Sauvegarder l'exercice dans l'historique via API
    await saveExerciseToAPI(true);

    // Ajouter les crédits via API
    await addCreditsViaAPI(reward);

    // Afficher le message
    const resultMsg = document.getElementById('result-message');
    resultMsg.textContent = `🎉 Bravo ! Tu as gagné ${reward} carte${reward > 1 ? 's' : ''} !`;
    resultMsg.className = 'result-message success show';

    showToast(`🎁 +${reward} carte${reward > 1 ? 's' : ''} !`);

    // Retour à la sélection après 2 secondes
    setTimeout(async () => {
        await updateRemainingCounts();
        showScreen('selection');
        resultMsg.classList.remove('show');
        currentOperation = null;
        currentExercise = null;

        // Rafraîchir la sidebar
        if (window.navigationUI) {
            await navigationUI.refresh();
        }
    }, 2000);
}

// Gère l'erreur
async function handleError() {
    // Sauvegarder l'exercice raté dans l'historique via API
    await saveExerciseToAPI(false);

    const resultMsg = document.getElementById('result-message');
    resultMsg.textContent = '❌ Oups ! C\'était pas bon, tu as perdu un essai !';
    resultMsg.className = 'result-message error show';

    showToast('❌ Mauvaise réponse ! Un essai en moins.');

    // Retour à la sélection après 2 secondes
    setTimeout(async () => {
        await updateRemainingCounts();
        showScreen('selection');
        resultMsg.classList.remove('show');
        currentOperation = null;
        currentExercise = null;

        // Rafraîchir la sidebar
        if (window.navigationUI) {
            await navigationUI.refresh();
        }
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

// Sauvegarde l'exercice dans l'API
async function saveExerciseToAPI(success) {
    try {
        // Récupérer les réponses de l'utilisateur
        const userAnswers = {};
        const allInputs = document.querySelectorAll('.digit-input');
        allInputs.forEach(input => {
            const prefix = input.dataset.prefix;
            if (!userAnswers[prefix]) userAnswers[prefix] = '';
            userAnswers[prefix] += input.value;
        });

        // Construire l'objet exercice avec toutes les informations
        const exerciseData = {
            operation: currentOperation,
            exercise: currentExercise,
            userAnswers: userAnswers,
            cardsEarned: success ? BONUS_CONFIG.REWARDS[currentOperation] : 0
        };

        // Sauvegarder via API
        const response = await authService.fetchAPI(`/users/${currentUser.id}/attempts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                exercise: JSON.stringify(exerciseData),
                success: success
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save exercise');
        }
    } catch (error) {
        console.error('Failed to save exercise to API:', error);
        showToast('⚠️ Erreur lors de la sauvegarde');
    }
}

// Ajoute des crédits via l'API
async function addCreditsViaAPI(amount) {
    try {
        const response = await authService.fetchAPI(`/users/${currentUser.id}/credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });

        if (!response.ok) {
            throw new Error('Failed to add credits');
        }
    } catch (error) {
        console.error('Failed to add credits via API:', error);
        showToast('⚠️ Erreur lors de l\'ajout des crédits');
    }
}
