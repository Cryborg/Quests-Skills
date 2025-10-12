/**
 * Helper centralisé pour la gestion des chemins d'images
 * Gère la construction des URLs d'images en fonction de la catégorie
 */

/**
 * Construit le chemin complet d'une image de carte
 * @param {string} imagePath - Chemin de l'image depuis la base de données (ex: "creeper.webp")
 * @param {string} category - Catégorie de la carte (ex: "minecraft", "space", etc.)
 * @param {boolean} absolute - Si true, retourne le chemin absolu avec /shared/
 * @returns {string} Chemin complet de l'image
 */
function getCardImagePath(imagePath, category, absolute = true) {
    if (!imagePath) {
        return absolute ? '/shared/images/placeholder.png' : 'images/placeholder.png';
    }

    // Si c'est déjà une URL absolue (commence par http:// ou https://), on la retourne telle quelle
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // Supprimer le préfixe "images/" s'il existe (rétrocompatibilité)
    let filename = imagePath.replace(/^images\//, '');

    // Construire le chemin avec la catégorie
    const relativePath = `images/${category}/${filename}`;

    // Retourner le chemin absolu ou relatif selon le paramètre
    return absolute ? `/shared/${relativePath}` : relativePath;
}

/**
 * Transforme les chemins d'images pour un tableau de cartes
 * @param {Array} cards - Tableau de cartes
 * @param {boolean} absolute - Si true, retourne des chemins absolus avec /shared/
 * @returns {Array} Tableau de cartes avec les images transformées
 */
function transformCardImages(cards, absolute = true) {
    if (!Array.isArray(cards)) {
        return cards;
    }

    return cards.map(card => ({
        ...card,
        image: getCardImagePath(card.image, card.category, absolute)
    }));
}

/**
 * Transforme le chemin d'image pour une seule carte
 * @param {Object} card - Carte à transformer
 * @param {boolean} absolute - Si true, retourne un chemin absolu avec /shared/
 * @returns {Object} Carte avec l'image transformée
 */
function transformCardImage(card, absolute = true) {
    if (!card) {
        return card;
    }

    return {
        ...card,
        image: getCardImagePath(card.image, card.category, absolute)
    };
}

/**
 * Extrait le nom de fichier d'un chemin d'image complet
 * Utile pour sauvegarder en base de données
 * @param {string} imagePath - Chemin complet (ex: "/shared/images/minecraft/creeper.webp")
 * @returns {string} Nom de fichier seulement (ex: "creeper.webp")
 */
function extractImageFilename(imagePath) {
    if (!imagePath) {
        return '';
    }

    // Supprimer les préfixes possibles
    let path = imagePath
        .replace(/^\/shared\/images\/[^/]+\//, '') // /shared/images/{category}/
        .replace(/^images\/[^/]+\//, '')            // images/{category}/
        .replace(/^images\//, '')                   // images/
        .replace(/^\/shared\//, '');                // /shared/

    return path;
}

/**
 * Vérifie si un chemin d'image est valide
 * @param {string} imagePath - Chemin à vérifier
 * @returns {boolean} True si le chemin est valide
 */
function isValidImagePath(imagePath) {
    if (!imagePath) {
        return false;
    }

    // Vérifier si c'est une URL absolue
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return true;
    }

    // Vérifier si c'est un fichier avec une extension valide
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    return validExtensions.some(ext => imagePath.toLowerCase().endsWith(ext));
}

module.exports = {
    getCardImagePath,
    transformCardImages,
    transformCardImage,
    extractImageFilename,
    isValidImagePath
};
