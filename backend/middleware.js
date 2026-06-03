 /*import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expects "Bearer TOKEN"

    if (!token) return res.status(401).json({ error: "Access denied. Logging required." });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid or expired session token." });
        req.user = user; // Adds decrypted user data (userId) to request body
        next();
    });
};
*/