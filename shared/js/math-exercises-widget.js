// Widget pour le module math-exercises
// S'auto-initialise si le bouton bonus est présent dans la page

class MathExercisesWidget {
    constructor() {
        this.BONUS_STORAGE_KEY = 'bonus_operations_count';
        this.MAX_PER_TYPE = 3;
    }

    // Initialise le widget s'il trouve son bouton dans le DOM
    init() {
        const bonusBtn = document.getElementById('bonus-btn');
        if (!bonusBtn) return; // Le bouton n'existe pas, le module est désactivé

        this.setupBonusButton();
        this.updateBonusCounter();

        // Met à jour le compteur toutes les secondes
        setInterval(() => this.updateBonusCounter(), 1000);
    }

    // Met à jour le compteur du bouton Bonus
    updateBonusCounter() {
        const bonusBtn = document.getElementById('bonus-btn');
        const bonusCounter = document.getElementById('bonus-counter');
        if (!bonusBtn || !bonusCounter) return;

        const today = new Date().toDateString();
        const stored = UTILS.loadFromStorage(this.BONUS_STORAGE_KEY, {});

        // Réinitialiser si nouveau jour
        if (stored.date !== today) {
            const used = 0;
            bonusCounter.textContent = `${used}/9`;
            bonusBtn.classList.remove('disabled');
            return;
        }

        // Calculer le total utilisé
        const usedAddition = stored.addition || 0;
        const usedSubtraction = stored.subtraction || 0;
        const usedMultiplication = stored.multiplication || 0;
        const totalUsed = usedAddition + usedSubtraction + usedMultiplication;
        const totalMax = this.MAX_PER_TYPE * 3; // 3 types × 3 essais

        bonusCounter.textContent = `${totalUsed}/${totalMax}`;

        // Griser si tout est utilisé
        if (totalUsed >= totalMax) {
            bonusBtn.classList.add('disabled');
            bonusBtn.disabled = true;
        } else {
            bonusBtn.classList.remove('disabled');
            bonusBtn.disabled = false;
        }
    }

    // Configure le bouton Bonus
    setupBonusButton() {
        const bonusBtn = document.getElementById('bonus-btn');
        if (!bonusBtn) return;

        bonusBtn.addEventListener('click', () => {
            if (!bonusBtn.disabled) {
                window.location.href = '../math-exercises/bonus.html';
            }
        });
    }
}

// Auto-initialisation au chargement du DOM
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const widget = new MathExercisesWidget();
        widget.init();
    });
}
