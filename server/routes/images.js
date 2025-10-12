const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { authenticateAndTrack } = require('../middleware/activity-tracker');

// GET /api/images - Liste toutes les images disponibles dans shared/images (avec sous-dossiers par catégorie)
router.get('/', authenticateAndTrack, async (req, res) => {
    try {
        const imagesDir = path.join(__dirname, '../../shared/images');
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const imageFiles = [];

        // Lire le dossier images
        const entries = await fs.readdir(imagesDir, { withFileTypes: true });

        // Parcourir tous les entrées (fichiers et dossiers)
        for (const entry of entries) {
            if (entry.isDirectory()) {
                // C'est un sous-dossier (catégorie) - lire ses fichiers
                const categoryDir = path.join(imagesDir, entry.name);
                const categoryFiles = await fs.readdir(categoryDir);

                for (const file of categoryFiles) {
                    const ext = path.extname(file).toLowerCase();
                    if (imageExtensions.includes(ext)) {
                        // Format: images/category/filename.ext
                        imageFiles.push(`images/${entry.name}/${file}`);
                    }
                }
            } else {
                // C'est un fichier directement dans images/ (ancien format - rétrocompatibilité)
                const ext = path.extname(entry.name).toLowerCase();
                if (imageExtensions.includes(ext)) {
                    imageFiles.push(`images/${entry.name}`);
                }
            }
        }

        res.json(imageFiles);
    } catch (error) {
        console.error('Error reading images directory:', error);
        res.status(500).json({ error: 'Failed to read images directory' });
    }
});

module.exports = router;
