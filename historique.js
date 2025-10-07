// Historique - Logique

const HISTORY_CONFIG = {
    HISTORY_KEY: 'bonus_operations_history',
    STATS_KEY: 'bonus_operations_stats'
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadHistory();
});

// Configuration des écouteurs
function setupEventListeners() {
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'bonus.html';
    });

    document.getElementById('debug-btn').addEventListener('click', () => {
        if (confirm('⚠️ Ceci va effacer toutes les données et créer des données de test. Continuer ?')) {
            createDebugData();
            loadHistory();
        }
    });
}

// Charge et affiche l'historique
function loadHistory() {
    let history = UTILS.loadFromStorage(HISTORY_CONFIG.HISTORY_KEY, []);

    // Ne garder que les 7 derniers jours
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    history = history.filter(entry => entry.timestamp >= sevenDaysAgo);

    // Sauvegarder l'historique nettoyé
    UTILS.saveToStorage(HISTORY_CONFIG.HISTORY_KEY, history);

    const container = document.getElementById('history-by-day');
    const emptyState = document.getElementById('empty-state');

    if (history.length === 0) {
        container.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }

    emptyState.classList.remove('show');

    // Grouper par jour
    const byDay = {};
    history.forEach(entry => {
        if (!byDay[entry.date]) {
            byDay[entry.date] = [];
        }
        byDay[entry.date].push(entry);
    });

    // Convertir en tableau et trier par date (plus récent en premier)
    const days = Object.keys(byDay).sort((a, b) => {
        return new Date(b) - new Date(a);
    });

    // Afficher
    container.innerHTML = days.map(date => renderDaySection(date, byDay[date])).join('');

    // Ajouter les event listeners pour les clics
    setupDetailListeners(byDay);
}

// Configure les listeners pour ouvrir les détails
function setupDetailListeners(byDay) {
    document.querySelectorAll('.operation-stat.clickable').forEach(card => {
        card.addEventListener('click', () => {
            const operation = card.dataset.operation;
            const dateStr = card.dataset.date;
            const detailsId = `details-${dateStr.replace(/\s/g, '-')}`;
            const detailsSection = document.getElementById(detailsId);

            // Toggle : si déjà ouvert sur cette opération, fermer
            const isAlreadyOpen = detailsSection.style.display === 'block' &&
                                 detailsSection.dataset.currentOperation === operation;

            if (isAlreadyOpen) {
                detailsSection.style.display = 'none';
                detailsSection.dataset.currentOperation = '';
            } else {
                // Afficher les détails de cette opération
                const entries = byDay[dateStr].filter(e => e.operation === operation);
                detailsSection.innerHTML = renderDetails(entries, operation);
                detailsSection.style.display = 'block';
                detailsSection.dataset.currentOperation = operation;
            }
        });
    });
}

// Affiche les détails des calculs
function renderDetails(entries, operation) {
    const operationLabels = {
        addition: '➕ Addition',
        subtraction: '➖ Soustraction',
        multiplication: '✖️ Multiplication'
    };

    return `
        <div class="details-header">
            ${operationLabels[operation]} - Détails des calculs
        </div>
        <div class="calculations-list">
            ${entries.map(entry => renderCalculation(entry)).join('')}
        </div>
    `;
}

// Affiche un calcul individuel
function renderCalculation(entry) {
    const time = new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const successClass = entry.success ? 'success' : 'failed';
    const successIcon = entry.success ? '✅' : '❌';
    const calcDisplay = formatOperation(entry);

    return `
        <div class="calculation-item ${successClass}">
            <div class="calculation-header">
                <span class="calculation-time">${time}</span>
                <span class="calculation-result">${successIcon} ${entry.success ? 'Réussi' : 'Raté'}</span>
            </div>
            <div class="calculation-display">${calcDisplay}</div>
        </div>
    `;
}

// Formate l'affichage d'une opération
function formatOperation(entry) {
    const { operation, exercise, userAnswers, success } = entry;

    if (operation === 'addition' || operation === 'subtraction') {
        const symbol = operation === 'addition' ? '+' : '-';
        const maxLength = Math.max(exercise.a.toString().length, exercise.b.toString().length, exercise.result.toString().length);

        const aStr = exercise.a.toString().padStart(maxLength);
        const bStr = exercise.b.toString().padStart(maxLength);
        const resultStr = userAnswers.result || '?'.repeat(exercise.result.toString().length);
        const correctResult = exercise.result.toString().padStart(maxLength);

        let display = `  ${aStr}\n${symbol} ${bStr}\n${'─'.repeat(maxLength + 2)}\n  ${resultStr.padStart(maxLength)}`;

        if (!success) {
            display += `\n\n✓ Bonne réponse: ${correctResult}`;
        }

        return display;
    }

    if (operation === 'multiplication') {
        const aStr = exercise.a.toString();
        const bStr = exercise.b.toString();
        const maxLength = Math.max(aStr.length, bStr.length);

        // Trouver la longueur maximale de toutes les lignes
        const stepsLengths = exercise.steps.map(s => s.toString().length);
        const resultLength = exercise.result.toString().length;
        const maxLineLength = Math.max(maxLength, resultLength, ...stepsLengths);

        let display = `  ${aStr.padStart(maxLineLength)}\n× ${bStr.padStart(maxLineLength)}\n${'─'.repeat(maxLineLength + 2)}\n`;

        // Étapes intermédiaires (alignées à droite)
        exercise.steps.forEach((step, index) => {
            const userStep = userAnswers[`step${index}`] || '?'.repeat(step.toString().length);
            display += `  ${userStep.padStart(maxLineLength)}\n`;
        });

        if (exercise.steps.length > 1) {
            display += `${'─'.repeat(maxLineLength + 2)}\n`;
        }

        const userResult = userAnswers.result || '?'.repeat(exercise.result.toString().length);
        display += `  ${userResult.padStart(maxLineLength)}`;

        if (!success) {
            display += `\n\n✓ Bonne réponse: ${exercise.result}`;
            exercise.steps.forEach((step, index) => {
                display += `\n  Étape ${index + 1}: ${step}`;
            });
        }

        return display;
    }

    return 'Opération inconnue';
}

// Affiche une section pour un jour
function renderDaySection(dateStr, entries) {
    const date = new Date(dateStr);
    const isToday = dateStr === new Date().toDateString();
    const displayDate = isToday ? '📅 Aujourd\'hui' : `📅 ${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`;

    // Calculer les stats par type d'opération
    const stats = {
        addition: { total: 0, success: 0, cards: 0 },
        subtraction: { total: 0, success: 0, cards: 0 },
        multiplication: { total: 0, success: 0, cards: 0 }
    };

    entries.forEach(entry => {
        if (stats[entry.operation]) {
            stats[entry.operation].total++;
            if (entry.success) {
                stats[entry.operation].success++;
                stats[entry.operation].cards += entry.cardsEarned;
            }
        }
    });

    const totalCards = stats.addition.cards + stats.subtraction.cards + stats.multiplication.cards;

    return `
        <div class="day-section" data-date="${dateStr}">
            <div class="day-header">${displayDate}</div>
            <div class="operations-grid">
                ${renderOperationStat('➕ Addition', stats.addition, 'addition', dateStr)}
                ${renderOperationStat('➖ Soustraction', stats.subtraction, 'subtraction', dateStr)}
                ${renderOperationStat('✖️ Multiplication', stats.multiplication, 'multiplication', dateStr)}
            </div>
            <div class="day-total">
                Total : <strong>${totalCards}</strong> carte${totalCards > 1 ? 's' : ''} gagnée${totalCards > 1 ? 's' : ''}
            </div>
            <div class="details-section" id="details-${dateStr.replace(/\s/g, '-')}" style="display: none;"></div>
        </div>
    `;
}

// Affiche les stats d'un type d'opération
function renderOperationStat(label, stat, operationType, dateStr) {
    const hasData = stat.total > 0;
    const rate = hasData ? Math.round((stat.success / stat.total) * 100) : 0;

    let rateClass = '';
    if (hasData) {
        if (rate >= 80) rateClass = 'good';
        else if (rate >= 50) rateClass = 'medium';
        else rateClass = 'bad';
    }

    const displayRate = hasData ? `${rate}%` : '-';
    const displayDetails = hasData ? `${stat.success}/${stat.total} · ${stat.cards} 🎁` : 'Aucune opération';
    const clickableClass = hasData ? 'clickable' : '';
    const dataAttr = hasData ? `data-operation="${operationType}" data-date="${dateStr}"` : '';

    return `
        <div class="operation-stat ${hasData ? 'has-data' : 'no-data'} ${clickableClass}" ${dataAttr}>
            <div class="operation-stat-header">${label}</div>
            <div class="operation-stat-details">${displayDetails}</div>
            <div class="operation-stat-rate ${rateClass}">${displayRate}</div>
        </div>
    `;
}

// Crée des données de test
function createDebugData() {
    // Vider le localStorage
    localStorage.clear();

    const history = [];
    const now = Date.now();

    // Helper pour créer une entrée
    const createEntry = (daysAgo, operation, success) => {
        const timestamp = now - (daysAgo * 24 * 60 * 60 * 1000);
        const date = new Date(timestamp).toDateString();

        let exercise, userAnswers;

        if (operation === 'addition') {
            const a = Math.floor(Math.random() * 9000) + 100;
            const b = Math.floor(Math.random() * 9000) + 100;
            exercise = { a, b, result: a + b, steps: [a + b] };
            userAnswers = { result: success ? (a + b).toString() : (a + b + 10).toString() };
        } else if (operation === 'subtraction') {
            const a = Math.floor(Math.random() * 900) + 100;
            const b = Math.floor(Math.random() * a);
            exercise = { a, b, result: a - b, steps: [a - b] };
            userAnswers = { result: success ? (a - b).toString() : (a - b + 5).toString() };
        } else { // multiplication
            const a = Math.floor(Math.random() * 90) + 10;
            const b = Math.floor(Math.random() * 90) + 10;
            const result = a * b;
            const bStr = b.toString();
            const steps = [];
            for (let i = bStr.length - 1; i >= 0; i--) {
                const digit = parseInt(bStr[i]);
                const multiplier = Math.pow(10, bStr.length - 1 - i);
                steps.push(a * digit * multiplier);
            }
            exercise = { a, b, result, steps };
            userAnswers = {};
            steps.forEach((step, i) => {
                userAnswers[`step${i}`] = success ? step.toString() : (step + 1).toString();
            });
            userAnswers.result = success ? result.toString() : (result + 1).toString();
        }

        const rewards = { addition: 1, subtraction: 2, multiplication: 5 };

        return {
            date,
            timestamp,
            operation,
            exercise,
            userAnswers,
            success,
            cardsEarned: success ? rewards[operation] : 0
        };
    };

    // Jour 0 (aujourd'hui) - Toutes les opérations, bonnes perfs
    history.push(createEntry(0, 'addition', true));
    history.push(createEntry(0, 'addition', true));
    history.push(createEntry(0, 'addition', true));
    history.push(createEntry(0, 'subtraction', true));
    history.push(createEntry(0, 'subtraction', true));
    history.push(createEntry(0, 'subtraction', false));
    history.push(createEntry(0, 'multiplication', true));
    history.push(createEntry(0, 'multiplication', true));

    // Jour 1 - Seulement additions et soustractions
    history.push(createEntry(1, 'addition', true));
    history.push(createEntry(1, 'addition', false));
    history.push(createEntry(1, 'addition', true));
    history.push(createEntry(1, 'subtraction', true));
    history.push(createEntry(1, 'subtraction', true));

    // Jour 2 - Toutes les opérations, perfs moyennes
    history.push(createEntry(2, 'addition', true));
    history.push(createEntry(2, 'addition', false));
    history.push(createEntry(2, 'subtraction', true));
    history.push(createEntry(2, 'subtraction', false));
    history.push(createEntry(2, 'multiplication', false));
    history.push(createEntry(2, 'multiplication', true));

    // Jour 3 - Seulement multiplications (difficile!)
    history.push(createEntry(3, 'multiplication', false));
    history.push(createEntry(3, 'multiplication', false));
    history.push(createEntry(3, 'multiplication', true));

    // Jour 4 - Peu d'opérations
    history.push(createEntry(4, 'addition', true));
    history.push(createEntry(4, 'subtraction', true));

    // Jour 5 - Rien (jour sauté)

    // Jour 6 - Toutes réussies!
    history.push(createEntry(6, 'addition', true));
    history.push(createEntry(6, 'addition', true));
    history.push(createEntry(6, 'subtraction', true));
    history.push(createEntry(6, 'subtraction', true));
    history.push(createEntry(6, 'multiplication', true));
    history.push(createEntry(6, 'multiplication', true));

    UTILS.saveToStorage(HISTORY_CONFIG.HISTORY_KEY, history);
    alert('✅ Données de test créées !');
}
