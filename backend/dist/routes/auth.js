"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const auth_1 = require("../middleware/auth");
const server_1 = require("../server");
const router = (0, express_1.Router)();
// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || typeof username !== 'string' || username.length < 3) {
            res.status(400).json({ error: 'Username must be at least 3 characters' });
            return;
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }
        const existingUser = await server_1.prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            res.status(409).json({ error: 'Username already exists' });
            return;
        }
        const passwordHash = await (0, password_1.hashPassword)(password);
        const user = await server_1.prisma.user.create({
            data: { username, passwordHash }
        });
        const token = (0, jwt_1.generateToken)(user.id);
        const response = {
            token,
            user: { id: user.id, username: user.username }
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || typeof username !== 'string') {
            res.status(400).json({ error: 'Username is required' });
            return;
        }
        if (!password || typeof password !== 'string') {
            res.status(400).json({ error: 'Password is required' });
            return;
        }
        const user = await server_1.prisma.user.findUnique({ where: { username } });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const validPassword = await (0, password_1.comparePassword)(password, user.passwordHash);
        if (!validPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = (0, jwt_1.generateToken)(user.id);
        const response = {
            token,
            user: { id: user.id, username: user.username }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/auth/me
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const user = await server_1.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const profile = {
            id: user.id,
            username: user.username,
            score: user.score,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon
        };
        res.json(profile);
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
