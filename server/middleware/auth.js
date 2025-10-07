const jwt = require('jsonwebtoken');

// Middleware pour vérifier le token JWT
function authenticateToken(req, res, next) {
    // Récupérer le token depuis le cookie ou l'en-tête Authorization
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, email, username, is_admin }
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

// Middleware pour vérifier que l'utilisateur est admin
function requireAdmin(req, res, next) {
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Middleware pour vérifier que l'utilisateur accède à ses propres données
function checkOwnership(req, res, next) {
    const userId = parseInt(req.params.id);
    
    // Admin peut accéder à tout
    if (req.user.is_admin) {
        return next();
    }

    // Utilisateur normal ne peut accéder qu'à ses propres données
    if (req.user.id !== userId) {
        return res.status(403).json({ error: 'Access denied: You can only access your own data' });
    }

    next();
}

module.exports = {
    authenticateToken,
    requireAdmin,
    checkOwnership
};
