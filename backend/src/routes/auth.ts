import { Router, Response } from 'express';
import { AuthRequest, AuthResponse, UserProfile } from '../types/index';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../server';

const router = Router();

interface SignupBody {
  username?: string;
  password?: string;
}

interface LoginBody {
  username?: string;
  password?: string;
}

// POST /api/auth/signup
router.post('/signup', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body as SignupBody;

    if (!username || typeof username !== 'string' || username.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, passwordHash }
    });

    const isAdmin = process.env.ADMIN_USERNAME ? user.username === process.env.ADMIN_USERNAME : false;
    const token = generateToken(user.id, isAdmin);
    const response = {
      token,
      user: { id: user.id, username: user.username, score: user.score, gamesPlayed: user.gamesPlayed, gamesWon: user.gamesWon, isAdmin }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body as LoginBody;

    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await comparePassword(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isAdmin = process.env.ADMIN_USERNAME ? user.username === process.env.ADMIN_USERNAME : false;
    const token = generateToken(user.id, isAdmin);
    const response = {
      token,
      user: { id: user.id, username: user.username, score: user.score, gamesPlayed: user.gamesPlayed, gamesWon: user.gamesWon, isAdmin }
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isAdmin = process.env.ADMIN_USERNAME ? user.username === process.env.ADMIN_USERNAME : false;
    const profile = {
      id: user.id,
      username: user.username,
      score: user.score,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      isAdmin,
    };

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
