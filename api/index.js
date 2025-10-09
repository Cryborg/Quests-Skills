const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database initialization and migrations
const ensureMigrations = require('../server/middleware/ensure-migrations');

// Import routes
const cardsRouter = require('../server/routes/cards');
const usersRouter = require('../server/routes/users');
const bonusRouter = require('../server/routes/bonus');
const authRouter = require('../server/routes/auth');
const themesRouter = require('../server/routes/themes');
const gamesRouter = require('../server/routes/games');
const wordSearchRouter = require('../server/routes/word-search');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auto-run migrations BEFORE any API route (runs only once)
app.use('/api', ensureMigrations);

// API Routes (migrations will run before these)
app.use('/api/cards', cardsRouter);
app.use('/api/users', usersRouter);
app.use('/api/bonus-operations', bonusRouter);
app.use('/api/auth', authRouter);
app.use('/api/themes', themesRouter);
app.use('/api/games', gamesRouter);
app.use('/api/word-search', wordSearchRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel serverless
module.exports = app;
