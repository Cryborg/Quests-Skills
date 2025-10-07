const express = require('express');
const { all, get, run } = require('../turso-db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/cards - Récupérer toutes les cartes
router.get('/', async (req, res) => {
    try {
        const cards = await all('SELECT * FROM cards ORDER BY name ASC');

        // Transformer les chemins d'images relatifs en chemins absolus
        const cardsWithFullPaths = cards.map(card => ({
            ...card,
            image: card.image.startsWith('images/')
                ? `/shared/${card.image}`
                : card.image
        }));

        res.json(cardsWithFullPaths);
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ error: 'Failed to fetch cards' });
    }
});

// GET /api/cards/:id - Récupérer une carte
router.get('/:id', async (req, res) => {
    try {
        const card = await get('SELECT * FROM cards WHERE id = ?', [parseInt(req.params.id)]);

        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Transformer le chemin d'image relatif en chemin absolu
        const cardWithFullPath = {
            ...card,
            image: card.image.startsWith('images/')
                ? `/shared/${card.image}`
                : card.image
        };

        res.json(cardWithFullPath);
    } catch (error) {
        console.error('Error fetching card:', error);
        res.status(500).json({ error: 'Failed to fetch card' });
    }
});

// POST /api/cards - Créer une carte (admin seulement)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, category, base_rarity, image } = req.body;

        // Valider les champs requis
        if (!name || !description || !category || !base_rarity || !image) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Valider le thème (vérifier qu'il existe dans card_themes)
        const theme = await get('SELECT * FROM card_themes WHERE slug = ?', [category]);
        if (!theme) {
            return res.status(400).json({ error: 'Invalid category: theme does not exist' });
        }

        // Valider la rareté
        const validRarities = ['common', 'rare', 'very_rare', 'epic', 'legendary'];
        if (!validRarities.includes(base_rarity)) {
            return res.status(400).json({ error: 'Invalid rarity' });
        }

        // Créer la carte
        const now = new Date().toISOString();
        const result = await run(
            'INSERT INTO cards (name, description, category, base_rarity, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, category, base_rarity, image, now, now]
        );

        const newCard = await get('SELECT * FROM cards WHERE id = ?', [result.lastID]);
        res.status(201).json(newCard);
    } catch (error) {
        console.error('Error creating card:', error);
        res.status(500).json({ error: 'Failed to create card' });
    }
});

// PUT /api/cards/:id - Modifier une carte (admin seulement)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const cardId = parseInt(req.params.id);
        const { name, description, category, base_rarity, image } = req.body;

        // Vérifier que la carte existe
        const card = await get('SELECT * FROM cards WHERE id = ?', [cardId]);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Préparer les champs à mettre à jour
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }

        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }

        if (category !== undefined) {
            // Valider le thème (vérifier qu'il existe dans card_themes)
            const theme = await get('SELECT * FROM card_themes WHERE slug = ?', [category]);
            if (!theme) {
                return res.status(400).json({ error: 'Invalid category: theme does not exist' });
            }
            updates.push('category = ?');
            values.push(category);
        }

        if (base_rarity !== undefined) {
            const validRarities = ['common', 'rare', 'very_rare', 'epic', 'legendary'];
            if (!validRarities.includes(base_rarity)) {
                return res.status(400).json({ error: 'Invalid rarity' });
            }
            updates.push('base_rarity = ?');
            values.push(base_rarity);
        }

        if (image !== undefined) {
            updates.push('image = ?');
            values.push(image);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        // Ajouter updated_at
        updates.push('updated_at = ?');
        values.push(new Date().toISOString());

        values.push(cardId);
        await run(`UPDATE cards SET ${updates.join(', ')} WHERE id = ?`, values);

        const updatedCard = await get('SELECT * FROM cards WHERE id = ?', [cardId]);
        res.json(updatedCard);
    } catch (error) {
        console.error('Error updating card:', error);
        res.status(500).json({ error: 'Failed to update card' });
    }
});

// DELETE /api/cards/:id - Supprimer une carte (admin seulement)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const cardId = parseInt(req.params.id);

        // Vérifier que la carte existe
        const card = await get('SELECT * FROM cards WHERE id = ?', [cardId]);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Supprimer la carte
        await run('DELETE FROM cards WHERE id = ?', [cardId]);

        res.json({ message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Error deleting card:', error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

module.exports = router;
