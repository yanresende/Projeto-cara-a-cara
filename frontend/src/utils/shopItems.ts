export type ShopCategory = 'boardSkin' | 'cardFrame' | 'profileFrame' | 'turnBanner';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  price: number;
  preview: string; // CSS color or gradient for preview swatch
  cssClass: string; // applied to game container / card / avatar / player card
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── Board Skins ──────────────────────────────────────────
  {
    id: 'default',
    name: 'Padrão',
    description: 'O visual clássico do jogo',
    category: 'boardSkin',
    price: 0,
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cssClass: '',
  },
  {
    id: 'dark_void',
    name: 'Abismo Escuro',
    description: 'Um fundo sombrio e misterioso',
    category: 'boardSkin',
    price: 200,
    preview: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
    cssClass: 'skin-dark-void',
  },
  {
    id: 'neon_city',
    name: 'Cidade Neon',
    description: 'Luzes vibrantes da cidade à noite',
    category: 'boardSkin',
    price: 350,
    preview: 'linear-gradient(135deg, #1a0033 0%, #3d0070 100%)',
    cssClass: 'skin-neon-city',
  },
  {
    id: 'enchanted_forest',
    name: 'Floresta Encantada',
    description: 'A calma de uma floresta mágica',
    category: 'boardSkin',
    price: 300,
    preview: 'linear-gradient(135deg, #005c3d 0%, #1a6b4a 100%)',
    cssClass: 'skin-enchanted-forest',
  },
  {
    id: 'galaxy',
    name: 'Galáxia',
    description: 'Uma viagem pelas estrelas',
    category: 'boardSkin',
    price: 500,
    preview: 'linear-gradient(135deg, #0c0044 0%, #1a0044 50%, #0044aa 100%)',
    cssClass: 'skin-galaxy',
  },
  {
    id: 'sunset',
    name: 'Pôr do Sol',
    description: 'Tons quentes e dourados do entardecer',
    category: 'boardSkin',
    price: 250,
    preview: 'linear-gradient(135deg, #f7971e 0%, #f97316 50%, #ffd200 100%)',
    cssClass: 'skin-sunset',
  },

  // ── Card Frames ──────────────────────────────────────────
  {
    id: 'default_frame',
    name: 'Padrão',
    description: 'Borda simples e limpa',
    category: 'cardFrame',
    price: 0,
    preview: '#e5e7eb',
    cssClass: '',
  },
  {
    id: 'gold_frame',
    name: 'Dourada',
    description: 'Borda dourada reluzente',
    category: 'cardFrame',
    price: 150,
    preview: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    cssClass: 'frame-gold',
  },
  {
    id: 'holographic',
    name: 'Holográfica',
    description: 'Efeito arco-íris iridescente',
    category: 'cardFrame',
    price: 300,
    preview: 'linear-gradient(135deg, #ff0080, #ff8c00, #40e0d0, #8b5cf6)',
    cssClass: 'frame-holographic',
  },
  {
    id: 'fire_frame',
    name: 'Chamas',
    description: 'Bordas em chamas ardentes',
    category: 'cardFrame',
    price: 250,
    preview: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    cssClass: 'frame-fire',
  },
  {
    id: 'ice_frame',
    name: 'Gelo',
    description: 'Cristais de gelo gelados',
    category: 'cardFrame',
    price: 200,
    preview: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 100%)',
    cssClass: 'frame-ice',
  },

  // ── Profile Frames ──────────────────────────────────────
  {
    id: 'no_frame',
    name: 'Padrão',
    description: 'Sem moldura extra',
    category: 'profileFrame',
    price: 0,
    preview: 'transparent',
    cssClass: '',
  },
  {
    id: 'bronze_border',
    name: 'Bronze',
    description: 'Anel de bronze robusto',
    category: 'profileFrame',
    price: 100,
    preview: '#b45309',
    cssClass: 'profile-frame-bronze',
  },
  {
    id: 'champion_ring',
    name: 'Campeão',
    description: 'Anel roxo dos campeões com brilho animado',
    category: 'profileFrame',
    price: 400,
    preview: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    cssClass: 'profile-frame-champion',
  },
  {
    id: 'neon_ring',
    name: 'Neon Verde',
    description: 'Anel neon vibrante',
    category: 'profileFrame',
    price: 250,
    preview: '#10b981',
    cssClass: 'profile-frame-neon',
  },
  {
    id: 'diamond_ring',
    name: 'Diamante',
    description: 'Brilho frio e precioso',
    category: 'profileFrame',
    price: 350,
    preview: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
    cssClass: 'profile-frame-diamond',
  },

  // ── Turn Banners ─────────────────────────────────────────
  {
    id: 'banner_default',
    name: 'Padrão',
    description: 'Brilho suave no seu turno',
    category: 'turnBanner',
    price: 0,
    preview: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    cssClass: 'banner-default',
  },
  {
    id: 'banner_lightning',
    name: 'Raio Elétrico',
    description: 'Pulso elétrico azul ao seu redor',
    category: 'turnBanner',
    price: 300,
    preview: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    cssClass: 'banner-lightning',
  },
  {
    id: 'banner_fire',
    name: 'Chamas',
    description: 'Aura de fogo ardente',
    category: 'turnBanner',
    price: 250,
    preview: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    cssClass: 'banner-fire',
  },
  {
    id: 'banner_blizzard',
    name: 'Blizzard',
    description: 'Shimmer gelado e cristalino',
    category: 'turnBanner',
    price: 200,
    preview: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 100%)',
    cssClass: 'banner-blizzard',
  },
  {
    id: 'banner_stars',
    name: 'Estrelas Douradas',
    description: 'Brilho dourado cintilante',
    category: 'turnBanner',
    price: 350,
    preview: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    cssClass: 'banner-stars',
  },
  {
    id: 'banner_nebula',
    name: 'Nebulosa',
    description: 'Swirl galático roxo e misterioso',
    category: 'turnBanner',
    price: 500,
    preview: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%)',
    cssClass: 'banner-nebula',
  },
];

export const ITEMS_BY_CATEGORY: Record<ShopCategory, ShopItem[]> = {
  boardSkin:   SHOP_ITEMS.filter(i => i.category === 'boardSkin'),
  cardFrame:   SHOP_ITEMS.filter(i => i.category === 'cardFrame'),
  profileFrame: SHOP_ITEMS.filter(i => i.category === 'profileFrame'),
  turnBanner:  SHOP_ITEMS.filter(i => i.category === 'turnBanner'),
};

export const ITEM_BY_ID: Record<string, ShopItem> = Object.fromEntries(
  SHOP_ITEMS.map(i => [i.id, i])
);

export const CATEGORY_LABELS: Record<ShopCategory, { label: string; icon: string }> = {
  boardSkin:   { label: 'Skin do Tabuleiro', icon: '🎨' },
  cardFrame:   { label: 'Borda dos Cards',   icon: '🖼️' },
  profileFrame: { label: 'Moldura do Perfil', icon: '👤' },
  turnBanner:  { label: 'Animação de Turno', icon: '✨' },
};

export const DEFAULT_EQUIPPED: Record<ShopCategory, string> = {
  boardSkin:   'default',
  cardFrame:   'default_frame',
  profileFrame: 'no_frame',
  turnBanner:  'banner_default',
};
