/**
 * Constantes globales de l'application
 * Évite les "magic numbers" dispersés dans le code
 */

// Crédits et récompenses
const CREDITS = {
    INITIAL_ADMIN: 5,
    INITIAL_DEMO: 10,
    BONUS_STREAK_3: 2,
    BONUS_LEVEL_COMPLETE: 10
};

// Limites de jeu
const GAME_LIMITS = {
    MAX_ATTEMPTS_PER_DAY: 3,
    MAX_SEQUENCE_LEVEL: 8,
    STREAK_FOR_LEVEL_UP: 2,
    STREAK_FOR_BONUS: 3
};

// Scores
const SCORES = {
    CORRECT_ANSWER: 10,
    CORRECT_WITH_HINT: 5
};

// Temps et délais (en millisecondes)
const DELAYS = {
    TOAST_DEFAULT: 3000,
    TOAST_HINT: 4000,
    NEXT_QUESTION: 2000,
    AFTER_ERROR: 2500
};

// Tailles de grilles
const GRID_SIZES = {
    WORD_SEARCH_MIN: 8,
    WORD_SEARCH_MAX: 12,
    SUDOKU: 9
};

// Exports pour utilisation dans les modules
if (typeof window !== 'undefined') {
    window.APP_CONSTANTS = {
        CREDITS,
        GAME_LIMITS,
        SCORES,
        DELAYS,
        GRID_SIZES
    };
}
