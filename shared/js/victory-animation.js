/**
 * Gestionnaire d'animation de victoire
 * Utilisé par plusieurs jeux pour afficher une animation de victoire avec confettis
 */
class VictoryAnimation {
    /**
     * Affiche l'animation de victoire
     * @param {string} overlayId - ID de l'élément overlay (par défaut 'victory-overlay')
     * @param {number} duration - Durée d'affichage en ms (par défaut 3000ms)
     */
    static show(overlayId = 'victory-overlay', duration = 3000) {
        const overlay = document.getElementById(overlayId);
        const confettiContainer = overlay?.querySelector('.confetti-container');

        if (!overlay || !confettiContainer) {
            console.error('Victory overlay or confetti container not found');
            return;
        }

        // Réinitialiser l'état
        overlay.style.display = 'flex';
        overlay.classList.remove('show', 'hide');

        // Forcer un reflow pour que la transition fonctionne
        overlay.offsetHeight;

        // Démarrer le fade in
        overlay.classList.add('show');

        // Créer les confettis
        this.createConfetti(confettiContainer);

        // Démarrer le fade out avant la fin
        setTimeout(() => {
            overlay.classList.add('hide');
        }, duration - 800); // Commencer le fade 800ms avant la fin

        // Masquer complètement l'overlay après le fade out
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove('show', 'hide');
            confettiContainer.innerHTML = ''; // Nettoyer les confettis
        }, duration);
    }

    /**
     * Crée les confettis animés
     * @param {HTMLElement} container - Conteneur des confettis
     */
    static createConfetti(container) {
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8'];
        const confettiCount = 200;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';

            // Position horizontale aléatoire
            confetti.style.left = Math.random() * 100 + '%';

            // Couleur aléatoire
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];

            // Durée d'animation aléatoire (entre 2 et 4 secondes)
            const duration = 2 + Math.random() * 2;
            confetti.style.animationDuration = duration + 's';

            // Délai aléatoire étalé sur toute la durée (0 à 2.5 secondes)
            confetti.style.animationDelay = Math.random() * 2.5 + 's';

            // Taille aléatoire
            const size = 5 + Math.random() * 10;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';

            // Forme aléatoire (carré ou rectangle)
            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            }

            container.appendChild(confetti);
        }
    }
}
