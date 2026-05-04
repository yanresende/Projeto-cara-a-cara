import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { UserAvatar } from '../components/common/UserAvatar';
import { AvatarPicker } from '../components/common/AvatarPicker';
import { ITEM_BY_ID, DEFAULT_EQUIPPED } from '../utils/shopItems';
import type { League } from '../types/index';

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
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>

      {/* Avatar + nome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <UserAvatar
            username={user.username}
            avatarUrl={user.avatarUrl}
            size={88}
            profileFrameClass={profileFrameItem?.cssClass}
          />
          <button
            onClick={() => setShowAvatarPicker(true)}
            title="Alterar foto de perfil"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: '#6366f1',
              border: '2px solid #1a1a2e',
              color: 'white',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            ✎
          </button>
        </div>
        <div>
          <h1 style={{ margin: 0 }}>{user.username}</h1>
          <button
            onClick={() => setShowAvatarPicker(true)}
            style={{
              marginTop: '6px',
              background: 'none',
              border: 'none',
              color: '#6366f1',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            {user.avatarUrl ? 'Alterar foto de perfil' : 'Adicionar foto de perfil'}
          </button>
        </div>
      </div>

      {/* Badge de liga */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        background: cfg.bg, border: `2px solid ${cfg.color}`,
        borderRadius: '12px', padding: '12px 20px', marginBottom: '20px',
      }}>
        <span style={{ fontSize: '36px' }}>{cfg.icon}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '20px', color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: '14px', color: '#374151' }}><strong>{lp} LP</strong></div>
        </div>
      </div>

      {/* Moedas */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        background: '#fefce8', border: '2px solid #fbbf24',
        borderRadius: '12px', padding: '12px 20px', marginBottom: '20px',
        cursor: 'pointer',
      }} onClick={() => navigate('/shop')} title="Ir para a loja">
        <span style={{ fontSize: '28px' }}>🪙</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '20px', color: '#d97706' }}>{coins} moedas</div>
          <div style={{ fontSize: '12px', color: '#92400e' }}>+15 por vitória · <span style={{ color: '#6366f1', textDecoration: 'underline' }}>Ir à loja</span></div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Estatísticas</h2>
        <p><strong>Jogos Jogados:</strong> {user.gamesPlayed}</p>
        <p><strong>Vitórias:</strong> {user.gamesWon}</p>
        <p><strong>Derrotas:</strong> {user.gamesPlayed - user.gamesWon}</p>
        <p><strong>Taxa de Vitória:</strong> {winRate}%</p>
        <p><strong>League Points:</strong> {lp} LP</p>
      </div>

      {/* Customizações equipadas */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0 }}>Customizações</h2>
          <button onClick={() => navigate('/shop')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
            Gerenciar loja →
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: '🎨 Tabuleiro', item: boardSkinItem },
            { label: '🖼️ Borda dos Cards', item: cardFrameItem },
            { label: '👤 Moldura do Perfil', item: profileFrameItem },
          ].map(({ label, item }) => (
            <div key={label} style={{
              flex: '1 1 160px',
              background: '#f9fafb',
              border: '1.5px solid #e5e7eb',
              borderRadius: '10px',
              padding: '12px',
              minWidth: '140px',
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '6px', background: item?.preview || '#e5e7eb', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1f2937' }}>{item?.name ?? 'Padrão'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
