/**
 * Helper pour gérer les timers de jeu
 * Évite la duplication de code dans les modules de jeu
 */
class TimerHelper {
    /**
     * Crée une nouvelle instance de timer
     * @param {Function} updateCallback - Fonction appelée à chaque tick (optionnel)
     */
    constructor(updateCallback = null) {
        this.timer = 0;
        this.interval = null;
        this.updateCallback = updateCallback;
    }

    /**
     * Démarre le timer à 0
     * Si un timer est déjà en cours, il est arrêté et réinitialisé
     */
    start() {
        this.stop();
        this.timer = 0;
        this.interval = setInterval(() => {
            this.timer++;
            if (this.updateCallback) {
                this.updateCallback(this.timer);
            }
        }, 1000);
    }

    /**
     * Arrête le timer
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Met en pause le timer (garde la valeur actuelle)
     */
    pause() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Reprend le timer après une pause
     */
    resume() {
        if (!this.interval) {
            this.interval = setInterval(() => {
                this.timer++;
                if (this.updateCallback) {
                    this.updateCallback(this.timer);
                }
            }, 1000);
        }
    }

    /**
     * Réinitialise le timer à 0 (sans le démarrer)
     */
    reset() {
        this.stop();
        this.timer = 0;
    }

    /**
     * Récupère le temps écoulé en secondes
     * @returns {number} - Temps en secondes
     */
    getTime() {
        return this.timer;
    }

    /**
     * Formate le temps en MM:SS
     * @param {number} seconds - Secondes à formater (utilise le timer actuel si non fourni)
     * @returns {string} - Temps formaté (ex: "05:42")
     */
    format(seconds = this.timer) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Vérifie si le timer est en cours
     * @returns {boolean}
     */
    isRunning() {
        return this.interval !== null;
    }

    /**
     * Définit une valeur de timer manuellement
     * @param {number} seconds - Temps en secondes
     */
    setTime(seconds) {
        this.timer = seconds;
        if (this.updateCallback) {
            this.updateCallback(this.timer);
        }
    }
}

// Export pour utilisation dans les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimerHelper;
}
