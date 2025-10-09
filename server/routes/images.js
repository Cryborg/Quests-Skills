const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// GET /api/images - Liste toutes les images disponibles dans shared/images
router.get('/', async (req, res) => {
    try {
        const imagesDir = path.join(__dirname, '../../shared/images');
        const files = await fs.readdir(imagesDir);

        // Filtrer uniquement les fichiers images
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const imageFiles = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return imageExtensions.includes(ext);
            })
            .map(file => `images/${file}`);

        res.json(imageFiles);
    } catch (error) {
        console.error('Error reading images directory:', error);
        res.status(500).json({ error: 'Failed to read images directory' });
    }
});

module.exports = router;
