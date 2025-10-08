const express = require('express');
const router = express.Router();
const { get, all, run, query } = require('../turso-db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/themes - Récupérer tous les thèmes
router.get('/', async (req, res) => {
  try {
    const themes = await all('SELECT * FROM card_themes ORDER BY name ASC');
    res.json(themes);
  } catch (error) {
    console.error('Failed to fetch themes:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// GET /api/themes/with-words - Récupérer tous les thèmes avec leurs mots mêlés (admin only)
router.get('/with-words', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const themes = await all('SELECT * FROM card_themes ORDER BY name ASC');

    // Charger les mots de chaque thème
    for (const theme of themes) {
      const wordsResult = await query(
        'SELECT * FROM word_search_words WHERE theme_slug = ? ORDER BY word',
        [theme.slug]
      );
      theme.words = wordsResult.rows || [];
    }

    res.json(themes);
  } catch (error) {
    console.error('Failed to fetch themes with words:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// POST /api/themes - Créer un nouveau thème (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { slug, name, icon } = req.body;

    if (!slug || !name || !icon) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Vérifier que le slug est unique
    const existing = await get('SELECT * FROM card_themes WHERE slug = ?', [slug]);
    if (existing) {
      return res.status(400).json({ error: 'Theme slug already exists' });
    }

    const now = new Date().toISOString();
    const result = await run(
      'INSERT INTO card_themes (slug, name, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [slug, name, icon, now, now]
    );

    const newTheme = await get('SELECT * FROM card_themes WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newTheme);
  } catch (error) {
    console.error('Failed to create theme:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

// PUT /api/themes/:id - Mettre à jour un thème (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, name, icon } = req.body;

    if (!slug || !name || !icon) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Vérifier que le thème existe
    const theme = await get('SELECT * FROM card_themes WHERE id = ?', [id]);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Vérifier que le slug est unique (sauf pour le thème actuel)
    const existing = await get('SELECT * FROM card_themes WHERE slug = ? AND id != ?', [slug, id]);
    if (existing) {
      return res.status(400).json({ error: 'Theme slug already exists' });
    }

    const now = new Date().toISOString();
    await run(
      'UPDATE card_themes SET slug = ?, name = ?, icon = ?, updated_at = ? WHERE id = ?',
      [slug, name, icon, now, id]
    );

    const updatedTheme = await get('SELECT * FROM card_themes WHERE id = ?', [id]);
    res.json(updatedTheme);
  } catch (error) {
    console.error('Failed to update theme:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// DELETE /api/themes/:id - Supprimer un thème (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le thème existe
    const theme = await get('SELECT * FROM card_themes WHERE id = ?', [id]);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Vérifier qu'il n'y a pas de cartes utilisant ce thème
    const cardsUsingTheme = await get('SELECT COUNT(*) as count FROM cards WHERE category = ?', [theme.slug]);
    if (cardsUsingTheme.count > 0) {
      return res.status(400).json({ error: `Cannot delete theme: ${cardsUsingTheme.count} cards are using it` });
    }

    await run('DELETE FROM card_themes WHERE id = ?', [id]);
    res.json({ message: 'Theme deleted successfully' });
  } catch (error) {
    console.error('Failed to delete theme:', error);
    res.status(500).json({ error: 'Failed to delete theme' });
  }
});

module.exports = router;
