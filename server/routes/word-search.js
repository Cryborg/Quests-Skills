const express = require('express');
const router = express.Router();
const { query, get, run } = require('../turso-db');
const { ensureDatabaseExists } = require('../../database/initialize');
const { requireAdmin } = require('../middleware/auth');
const { authenticateAndTrack } = require('../middleware/activity-tracker');
const { validateRequired, validateWord, validateOwnership } = require('../middleware/validators');
const DBHelpers = require('../utils/db-helpers');

// ========================================
// GET /word-search/themes - Liste tous les thèmes de cartes avec leurs mots + mots génériques
// ========================================
router.get('/themes', authenticateAndTrack, async (req, res) => {
  try {
    await ensureDatabaseExists();

    // Récupérer tous les thèmes de cartes
    const themesResult = await query('SELECT * FROM card_themes ORDER BY name');
    const themes = themesResult.rows;

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

    // Ajouter une section "Génériques" pour les mots sans thème
    const genericWordsResult = await query(
      'SELECT * FROM word_search_words WHERE theme_slug IS NULL ORDER BY word'
    );

    if (genericWordsResult.rows.length > 0) {
      themes.unshift({
        id: null,
        slug: null,
        name: 'Mots génériques',
        icon: '📝',
        words: genericWordsResult.rows
      });
    }

    res.json({ themes });
  } catch (error) {
    console.error('Error fetching word search themes:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// ========================================
// GET /word-search/themes/:userId/available - Liste les thèmes disponibles pour un utilisateur
// ========================================
router.get('/themes/:userId/available',
  authenticateAndTrack,
  validateOwnership,
  async (req, res) => {
  try {
    await ensureDatabaseExists();
    const { userId } = req.params;

    // Récupérer les thèmes de cartes de l'utilisateur
    const userThemesResult = await query(
      'SELECT theme_slug FROM user_themes WHERE user_id = ?',
      [userId]
    );
    const userCardThemes = userThemesResult.rows.map(row => row.theme_slug);

    const themes = [];

    // Récupérer les mots génériques (disponibles pour tous)
    const genericWordsResult = await query(
      'SELECT * FROM word_search_words WHERE theme_slug IS NULL ORDER BY word'
    );
    const genericWords = genericWordsResult.rows;

    // Ajouter les mots génériques comme un thème séparé
    if (genericWords.length > 0) {
      themes.push({
        id: null,
        slug: null,
        name: 'Mots génériques',
        icon: '📝',
        words: genericWords,
        wordCount: genericWords.length
      });
    }

    // Récupérer uniquement les thèmes que l'utilisateur a débloqués
    if (userCardThemes.length > 0) {
      const placeholders = DBHelpers.buildInClause(userCardThemes);
      const themesResult = await query(
        `SELECT * FROM card_themes WHERE slug IN (${placeholders}) ORDER BY name`,
        userCardThemes
      );

      // Récupérer TOUS les mots des thèmes en une seule requête
      const themeSlugs = themesResult.rows.map(t => t.slug);
      const wordsPlaceholders = DBHelpers.buildInClause(themeSlugs);
      const allThemeWordsResult = await query(
        `SELECT * FROM word_search_words
         WHERE theme_slug IN (${wordsPlaceholders})
         ORDER BY theme_slug, word`,
        themeSlugs
      );

      // Grouper les mots par thème
      const wordsByTheme = {};
      allThemeWordsResult.rows.forEach(word => {
        if (!wordsByTheme[word.theme_slug]) {
          wordsByTheme[word.theme_slug] = [];
        }
        wordsByTheme[word.theme_slug].push(word);
      });

      // Pour chaque thème, ne garder QUE les mots du thème (sans les génériques)
      for (const theme of themesResult.rows) {
        theme.words = wordsByTheme[theme.slug] || [];
        theme.wordCount = theme.words.length;

        if (theme.wordCount >= 5) {
          themes.push(theme);
        }
      }
    }

    res.json({ themes, userCardThemes });
  } catch (error) {
    console.error('Error fetching available word search themes:', error);
    res.status(500).json({ error: 'Failed to fetch available themes' });
  }
});

// ========================================
// POST /word-search/words - Créer un nouveau mot (Admin only)
// ========================================
router.post('/words',
  authenticateAndTrack,
  requireAdmin,
  validateWord,
  async (req, res) => {
  try {
    await ensureDatabaseExists();
    const { theme, definition } = req.body;
    const cleanWord = req.cleanWord; // Fourni par validateWord
    const themeSlug = theme || null; // Permettre les mots génériques (sans thème)

    const now = DBHelpers.now();
    await run(
      'INSERT INTO word_search_words (theme_slug, word, definition, created_at) VALUES (?, ?, ?, ?)',
      [themeSlug, cleanWord, definition || null, now]
    );

    // Récupérer le mot créé (gérer NULL pour theme_slug)
    let wordRecord;
    if (themeSlug === null) {
      wordRecord = await get(
        'SELECT * FROM word_search_words WHERE theme_slug IS NULL AND word = ?',
        [cleanWord]
      );
    } else {
      wordRecord = await get(
        'SELECT * FROM word_search_words WHERE theme_slug = ? AND word = ?',
        [themeSlug, cleanWord]
      );
    }
    res.status(201).json({ word: wordRecord });
  } catch (error) {
    console.error('Error creating word:', error);
    res.status(500).json({ error: 'Failed to create word' });
  }
});

// ========================================
// PUT /word-search/words/:id - Mettre à jour un mot (Admin only)
// ========================================
router.put('/words/:id',
  authenticateAndTrack,
  requireAdmin,
  validateWord,
  async (req, res) => {
  try {
    await ensureDatabaseExists();
    const { id } = req.params;
    const { theme, definition } = req.body;
    const cleanWord = req.cleanWord; // Fourni par validateWord

    await run(
      'UPDATE word_search_words SET word = ?, theme_slug = ?, definition = ? WHERE id = ?',
      [cleanWord, theme || null, definition || null, id]
    );

    const wordRecord = await get('SELECT * FROM word_search_words WHERE id = ?', [id]);
    res.json({ word: wordRecord });
  } catch (error) {
    console.error('Error updating word:', error);
    res.status(500).json({ error: 'Failed to update word' });
  }
});

// ========================================
// DELETE /word-search/words/:id - Supprimer un mot (Admin only)
// ========================================
router.delete('/words/:id', authenticateAndTrack, requireAdmin, async (req, res) => {
  try {
    await ensureDatabaseExists();
    const { id } = req.params;

    await run('DELETE FROM word_search_words WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting word:', error);
    res.status(500).json({ error: 'Failed to delete word' });
  }
});

// ========================================
// POST /word-search/games/:userId/save - Sauvegarder une partie en cours
// ========================================
router.post('/games/:userId/save',
  authenticateAndTrack,
  validateOwnership,
  async (req, res) => {
  try {
    await ensureDatabaseExists();
    const { userId } = req.params;
    const { grid, words, foundWords, timer, hintsUsed } = req.body;

    // S'assurer que foundWords est un tableau
    const foundWordsArray = Array.isArray(foundWords) ? foundWords : [];

    const now = DBHelpers.now();

    // Vérifier si une partie existe déjà pour cet utilisateur
    const existingGame = await get(
      'SELECT id FROM word_search_games WHERE user_id = ?',
      [userId]
    );

    if (existingGame) {
      // Mettre à jour la partie existante
      await run(
        `UPDATE word_search_games
         SET grid = ?, words = ?, found_words = ?, timer = ?, hints_used = ?, updated_at = ?
         WHERE user_id = ?`,
        [
          JSON.stringify(grid || []),
          JSON.stringify(words || []),
          JSON.stringify(foundWordsArray),
          timer || 0,
          hintsUsed || 0,
          now,
          userId
        ]
      );
    } else {
      // Créer une nouvelle partie
      await run(
        `INSERT INTO word_search_games (user_id, grid, words, found_words, timer, hints_used, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          JSON.stringify(grid || []),
          JSON.stringify(words || []),
          JSON.stringify(foundWordsArray),
          timer || 0,
          hintsUsed || 0,
          now,
          now
        ]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving word search game:', error);
    res.status(500).json({ error: 'Failed to save game' });
  }
});

// ========================================
// GET /word-search/games/:userId/current - Récupérer la partie en cours
// ========================================
router.get('/games/:userId/current',
  authenticateAndTrack,
  validateOwnership,
  async (req, res) => {
  try {
    await ensureDatabaseExists();
    const { userId } = req.params;

    const game = await get(
      'SELECT * FROM word_search_games WHERE user_id = ?',
      [userId]
    );

    if (!game) {
      return res.json({ game: null });
    }

    // Parser les données JSON avec gestion des valeurs null/undefined
    game.grid = game.grid ? JSON.parse(game.grid) : [];
    game.words = game.words ? JSON.parse(game.words) : [];
    game.foundWords = game.found_words ? JSON.parse(game.found_words) : [];

    res.json({ game });
  } catch (error) {
    console.error('Error fetching word search game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// ========================================
// DELETE /word-search/games/:userId/current - Supprimer la partie en cours
// ========================================
router.delete('/games/:userId/current',
  authenticateAndTrack,
  validateOwnership,
  async (req, res) => {
  try {
    await ensureDatabaseExists();
    const { userId } = req.params;

    await run('DELETE FROM word_search_games WHERE user_id = ?', [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting word search game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

module.exports = router;
