import { LOCAL_STORAGE_KEYS } from './constants';
import type { UserProfile } from '../types/index';

export function saveToken(token: string): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, token);
}

export function getToken(): string | null {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
}

export function clearToken(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
}

export function saveUser(user: UserProfile): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
}

export function getUser(): UserProfile | null {
  const user = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
}

export function clearUser(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
}

export function clearAuth(): void {
  clearToken();
  clearUser();
}
