const express = require('express');
const router = express.Router();
const { query, get, run } = require('../turso-db');
const { ensureDatabaseExists } = require('../../database/initialize');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ========================================
// GET /word-search/themes - Liste tous les thèmes de cartes avec leurs mots + mots génériques
// ========================================
router.get('/themes', authenticateToken, async (req, res) => {
  try {
    await ensureDatabaseExists();

    // Récupérer tous les thèmes de cartes
    const themesResult = await query('SELECT * FROM card_themes ORDER BY name');
    const themes = themesResult.rows;

    // Pour chaque thème, récupérer ses mots
    for (const theme of themes) {
      const wordsResult = await query(
        'SELECT * FROM word_search_words WHERE theme_slug = ? ORDER BY word',
        [theme.slug]
      );
      theme.words = wordsResult.rows;
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
router.get('/themes/:userId/available', authenticateToken, async (req, res) => {
  try {
    await ensureDatabaseExists();
    const { userId } = req.params;

    // Vérifier que l'utilisateur accède à ses propres données ou est admin
    if (req.user.id !== parseInt(userId) && !req.user.is_admin) {
      return res.status(403).json({ error: 'Access denied' });
    }

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

    // Récupérer uniquement les thèmes que l'utilisateur a débloqués
    if (userCardThemes.length > 0) {
      const placeholders = userCardThemes.map(() => '?').join(',');
      const themesResult = await query(
        `SELECT * FROM card_themes WHERE slug IN (${placeholders}) ORDER BY name`,
        userCardThemes
      );

      // Pour chaque thème, récupérer les mots (spécifiques + génériques)
      for (const theme of themesResult.rows) {
        const themeWordsResult = await query(
          'SELECT * FROM word_search_words WHERE theme_slug = ? ORDER BY word',
          [theme.slug]
        );

        // Combiner les mots du thème + les mots génériques en évitant les doublons
        const allWords = [...themeWordsResult.rows, ...genericWords];
        const uniqueWordsMap = new Map();

        // Garder seulement le premier mot de chaque texte (dédupliquer par le mot lui-même)
        allWords.forEach(wordObj => {
          if (!uniqueWordsMap.has(wordObj.word)) {
            uniqueWordsMap.set(wordObj.word, wordObj);
          }
        });

        theme.words = Array.from(uniqueWordsMap.values());
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
router.post('/words', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await ensureDatabaseExists();
    const { theme, word } = req.body;

    if (!theme || !word) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validation du mot
    const cleanWord = word.toUpperCase().trim();
    if (cleanWord.length < 3 || cleanWord.length > 15) {
      return res.status(400).json({ error: 'Word must be between 3 and 15 characters' });
    }

    if (!/^[A-ZÀ-ÿ\s]+$/.test(cleanWord)) {
      return res.status(400).json({ error: 'Word must contain only letters' });
    }

    const now = new Date().toISOString();
    await run(
      'INSERT INTO word_search_words (theme_slug, word, created_at) VALUES (?, ?, ?)',
      [theme, cleanWord, now]
    );

    const wordRecord = await get(
      'SELECT * FROM word_search_words WHERE theme_slug = ? AND word = ?',
      [theme, cleanWord]
    );
    res.status(201).json({ word: wordRecord });
  } catch (error) {
    console.error('Error creating word:', error);
    res.status(500).json({ error: 'Failed to create word' });
  }
});

// ========================================
// PUT /word-search/words/:id - Mettre à jour un mot (Admin only)
// ========================================
router.put('/words/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await ensureDatabaseExists();
    const { id } = req.params;
    const { word, theme } = req.body;

    if (!word) {
      return res.status(400).json({ error: 'Missing word field' });
    }

    // Validation du mot
    const cleanWord = word.toUpperCase().trim();
    if (cleanWord.length < 3 || cleanWord.length > 15) {
      return res.status(400).json({ error: 'Word must be between 3 and 15 characters' });
    }

    if (!/^[A-ZÀ-ÿ\s]+$/.test(cleanWord)) {
      return res.status(400).json({ error: 'Word must contain only letters' });
    }

    await run(
      'UPDATE word_search_words SET word = ?, theme_slug = ? WHERE id = ?',
      [cleanWord, theme || null, id]
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
router.delete('/words/:id', authenticateToken, requireAdmin, async (req, res) => {
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

module.exports = router;
