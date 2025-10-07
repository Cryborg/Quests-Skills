const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const cardsRouter = require('../server/routes/cards');
const usersRouter = require('../server/routes/users');
const bonusRouter = require('../server/routes/bonus');
const authRouter = require('../server/routes/auth');
const themesRouter = require('../server/routes/themes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/cards', cardsRouter);
app.use('/api/users', usersRouter);
app.use('/api/bonus-operations', bonusRouter);
app.use('/api/auth', authRouter);
app.use('/api/themes', themesRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel serverless
module.exports = app;
