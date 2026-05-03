import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, type ThemeAdmin, type CharacterAdmin } from '../services/adminService';
import { uploadCroppedImage, uploadThemeCover } from '../services/imageService';
import { CropEditor, type CropEditorRef } from '../components/admin/CropEditor';
import './AdminPage.css';

type View = 'themes' | 'characters';
type Modal = 'none' | 'theme-create' | 'theme-edit' | 'char-create' | 'char-edit';

interface ThemeForm {
  name: string;
  description: string;
  coverFile: File | null;
  coverPreview: string;
}

interface CharForm {
  name: string;
  imageFile: File | null;
  imageUrl: string;
}

const emptyThemeForm = (): ThemeForm => ({ name: '', description: '', coverFile: null, coverPreview: '' });
const emptyCharForm = (): CharForm => ({ name: '', imageFile: null, imageUrl: '' });

export function AdminPage() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState<ThemeAdmin[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ThemeAdmin | null>(null);
  const [view, setView] = useState<View>('themes');
  const [modal, setModal] = useState<Modal>('none');
  const [themeForm, setThemeForm] = useState<ThemeForm>(emptyThemeForm());
  const [charForm, setCharForm] = useState<CharForm>(emptyCharForm());
  const [editingTheme, setEditingTheme] = useState<ThemeAdmin | null>(null);
  const [editingChar, setEditingChar] = useState<CharacterAdmin | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const charInputRef = useRef<HTMLInputElement>(null);
  const cropEditorRef = useRef<CropEditorRef>(null);

  useEffect(() => { loadThemes(); }, []);

  async function loadThemes() {
    try {
      setThemes(await adminService.getThemes());
    } catch {
      setError('Erro ao carregar temas');
    }
  }

  function openCreateTheme() {
    setThemeForm(emptyThemeForm());
    setEditingTheme(null);
    setModal('theme-create');
    setError('');
  }

  function openEditTheme(theme: ThemeAdmin, e: React.MouseEvent) {
    e.stopPropagation();
    setThemeForm({ name: theme.name, description: theme.description || '', coverFile: null, coverPreview: theme.coverImageUrl || '' });
    setEditingTheme(theme);
    setModal('theme-edit');
    setError('');
  }

  function openCreateChar() {
    setCharForm(emptyCharForm());
    setEditingChar(null);
    setModal('char-create');
    setError('');
  }

  function openEditChar(char: CharacterAdmin, e: React.MouseEvent) {
    e.stopPropagation();
    setCharForm({ name: char.name, imageFile: null, imageUrl: char.imageUrl });
    setEditingChar(char);
    setModal('char-edit');
    setError('');
  }

  function closeModal() {
    setModal('none');
    setError('');
  }

  function handleThemeFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThemeForm(f => ({ ...f, coverFile: file, coverPreview: URL.createObjectURL(file) }));
    e.target.value = '';
  }

  function handleCharFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCharForm(f => ({ ...f, imageFile: file }));
    e.target.value = '';
  }

  async function submitTheme() {
    if (!themeForm.name.trim()) { setError('Nome é obrigatório'); return; }
    setLoading(true);
    setError('');
    try {
      let coverImageUrl: string | undefined;
      if (themeForm.coverFile) {
        coverImageUrl = await uploadThemeCover(themeForm.coverFile, editingTheme?.id || `temp_${Date.now()}`);
      } else if (editingTheme) {
        coverImageUrl = editingTheme.coverImageUrl;
      }

      if (modal === 'theme-edit' && editingTheme) {
        const updated = await adminService.updateTheme(editingTheme.id, {
          name: themeForm.name.trim(),
          description: themeForm.description.trim() || undefined,
          coverImageUrl,
        });
        setThemes(ts => ts.map(t => t.id === updated.id ? { ...updated, characters: t.characters } : t));
        if (selectedTheme?.id === updated.id) {
          setSelectedTheme(p => p ? { ...p, name: updated.name, description: updated.description, coverImageUrl: updated.coverImageUrl } : p);
        }
      } else {
        const created = await adminService.createTheme({
          name: themeForm.name.trim(),
          description: themeForm.description.trim() || undefined,
          coverImageUrl,
        });
        setThemes(ts => [...ts, created]);
      }
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar tema');
    } finally {
      setLoading(false);
    }
  }

  async function deleteTheme(theme: ThemeAdmin, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Excluir o tema "${theme.name}" e todos os seus personagens?`)) return;
    setLoading(true);
    try {
      await adminService.deleteTheme(theme.id);
      setThemes(ts => ts.filter(t => t.id !== theme.id));
      if (selectedTheme?.id === theme.id) { setSelectedTheme(null); setView('themes'); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir tema');
    } finally {
      setLoading(false);
    }
  }

  async function submitChar() {
    if (!charForm.name.trim()) { setError('Nome é obrigatório'); return; }
    if (!charForm.imageFile && !charForm.imageUrl) { setError('Foto é obrigatória'); return; }
    if (!selectedTheme) return;
    setLoading(true);
    setError('');
    try {
      let imageUrl = charForm.imageUrl;
      if (charForm.imageFile) {
        const blob = await cropEditorRef.current!.getCroppedBlob();
        imageUrl = await uploadCroppedImage(blob, selectedTheme.id);
      }

      if (modal === 'char-edit' && editingChar) {
        const updated = await adminService.updateCharacter(selectedTheme.id, editingChar.id, {
          name: charForm.name.trim(),
          imageUrl,
        });
        const chars = selectedTheme.characters.map(c => c.id === updated.id ? updated : c);
        const updatedTheme = { ...selectedTheme, characters: chars };
        setSelectedTheme(updatedTheme);
        setThemes(ts => ts.map(t => t.id === updatedTheme.id ? updatedTheme : t));
      } else {
        const created = await adminService.addCharacter(selectedTheme.id, { name: charForm.name.trim(), imageUrl });
        const updatedTheme = { ...selectedTheme, characters: [...selectedTheme.characters, created] };
        setSelectedTheme(updatedTheme);
        setThemes(ts => ts.map(t => t.id === updatedTheme.id ? updatedTheme : t));
      }
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar personagem');
    } finally {
      setLoading(false);
    }
  }

  async function deleteChar(char: CharacterAdmin, e: React.MouseEvent) {
    e.stopPropagation();
    if (!selectedTheme) return;
    if (!confirm(`Excluir o personagem "${char.name}"?`)) return;
    setLoading(true);
    try {
      await adminService.deleteCharacter(selectedTheme.id, char.id);
      const updatedTheme = { ...selectedTheme, characters: selectedTheme.characters.filter(c => c.id !== char.id) };
      setSelectedTheme(updatedTheme);
      setThemes(ts => ts.map(t => t.id === updatedTheme.id ? updatedTheme : t));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir personagem');
    } finally {
      setLoading(false);
    }
  }

  const isModalOpen = modal !== 'none';
  const isThemeModal = modal === 'theme-create' || modal === 'theme-edit';
  const isCharModal = modal === 'char-create' || modal === 'char-edit';

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1 className="admin-title">Painel Admin</h1>
        <button className="admin-btn-secondary" onClick={() => navigate('/')}>
          ← Voltar ao Jogo
        </button>
      </header>

      {error && !isModalOpen && <div className="admin-error-banner">{error}</div>}

      <div className="admin-content">
        {view === 'themes' ? (
          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Temas</h2>
              <button className="admin-btn-primary" onClick={openCreateTheme}>+ Novo Tema</button>
            </div>
            {themes.length === 0 ? (
              <p className="admin-empty">Nenhum tema cadastrado.</p>
            ) : (
              <div className="admin-themes-grid">
                {themes.map(theme => (
                  <div key={theme.id} className="admin-theme-card" onClick={() => { setSelectedTheme(theme); setView('characters'); }}>
                    {theme.coverImageUrl && <img src={theme.coverImageUrl} alt={theme.name} className="admin-theme-cover" />}
                    <div className="admin-theme-info">
                      <span className="admin-theme-name">{theme.name}</span>
                      {theme.description && <span className="admin-theme-desc">{theme.description}</span>}
                      <span className="admin-theme-count">{theme.characters.length} personagem(ns)</span>
                    </div>
                    <div className="admin-card-actions">
                      <button className="admin-btn-icon admin-btn-edit" title="Editar" onClick={e => openEditTheme(theme, e)}>✏</button>
                      <button className="admin-btn-icon admin-btn-delete" title="Excluir" onClick={e => deleteTheme(theme, e)} disabled={loading}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          selectedTheme && (
            <section className="admin-section">
              <div className="admin-section-header">
                <div className="admin-section-title-group">
                  <button className="admin-btn-back" onClick={() => { setView('themes'); setSelectedTheme(null); }}>← Temas</button>
                  <h2>{selectedTheme.name}</h2>
                </div>
                <button className="admin-btn-primary" onClick={openCreateChar}>+ Personagem</button>
              </div>
              {selectedTheme.characters.length === 0 ? (
                <p className="admin-empty">Nenhum personagem neste tema. Adicione o primeiro!</p>
              ) : (
                <div className="admin-chars-grid">
                  {selectedTheme.characters.map(char => (
                    <div key={char.id} className="admin-char-card">
                      <img src={char.imageUrl} alt={char.name} className="admin-char-img" />
                      <span className="admin-char-name">{char.name}</span>
                      <div className="admin-card-actions">
                        <button className="admin-btn-icon admin-btn-edit" title="Editar" onClick={e => openEditChar(char, e)}>✏</button>
                        <button className="admin-btn-icon admin-btn-delete" title="Excluir" onClick={e => deleteChar(char, e)} disabled={loading}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        )}
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>

            {isThemeModal && (
              <>
                <h3>{modal === 'theme-edit' ? 'Editar Tema' : 'Novo Tema'}</h3>
                <div className="admin-form">
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={themeForm.name}
                    onChange={e => setThemeForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Animais"
                    maxLength={60}
                  />
                  <label>Descrição</label>
                  <input
                    type="text"
                    value={themeForm.description}
                    onChange={e => setThemeForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descrição opcional"
                    maxLength={120}
                  />
                  <label>Capa do tema</label>
                  <div className="admin-upload-area" onClick={() => coverInputRef.current?.click()}>
                    {themeForm.coverPreview
                      ? <img src={themeForm.coverPreview} alt="preview" className="admin-upload-preview" />
                      : <span className="admin-upload-placeholder">Clique para escolher imagem</span>
                    }
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" onChange={handleThemeFileChange} hidden />
                </div>
              </>
            )}

            {isCharModal && (
              <>
                <h3>{modal === 'char-edit' ? 'Editar Personagem' : 'Novo Personagem'}</h3>
                <div className="admin-form">
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={charForm.name}
                    onChange={e => setCharForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Leão"
                    maxLength={60}
                  />
                  <label>Foto *</label>

                  {charForm.imageFile ? (
                    /* CropEditor aparece quando uma nova foto é selecionada */
                    <div className="admin-crop-wrapper">
                      <CropEditor ref={cropEditorRef} file={charForm.imageFile} />
                      <button
                        type="button"
                        className="admin-btn-change-photo"
                        onClick={() => charInputRef.current?.click()}
                      >
                        Trocar foto
                      </button>
                    </div>
                  ) : charForm.imageUrl ? (
                    /* Preview da foto atual (modo edição sem nova foto) */
                    <div className="admin-current-photo">
                      <img src={charForm.imageUrl} alt="atual" className="admin-current-photo-img" />
                      <button
                        type="button"
                        className="admin-btn-change-photo"
                        onClick={() => charInputRef.current?.click()}
                      >
                        Trocar foto
                      </button>
                    </div>
                  ) : (
                    /* Estado inicial: clique para selecionar */
                    <div className="admin-upload-area admin-upload-area--square" onClick={() => charInputRef.current?.click()}>
                      <span className="admin-upload-placeholder">Clique para escolher foto</span>
                    </div>
                  )}

                  <input ref={charInputRef} type="file" accept="image/*" onChange={handleCharFileChange} hidden />
                </div>
              </>
            )}

            {error && <p className="admin-modal-error">{error}</p>}

            <div className="admin-modal-actions">
              <button className="admin-btn-secondary" onClick={closeModal} disabled={loading}>Cancelar</button>
              <button className="admin-btn-primary" onClick={isThemeModal ? submitTheme : submitChar} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
