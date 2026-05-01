"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    try {
        const themes = await server_1.prisma.theme.findMany({
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                coverImageUrl: true,
            },
        });
        res.json({ themes });
    }
    catch (error) {
        console.error('Get themes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
