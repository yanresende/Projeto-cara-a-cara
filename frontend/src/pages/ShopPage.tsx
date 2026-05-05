import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/shopService';
import { Button } from '../components/common/Button';
import {
  ITEMS_BY_CATEGORY,
  CATEGORY_LABELS,
  DEFAULT_EQUIPPED,
  type ShopCategory,
  type ShopItem,
} from '../utils/shopItems';
import type { EquippedItems } from '../types/index';
import './ShopPage.css';

function getRarity(price: number): { label: string; cls: string } | null {
  if (price === 0) return null;
  if (price <= 150) return { label: 'Incomum', cls: 'rarity-uncommon' };
  if (price <= 300) return { label: 'Raro', cls: 'rarity-rare' };
  if (price <= 400) return { label: 'Épico', cls: 'rarity-epic' };
  return { label: 'Lendário', cls: 'rarity-legendary' };
}

function renderPreview(item: ShopItem) {
  switch (item.category) {
    case 'boardSkin':
      return (
        <div className={`shop-card-preview skin-preview ${item.cssClass}`} style={{ background: item.preview }}>
          <div className="skin-mini-board">
            {[...Array(8)].map((_, i) => <div key={i} className="skin-mini-card" />)}
          </div>
        </div>
      );

    case 'cardFrame':
      return (
        <div className={`shop-card-preview frame-preview ${item.cssClass}`}>
          <div className="frame-preview-outer" style={{ background: item.preview }}>
            <div className="frame-preview-inner">
              <span className="frame-preview-symbol">?</span>
            </div>
          </div>
          <div className="frame-preview-outer frame-preview-outer--second" style={{ background: item.preview }}>
            <div className="frame-preview-inner">
              <span className="frame-preview-symbol">!</span>
            </div>
          </div>
        </div>
      );

    case 'profileFrame':
      return (
        <div className={`shop-card-preview profile-preview ${item.cssClass}`}>
          <div
            className="profile-preview-ring"
            style={{ background: item.id === 'no_frame' ? 'rgba(255,255,255,0.12)' : item.preview }}
          >
            <div className="profile-preview-avatar">😊</div>
          </div>
          <div className="profile-preview-label">Perfil</div>
        </div>
      );

    case 'turnBanner':
      return (
        <div className={`shop-card-preview banner-preview ${item.cssClass}`}>
          <div className="banner-preview-scene">
            <div className="banner-preview-tag" style={{ background: item.preview }}>
              <span className="banner-preview-text">✦ Seu Turno! ✦</span>
            </div>
            <div className="banner-preview-sub">Vez do jogador</div>
          </div>
        </div>
      );

    default:
      return <div className="shop-card-preview" style={{ background: item.preview }} />;
  }
}

export const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('boardSkin');
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!user) return <div className="shop-loading">Carregando...</div>;

  const coins = user.coins ?? 0;
  const ownedItemIds = new Set(user.ownedItemIds ?? []);
  const equipped = user.equippedItems ?? {};

  function getEquippedId(category: ShopCategory): string {
    const val = equipped[category];
    return val ?? DEFAULT_EQUIPPED[category];
  }

  function isOwned(item: ShopItem): boolean {
    return item.price === 0 || ownedItemIds.has(item.id);
  }

  function isEquipped(item: ShopItem): boolean {
    return getEquippedId(item.category) === item.id;
  }

  async function handleBuy(item: ShopItem) {
    setLoadingItemId(item.id);
    setFeedback(null);
    try {
      await shopService.buyItem(item.id);
      await refreshUser();
      setFeedback({ type: 'success', message: `${item.name} comprado com sucesso!` });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao comprar' });
    } finally {
      setLoadingItemId(null);
    }
  }

  async function handleEquip(item: ShopItem) {
    setLoadingItemId(item.id);
    setFeedback(null);
    try {
      const newItemId = isEquipped(item) ? null : item.id;
      await shopService.equipItem(newItemId, item.category as keyof EquippedItems);
      await refreshUser();
      setFeedback({
        type: 'success',
        message: newItemId ? `${item.name} equipado!` : `${item.name} removido.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao equipar' });
    } finally {
      setLoadingItemId(null);
    }
  }

  const categories: ShopCategory[] = ['boardSkin', 'cardFrame', 'profileFrame', 'turnBanner'];

  return (
    <div className="shop-page">
      <div className="shop-header">
        <div className="shop-header-left">
          <button className="shop-back-btn" onClick={() => navigate('/')}>← Voltar</button>
          <h1 className="shop-title">🛒 Loja</h1>
        </div>
        <div className="shop-coins-badge">
          <span className="coins-icon">🪙</span>
          <span className="coins-amount">{coins}</span>
          <span className="coins-label">moedas</span>
        </div>
      </div>

      <div className="shop-earn-hint">
        Ganhe <strong>15 moedas</strong> por vitória e troque por customizações exclusivas!
      </div>

      {feedback && (
        <div className={`shop-feedback shop-feedback-${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="shop-category-tabs">
        {categories.map(cat => {
          const cfg = CATEGORY_LABELS[cat];
          return (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => { setActiveCategory(cat); setFeedback(null); }}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      <div className="shop-grid">
        {ITEMS_BY_CATEGORY[activeCategory].map(item => {
          const owned = isOwned(item);
          const equipped_ = isEquipped(item);
          const loading = loadingItemId === item.id;
          const canAfford = coins >= item.price;
          const rarity = getRarity(item.price);

          return (
            <div
              key={item.id}
              className={`shop-card ${equipped_ ? 'shop-card-equipped' : ''} ${!owned && !canAfford ? 'shop-card-locked' : ''}`}
            >
              {renderPreview(item)}

              {rarity && (
                <div className={`shop-rarity-badge ${rarity.cls}`}>{rarity.label}</div>
              )}

              {equipped_ && <div className="shop-card-equipped-badge">✓ Equipado</div>}

              <div className="shop-card-body">
                <h3 className="shop-card-name">{item.name}</h3>
                <p className="shop-card-desc">{item.description}</p>

                <div className="shop-card-footer">
                  {item.price === 0 ? (
                    <span className="shop-card-free">✓ Grátis</span>
                  ) : owned ? (
                    <span className="shop-card-owned">✓ Seu</span>
                  ) : (
                    <span className={`shop-card-price ${!canAfford ? 'shop-card-price-unaffordable' : ''}`}>
                      🪙 {item.price}
                    </span>
                  )}

                  {owned ? (
                    <Button
                      size="small"
                      variant={equipped_ ? 'secondary' : 'primary'}
                      onClick={() => handleEquip(item)}
                      isLoading={loading}
                      disabled={loading}
                    >
                      {equipped_ ? 'Remover' : 'Equipar'}
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      onClick={() => handleBuy(item)}
                      isLoading={loading}
                      disabled={loading || !canAfford}
                    >
                      Comprar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
