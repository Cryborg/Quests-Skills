/**
 * Service centralisé pour la gestion des mots de passe
 * Principe SRP (Single Responsibility): une seule responsabilité = hasher/vérifier les mots de passe
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

class PasswordService {
    /**
     * Hashe un mot de passe en clair
     * @param {string} plainPassword - Le mot de passe en clair
     * @returns {Promise<string>} Le hash du mot de passe
     */
    static async hash(plainPassword) {
        if (!plainPassword || typeof plainPassword !== 'string') {
            throw new Error('Password must be a non-empty string');
        }

        return await bcrypt.hash(plainPassword, SALT_ROUNDS);
    }

    /**
     * Vérifie si un mot de passe correspond à un hash
     * @param {string} plainPassword - Le mot de passe en clair
     * @param {string} hashedPassword - Le hash stocké
     * @returns {Promise<boolean>} True si le mot de passe correspond
     */
    static async verify(plainPassword, hashedPassword) {
        if (!plainPassword || !hashedPassword) {
            return false;
        }

        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Vérifie si un mot de passe respecte les critères de sécurité
     * @param {string} password - Le mot de passe à valider
     * @returns {{valid: boolean, errors: string[]}} Résultat de la validation
     */
    static validatePasswordStrength(password) {
        const errors = [];

        if (!password || typeof password !== 'string') {
            errors.push('Le mot de passe est requis');
            return { valid: false, errors };
        }

        if (password.length < 8) {
            errors.push('Le mot de passe doit contenir au moins 8 caractères');
        }

        // Optionnel: ajouter d'autres règles selon les besoins
        // if (!/[A-Z]/.test(password)) {
        //     errors.push('Le mot de passe doit contenir au moins une majuscule');
        // }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = PasswordService;
