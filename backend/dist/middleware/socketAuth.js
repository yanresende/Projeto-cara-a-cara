"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = socketAuthMiddleware;
const jwt_1 = require("../utils/jwt");
function socketAuthMiddleware(socket, next) {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
        return next(new Error('Missing token'));
    }
    const payload = (0, jwt_1.verifyToken)(token);
    if (!payload) {
        return next(new Error('Invalid or expired token'));
    }
    socket.userId = payload.userId;
    next();
}
