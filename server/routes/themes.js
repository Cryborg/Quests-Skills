const express = require('express');
const router = express.Router();
const { get, all, run, query } = require('../turso-db');
const { requireAdmin } = require('../middleware/auth');
const { authenticateAndTrack } = require('../middleware/activity-tracker');
const { validateRequired } = require('../middleware/validators');
const DBHelpers = require('../utils/db-helpers');

// GET /api/themes/all - Récupérer tous les thèmes (admin only)
router.get('/all', authenticateAndTrack, requireAdmin, async (req, res) => {
  try {
    const themes = await all('SELECT * FROM card_themes ORDER BY name ASC');
    res.json(themes);
  } catch (error) {
    console.error('Failed to fetch all themes:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// GET /api/themes - Récupérer les thèmes de l'utilisateur connecté
router.get('/', authenticateAndTrack, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les thèmes actifs pour cet utilisateur
    const userThemesResult = await query(
      'SELECT theme_slug FROM user_themes WHERE user_id = ?',
      [userId]
    );

    if (!userThemesResult.rows || userThemesResult.rows.length === 0) {
      return res.json([]);
    }

    const userThemeSlugs = userThemesResult.rows.map(row => row.theme_slug);
    const placeholders = DBHelpers.buildInClause(userThemeSlugs);

    const themesResult = await query(
      `SELECT * FROM card_themes WHERE slug IN (${placeholders}) ORDER BY name ASC`,
      userThemeSlugs
    );

    res.json(themesResult.rows || []);
  } catch (error) {
    console.error('Failed to fetch themes:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// GET /api/themes/with-words - Récupérer tous les thèmes avec leurs mots mêlés (admin only)
router.get('/with-words', authenticateAndTrack, requireAdmin, async (req, res) => {
  try {
    const themes = await all('SELECT * FROM card_themes ORDER BY name ASC');

    // Récupérer TOUS les mots en une seule requête
    const themeSlugs = themes.map(t => t.slug);
    const placeholders = DBHelpers.buildInClause(themeSlugs);
    const allWordsResult = await query(
      `SELECT * FROM word_search_words
       WHERE theme_slug IN (${placeholders})
       ORDER BY theme_slug, word`,
      themeSlugs
    );

    // Grouper les mots par thème
    const wordsByTheme = {};
    allWordsResult.rows.forEach(word => {
      if (!wordsByTheme[word.theme_slug]) {
        wordsByTheme[word.theme_slug] = [];
      }
      wordsByTheme[word.theme_slug].push(word);
    });

    // Assigner les mots aux thèmes
    for (const theme of themes) {
      theme.words = wordsByTheme[theme.slug] || [];
    }

    // Ajouter une "section" pour les mots génériques (sans thème)
    const genericWordsResult = await query(
      'SELECT * FROM word_search_words WHERE theme_slug IS NULL ORDER BY word'
    );

    // Insérer les mots génériques en premier
    themes.unshift({
      slug: null,
      name: 'Mots génériques',
      icon: '📝',
      words: genericWordsResult.rows || []
    });

    res.json(themes);
  } catch (error) {
    console.error('Failed to fetch themes with words:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// POST /api/themes - Créer un nouveau thème (admin only)
router.post('/',
  authenticateAndTrack,
  requireAdmin,
  validateRequired(['slug', 'name', 'icon']),
  async (req, res) => {
  try {
    const { slug, name, icon } = req.body;

    // Vérifier que le slug est unique
    const existing = await get('SELECT * FROM card_themes WHERE slug = ?', [slug]);
    if (existing) {
      return res.status(400).json({ error: 'Theme slug already exists' });
    }

    const now = DBHelpers.now();
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
router.put('/:id',
  authenticateAndTrack,
  requireAdmin,
  validateRequired(['slug', 'name', 'icon']),
  async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, name, icon } = req.body;

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

    const now = DBHelpers.now();
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
router.delete('/:id', authenticateAndTrack, requireAdmin, async (req, res) => {
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
