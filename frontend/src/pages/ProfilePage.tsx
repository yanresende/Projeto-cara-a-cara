import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { UserAvatar } from '../components/common/UserAvatar';
import { AvatarPicker } from '../components/common/AvatarPicker';
import { ITEM_BY_ID, DEFAULT_EQUIPPED } from '../utils/shopItems';
import type { League } from '../types/index';
import './ProfilePage.css';

const LEAGUE_CONFIG: Record<League, { label: string; icon: string; color: string; bg: string }> = {
  campeao:  { label: 'Campeão',  icon: '👑', color: '#7c3aed', bg: '#f5f3ff' },
  diamante: { label: 'Diamante', icon: '💎', color: '#0891b2', bg: '#ecfeff' },
  ouro:     { label: 'Ouro',     icon: '🏆', color: '#d97706', bg: '#fffbeb' },
  prata:    { label: 'Prata',    icon: '🥈', color: '#6b7280', bg: '#f9fafb' },
  bronze:   { label: 'Bronze',   icon: '🥉', color: '#b45309', bg: '#fef3c7' },
};

function getLeague(lp: number): League {
  if (lp >= 500) return 'diamante';
  if (lp >= 250) return 'ouro';
  if (lp >= 100) return 'prata';
  return 'bronze';
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  const winRate = user.gamesPlayed > 0 ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1) : '0';
  const lp = user.leaguePoints ?? 0;
  const league = getLeague(lp);
  const cfg = LEAGUE_CONFIG[league];
  const coins = user.coins ?? 0;
  const equipped = user.equippedItems ?? {};
  const profileFrameId = equipped.profileFrame ?? DEFAULT_EQUIPPED.profileFrame;
  const profileFrameItem = ITEM_BY_ID[profileFrameId];
  const boardSkinItem = ITEM_BY_ID[equipped.boardSkin ?? DEFAULT_EQUIPPED.boardSkin];
  const cardFrameItem = ITEM_BY_ID[equipped.cardFrame ?? DEFAULT_EQUIPPED.cardFrame];

  return (
    <div className="profile-page">

      {/* Voltar */}
      <div className="profile-page-header">
        <Button variant="secondary" size="small" onClick={() => navigate('/')}>← Lobby</Button>
      </div>

      {/* Hero: avatar + nome + liga */}
      <div className="profile-hero profile-glass">
        <div className="profile-avatar-wrap">
          <UserAvatar
            username={user.username}
            avatarUrl={user.avatarUrl}
            size={90}
            profileFrameClass={profileFrameItem?.cssClass}
          />
          <button
            className="profile-avatar-edit-btn"
            onClick={() => setShowAvatarPicker(true)}
            title="Alterar foto de perfil"
          >
            ✎
          </button>
        </div>

        <div className="profile-hero-info">
          <h1 className="profile-username">{user.username}</h1>
          <button
            className="profile-change-avatar-link"
            onClick={() => setShowAvatarPicker(true)}
          >
            {user.avatarUrl ? 'Alterar foto de perfil' : 'Adicionar foto de perfil'}
          </button>
          <div className="profile-league-pill">
            <span className="profile-league-pill-icon">{cfg.icon}</span>
            <div>
              <div className="profile-league-pill-name">{cfg.label}</div>
              <div className="profile-league-pill-lp">{lp} LP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Moedas */}
      <div
        className="profile-coins-card profile-glass"
        onClick={() => navigate('/shop')}
        title="Ir para a loja"
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate('/shop')}
      >
        <span className="profile-coins-icon">🪙</span>
        <div>
          <div className="profile-coins-amount">{coins} moedas</div>
          <div className="profile-coins-hint">+15 por vitória · Ir à loja</div>
        </div>
        <span className="profile-coins-arrow">›</span>
      </div>

      {/* Estatísticas */}
      <div className="profile-section profile-glass">
        <div className="profile-section-title">Estatísticas</div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-value">{user.gamesPlayed}</div>
            <div className="stat-card-label">Jogos</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value wins">{user.gamesWon}</div>
            <div className="stat-card-label">Vitórias</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value losses">{user.gamesPlayed - user.gamesWon}</div>
            <div className="stat-card-label">Derrotas</div>
          </div>
        </div>

        <div className="winrate-section">
          <div className="winrate-row">
            <span className="winrate-row-label">Taxa de Vitória</span>
            <span className="winrate-row-value">{winRate}%</span>
          </div>
          <div className="winrate-track">
            <div className="winrate-fill" style={{ width: `${winRate}%` }} />
          </div>
        </div>

        <div className="lp-row">
          <span className="lp-row-label">League Points</span>
          <span className="lp-row-value">{lp} LP</span>
        </div>
      </div>

      {/* Customizações */}
      <div className="profile-section profile-glass">
        <div className="profile-section-head">
          <span className="profile-section-title">Customizações</span>
          <button className="profile-section-action" onClick={() => navigate('/shop')}>
            Gerenciar loja →
          </button>
        </div>
        <div className="customizations-grid">
          {[
            { label: '🎨 Tabuleiro', item: boardSkinItem },
            { label: '🖼️ Bordas', item: cardFrameItem },
            { label: '👤 Moldura', item: profileFrameItem },
          ].map(({ label, item }) => (
            <div key={label} className="customization-card">
              <div className="customization-label">{label}</div>
              <div className="customization-item">
                <div
                  className="customization-preview"
                  style={{ background: item?.preview || '#6b7280' }}
                />
                <span className="customization-name">{item?.name ?? 'Padrão'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="profile-actions">
        <Button onClick={() => navigate('/shop')}>Loja</Button>
        <Button onClick={() => navigate('/ranking')}>Ver Ranking</Button>
        <Button variant="secondary" onClick={() => navigate('/')}>Voltar ao Lobby</Button>
        <Button variant="danger" onClick={handleLogout}>Sair</Button>
      </div>

      {showAvatarPicker && (
        <AvatarPicker
          currentAvatarUrl={user.avatarUrl}
          onClose={() => setShowAvatarPicker(false)}
          onSaved={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
};
