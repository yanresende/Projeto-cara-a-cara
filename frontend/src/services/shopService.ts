import { API_URL } from '../utils/constants';
import { getToken } from '../utils/localStorage';
import type { EquippedItems } from '../types/index';

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export const shopService = {
  async buyItem(itemId: string): Promise<{ coins: number; ownedItemIds: string[] }> {
    const res = await fetch(`${API_URL}/api/shop/buy/${itemId}`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Erro ao comprar item');
    }
    return res.json();
  },

  async equipItem(itemId: string | null, category: keyof EquippedItems): Promise<{ equippedItems: EquippedItems }> {
    const res = await fetch(`${API_URL}/api/shop/equip`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ itemId, category }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Erro ao equipar item');
    }
    return res.json();
  },
};
