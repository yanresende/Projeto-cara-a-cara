import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/constants';
import { Button } from '../components/common/Button';
import type { League } from '../types/index';
import './RankingPage.css';

interface RankedPlayer {
  rank: number;
  id: string;
  username: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: string;
  leaguePoints: number;
  league: League;
}

interface LeaderboardResponse {
  players: RankedPlayer[];
  total: number;
  totalAll: number;
  leagueCounts: Record<League, number>;
  limit: number;
  offset: number;
}

const LEAGUE_CONFIG: Record<League, { label: string; icon: string; color: string; minLP: number; maxLP: number | null; bg: string }> = {
  campeao:  { label: 'Campeão',  icon: '👑', color: '#7c3aed', bg: '#f5f3ff', minLP: 500, maxLP: null },
  diamante: { label: 'Diamante', icon: '💎', color: '#0891b2', bg: '#ecfeff', minLP: 500, maxLP: null },
  ouro:     { label: 'Ouro',     icon: '🏆', color: '#d97706', bg: '#fffbeb', minLP: 250, maxLP: 499 },
  prata:    { label: 'Prata',    icon: '🥈', color: '#6b7280', bg: '#f9fafb', minLP: 100, maxLP: 249 },
  bronze:   { label: 'Bronze',   icon: '🥉', color: '#b45309', bg: '#fef3c7', minLP: 0,   maxLP: 99  },
};

const LEAGUE_ORDER: League[] = ['campeao', 'diamante', 'ouro', 'prata', 'bronze'];

function getLeague(lp: number, rank: number): League {
  if (rank <= 20 && lp >= 500) return 'campeao';
  if (rank <= 30 && lp >= 500) return 'diamante';
  if (lp >= 250) return 'ouro';
  if (lp >= 100) return 'prata';
  return 'bronze';
}

function lpToNextLeague(lp: number, league: League): { current: number; needed: number; label: string } | null {
  if (league === 'campeao') return null;
  if (league === 'diamante') return null;
  const thresholds: Record<string, { needed: number; label: string }> = {
    bronze: { needed: 100, label: 'Prata' },
    prata:  { needed: 250, label: 'Ouro' },
    ouro:   { needed: 500, label: 'Diamante' },
  };
  const t = thresholds[league];
  if (!t) return null;
  return { current: lp, needed: t.needed, label: t.label };
}

export const RankingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [allPlayers, setAllPlayers] = useState<RankedPlayer[]>([]);
  const [leagueCounts, setLeagueCounts] = useState<Record<League, number>>({ campeao: 0, diamante: 0, ouro: 0, prata: 0, bronze: 0 });
  const [totalAll, setTotalAll] = useState(0);
  const [selectedLeague, setSelectedLeague] = useState<League | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/ranking/leaderboard?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Falha ao carregar ranking');
      const data: LeaderboardResponse = await res.json();
      setAllPlayers(data.players);
      setLeagueCounts(data.leagueCounts);
      setTotalAll(data.totalAll);
    } catch {
      setError('Não foi possível carregar o ranking. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const myPlayer = allPlayers.find(p => p.id === user?.id);
  const myLeague = myPlayer
    ? myPlayer.league
    : user
    ? getLeague(user.leaguePoints ?? 0, Infinity)
    : null;

  const displayedPlayers = selectedLeague === 'all'
    ? allPlayers
    : allPlayers.filter(p => p.league === selectedLeague);

  const cfg = myLeague ? LEAGUE_CONFIG[myLeague] : null;
  const progress = myPlayer ? lpToNextLeague(myPlayer.leaguePoints, myPlayer.league) : null;

  return (
    <div className="ranking-page">
      <div className="ranking-header">
        <div className="ranking-header-left">
          <Button variant="secondary" size="small" onClick={() => navigate('/')}>← Lobby</Button>
          <h1>Ranking</h1>
        </div>
        <div className="ranking-header-right">
          <span className="ranking-total">{totalAll} jogador{totalAll !== 1 ? 'es' : ''}</span>
        </div>
      </div>

      <div className="ranking-content">

        {/* Card da liga do jogador */}
        {!loading && !error && cfg && myPlayer && (
          <div className="my-league-card" style={{ borderColor: cfg.color, background: cfg.bg }}>
            <div className="my-league-icon">{cfg.icon}</div>
            <div className="my-league-info">
              <div className="my-league-name" style={{ color: cfg.color }}>{cfg.label}</div>
              <div className="my-league-lp"><strong>{myPlayer.leaguePoints} LP</strong></div>
              {progress && (
                <div className="my-league-progress">
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min((progress.current / progress.needed) * 100, 100)}%`, background: cfg.color }}
                    />
                  </div>
                  <span>{progress.current} / {progress.needed} LP para {progress.label}</span>
                </div>
              )}
              {myPlayer.league === 'diamante' && (
                <div className="my-league-progress">
                  <span>Top 20 com 500+ LP para alcançar Campeão (você está entre os top 30)</span>
                </div>
              )}
              {myPlayer.league === 'campeao' && (
                <div className="my-league-progress"><span>Você está na elite! Posição #{myPlayer.rank}</span></div>
              )}
            </div>
            <div className="my-league-stats">
              <div className="my-stat"><span className="my-stat-val" style={{ color: '#059669' }}>{myPlayer.gamesWon}V</span><span className="my-stat-lbl">vitórias</span></div>
              <div className="my-stat"><span className="my-stat-val" style={{ color: '#dc2626' }}>{myPlayer.gamesLost}D</span><span className="my-stat-lbl">derrotas</span></div>
              <div className="my-stat"><span className="my-stat-val">#{myPlayer.rank}</span><span className="my-stat-lbl">posição</span></div>
            </div>
          </div>
        )}

        {loading && (
          <div className="ranking-loading"><div className="ranking-spinner" /><p>Carregando ranking...</p></div>
        )}

        {error && !loading && (
          <div className="ranking-error"><p>{error}</p><Button onClick={fetchLeaderboard}>Tentar novamente</Button></div>
        )}

        {!loading && !error && (
          <>
            {/* Abas de liga */}
            <div className="league-tabs">
              <button
                className={`league-tab ${selectedLeague === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedLeague('all')}
              >
                Todos <span className="tab-count">{totalAll}</span>
              </button>
              {LEAGUE_ORDER.map(lg => {
                const c = LEAGUE_CONFIG[lg];
                return (
                  <button
                    key={lg}
                    className={`league-tab league-tab-${lg} ${selectedLeague === lg ? 'active' : ''}`}
                    onClick={() => setSelectedLeague(lg)}
                    style={selectedLeague === lg ? { borderColor: c.color, color: c.color, background: c.bg } : {}}
                  >
                    {c.icon} {c.label}
                    <span className="tab-count">{leagueCounts[lg]}</span>
                  </button>
                );
              })}
            </div>

            {/* Avisos de ligas exclusivas */}
            {selectedLeague === 'campeao' && (
              <div className="campeao-banner">
                👑 Liga Campeão — apenas os <strong>20 melhores</strong> com 500+ LP
              </div>
            )}
            {selectedLeague === 'diamante' && (
              <div className="campeao-banner" style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)' }}>
                💎 Liga Diamante — apenas as <strong>10 vagas seguintes</strong> (posições 21–30) com 500+ LP
              </div>
            )}

            {displayedPlayers.length === 0 ? (
              <div className="ranking-empty">
                <p>Nenhum jogador nesta liga ainda.</p>
                <Button onClick={() => navigate('/')}>Jogar agora</Button>
              </div>
            ) : (
              <div className="ranking-table-section">
                <div className="ranking-table-wrapper">
                  <table className="ranking-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Jogador</th>
                        <th>Liga</th>
                        <th>LP</th>
                        <th>V</th>
                        <th>D</th>
                        <th>Taxa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedPlayers.map(p => {
                        const isMe = p.id === user?.id;
                        const pc = LEAGUE_CONFIG[p.league];
                        return (
                          <tr key={p.id} className={isMe ? 'ranking-row-me' : ''}>
                            <td className="ranking-rank">
                              <span className="rank-number">{p.rank}</span>
                            </td>
                            <td className="ranking-username">
                              {p.username}
                              {isMe && <span className="you-badge">você</span>}
                            </td>
                            <td>
                              <span className="league-badge" style={{ color: pc.color, background: pc.bg, border: `1px solid ${pc.color}` }}>
                                {pc.icon} {pc.label}
                              </span>
                            </td>
                            <td className="ranking-lp" style={{ color: pc.color }}>{p.leaguePoints}</td>
                            <td className="ranking-wins">{p.gamesWon}</td>
                            <td className="ranking-losses">{p.gamesLost}</td>
                            <td className="ranking-winrate">
                              <div className="winrate-bar-container">
                                <div className="winrate-bar-fill" style={{ width: `${Math.min(parseFloat(p.winRate), 100)}%` }} />
                                <span className="winrate-label">{p.winRate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
