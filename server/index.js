const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database initialization
const { ensureDatabaseExists } = require('../database/initialize');
const ensureMigrations = require('./middleware/ensure-migrations');

// Import routes
const cardsRouter = require('./routes/cards');
const usersRouter = require('./routes/users');
const bonusRouter = require('./routes/bonus');
const authRouter = require('./routes/auth');
const themesRouter = require('./routes/themes');
const gamesRouter = require('./routes/games');

console.log('📦 Loading word-search router...');
const wordSearchRouter = require('./routes/word-search');
console.log('✅ Word-search router loaded successfully');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auto-run migrations on first API call (runs only once)
app.use('/api', ensureMigrations);

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..')));

// API Routes
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

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);

    // Initialize database on server startup
    try {
        await ensureDatabaseExists();
        console.log('💾 Database ready');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
});
