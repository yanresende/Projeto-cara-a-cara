import { API_URL } from '../utils/constants';
import { getToken } from '../utils/localStorage';

const BASE = `${API_URL}/admin`;

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export interface CharacterAdmin {
  id: string;
  name: string;
  imageUrl: string;
  themeId: string;
}

export interface ThemeAdmin {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  characters: CharacterAdmin[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Erro ${res.status}`);
  }
  return res.json();
}

export const adminService = {
  async getThemes(): Promise<ThemeAdmin[]> {
    const res = await fetch(`${BASE}/themes`, { headers: authHeaders() });
    const data = await handleResponse<{ themes: ThemeAdmin[] }>(res);
    return data.themes;
  },

  async createTheme(payload: { name: string; description?: string; coverImageUrl?: string }): Promise<ThemeAdmin> {
    const res = await fetch(`${BASE}/themes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<{ theme: ThemeAdmin }>(res);
    return data.theme;
  },

  async updateTheme(id: string, payload: { name?: string; description?: string; coverImageUrl?: string }): Promise<ThemeAdmin> {
    const res = await fetch(`${BASE}/themes/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<{ theme: ThemeAdmin }>(res);
    return data.theme;
  },

  async deleteTheme(id: string): Promise<void> {
    const res = await fetch(`${BASE}/themes/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await handleResponse(res);
  },

  async addCharacter(themeId: string, payload: { name: string; imageUrl: string }): Promise<CharacterAdmin> {
    const res = await fetch(`${BASE}/themes/${themeId}/characters`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<{ character: CharacterAdmin }>(res);
    return data.character;
  },

  async updateCharacter(themeId: string, charId: string, payload: { name?: string; imageUrl?: string }): Promise<CharacterAdmin> {
    const res = await fetch(`${BASE}/themes/${themeId}/characters/${charId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<{ character: CharacterAdmin }>(res);
    return data.character;
  },

  async deleteCharacter(themeId: string, charId: string): Promise<void> {
    const res = await fetch(`${BASE}/themes/${themeId}/characters/${charId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await handleResponse(res);
  },
};
