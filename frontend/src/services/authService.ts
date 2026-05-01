import { API_URL } from '../utils/constants';
import type { UserProfile, AuthResponse, AuthPayload } from '../types/index';

class AuthService {
  async signup(payload: AuthPayload): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Signup failed');
    }

    return response.json();
  }

  async login(payload: AuthPayload): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  async getMe(token: string): Promise<UserProfile> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Get user failed');
    }

    return response.json();
  }
}

export const authService = new AuthService();
