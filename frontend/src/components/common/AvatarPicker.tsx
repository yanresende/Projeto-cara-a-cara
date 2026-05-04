import React, { useEffect, useState } from 'react';
import { API_URL } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import './AvatarPicker.css';

interface CharacterOption {
  id: string;
  name: string;
  imageUrl: string;
}

interface ThemeOption {
  id: string;
  name: string;
  coverImageUrl?: string;
}

interface AvatarPickerProps {
  currentAvatarUrl?: string | null;
  onClose: () => void;
  onSaved: (avatarUrl: string | null) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ currentAvatarUrl, onClose, onSaved }) => {
  const { token, refreshUser } = useAuth();
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [loadingChars, setLoadingChars] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/themes`)
      .then(r => r.json())
      .then(data => {
        setThemes(data.themes || []);
        if (data.themes?.length > 0) {
          setSelectedThemeId(data.themes[0].id);
        }
      })
      .catch(() => setError('Erro ao carregar temas'))
      .finally(() => setLoadingThemes(false));
  }, []);

  useEffect(() => {
    if (!selectedThemeId) return;
    setLoadingChars(true);
    setCharacters([]);
    fetch(`${API_URL}/api/themes/${selectedThemeId}/characters`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setCharacters(data.characters || []))
      .catch(() => setError('Erro ao carregar personagens'))
      .finally(() => setLoadingChars(false));
  }, [selectedThemeId, token]);

  const handleSelect = async (avatarUrl: string) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/me/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar avatar');
        return;
      }
      await refreshUser();
      onSaved(avatarUrl);
      onClose();
    } catch {
      setError('Erro ao salvar avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/me/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarUrl: null }),
      });
      if (!res.ok) {
        setError('Erro ao remover avatar');
        return;
      }
      await refreshUser();
      onSaved(null);
      onClose();
    } catch {
      setError('Erro ao remover avatar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="avatar-picker-overlay" onClick={onClose}>
      <div className="avatar-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="avatar-picker-header">
          <h2>Escolher foto de perfil</h2>
          <button className="avatar-picker-close" onClick={onClose}>✕</button>
        </div>

        <p className="avatar-picker-hint">Escolha um personagem de qualquer tema para ser sua foto de perfil.</p>

        {error && <div className="avatar-picker-error">{error}</div>}

        {loadingThemes ? (
          <div className="avatar-picker-loading">Carregando temas...</div>
        ) : (
          <>
            <div className="avatar-theme-tabs">
              {themes.map(t => (
                <button
                  key={t.id}
                  className={`avatar-theme-tab ${selectedThemeId === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedThemeId(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="avatar-characters-grid">
              {loadingChars ? (
                <div className="avatar-picker-loading">Carregando personagens...</div>
              ) : characters.length === 0 ? (
                <div className="avatar-picker-empty">Nenhum personagem neste tema.</div>
              ) : (
                characters.map(c => {
                  const isSelected = c.imageUrl === currentAvatarUrl;
                  return (
                    <button
                      key={c.id}
                      className={`avatar-character-btn ${isSelected ? 'selected' : ''} ${saving ? 'disabled' : ''}`}
                      onClick={() => handleSelect(c.imageUrl)}
                      disabled={saving}
                      title={c.name}
                    >
                      <img src={c.imageUrl} alt={c.name} className="avatar-character-img" />
                      <span className="avatar-character-name">{c.name}</span>
                      {isSelected && <span className="avatar-selected-badge">✓</span>}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}

        <div className="avatar-picker-footer">
          {currentAvatarUrl && (
            <button className="avatar-remove-btn" onClick={handleRemove} disabled={saving}>
              Remover foto
            </button>
          )}
          <button className="avatar-cancel-btn" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
