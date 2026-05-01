"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../utils/jwt");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.substring(7);
    const payload = (0, jwt_1.verifyToken)(token);
    if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = { id: payload.userId };
    next();
}
