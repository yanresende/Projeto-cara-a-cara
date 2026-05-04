import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/constants';
import { Button } from '../components/common/Button';
import './RankingPage.css';

interface RankedPlayer {
  rank: number;
  id: string;
  username: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: string;
  score: number;
}

interface LeaderboardResponse {
  players: RankedPlayer[];
  total: number;
  limit: number;
  offset: number;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export const RankingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<RankedPlayer | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/ranking/leaderboard?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Falha ao carregar ranking');
      const data: LeaderboardResponse = await res.json();
      setPlayers(data.players);
      setTotal(data.total);

      const me = data.players.find(p => p.id === user?.id);
      if (me) {
        setMyRank(me);
      } else if (user) {
        // Usuário existe mas não aparece no top 50, buscar rank individual
        const userRes = await fetch(`${API_URL}/api/ranking/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.rank > 0) {
            setMyRank({
              rank: userData.rank,
              id: user.id,
              username: user.username,
              gamesPlayed: userData.user.gamesPlayed,
              gamesWon: userData.user.gamesWon,
              gamesLost: userData.user.gamesPlayed - userData.user.gamesWon,
              winRate: userData.user.winRate,
              score: userData.user.gamesWon * 10,
            });
          }
        }
      }
    } catch (err) {
      setError('Não foi possível carregar o ranking. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const podium = players.slice(0, 3);
  const rest = players.slice(3);
  const myRankNotInTop = myRank && myRank.rank > 50;

  return (
    <div className="ranking-page">
      <div className="ranking-header">
        <div className="ranking-header-left">
          <Button variant="secondary" size="small" onClick={() => navigate('/')}>
            ← Lobby
          </Button>
          <h1>Ranking</h1>
        </div>
        <div className="ranking-header-right">
          <span className="ranking-total">{total} jogador{total !== 1 ? 'es' : ''}</span>
        </div>
      </div>

      <div className="ranking-content">
        {loading && (
          <div className="ranking-loading">
            <div className="ranking-spinner" />
            <p>Carregando ranking...</p>
          </div>
        )}

        {error && !loading && (
          <div className="ranking-error">
            <p>{error}</p>
            <Button onClick={fetchLeaderboard}>Tentar novamente</Button>
          </div>
        )}

        {!loading && !error && players.length === 0 && (
          <div className="ranking-empty">
            <p>Nenhuma partida registrada ainda. Seja o primeiro a jogar!</p>
            <Button onClick={() => navigate('/')}>Jogar agora</Button>
          </div>
        )}

        {!loading && !error && players.length > 0 && (
          <>
            {/* Pódio */}
            {podium.length >= 2 && (
              <div className="ranking-podium">
                {/* Ordem visual: 2º, 1º, 3º */}
                {[podium[1], podium[0], podium[2]].filter(Boolean).map((p, visualIndex) => {
                  const podiumOrder = [1, 0, 2];
                  const originalIndex = podiumOrder[visualIndex];
                  const isFirst = originalIndex === 0;
                  const isMe = p.id === user?.id;
                  return (
                    <div
                      key={p.id}
                      className={`podium-step podium-step-${originalIndex + 1}${isMe ? ' podium-me' : ''}`}
                    >
                      <div className="podium-medal">{MEDAL[originalIndex]}</div>
                      <div className="podium-avatar" style={{ width: isFirst ? 72 : 60, height: isFirst ? 72 : 60 }}>
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="podium-username">{p.username}{isMe ? ' (você)' : ''}</div>
                      <div className="podium-score">{p.score} pts</div>
                      <div className="podium-wins">{p.gamesWon} vitória{p.gamesWon !== 1 ? 's' : ''}</div>
                      <div className={`podium-bar podium-bar-${originalIndex + 1}`} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tabela */}
            <div className="ranking-table-section">
              <div className="ranking-score-info">
                <span>Score = vitórias × 10 + taxa de vitória</span>
              </div>
              <div className="ranking-table-wrapper">
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Jogador</th>
                      <th>Vitórias</th>
                      <th>Derrotas</th>
                      <th>Taxa</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map(p => {
                      const isMe = p.id === user?.id;
                      return (
                        <tr key={p.id} className={isMe ? 'ranking-row-me' : ''}>
                          <td className="ranking-rank">
                            {p.rank <= 3 ? MEDAL[p.rank - 1] : <span className="rank-number">{p.rank}</span>}
                          </td>
                          <td className="ranking-username">
                            {p.username}
                            {isMe && <span className="you-badge">você</span>}
                          </td>
                          <td className="ranking-wins">{p.gamesWon}</td>
                          <td className="ranking-losses">{p.gamesLost}</td>
                          <td className="ranking-winrate">
                            <div className="winrate-bar-container">
                              <div
                                className="winrate-bar-fill"
                                style={{ width: `${Math.min(parseFloat(p.winRate), 100)}%` }}
                              />
                              <span className="winrate-label">{p.winRate}%</span>
                            </div>
                          </td>
                          <td className="ranking-score">{p.score}</td>
                        </tr>
                      );
                    })}

                    {/* Mostrar posição do usuário se estiver fora do top 50 */}
                    {myRankNotInTop && myRank && (
                      <>
                        <tr className="ranking-gap-row">
                          <td colSpan={6}>...</td>
                        </tr>
                        <tr className="ranking-row-me">
                          <td className="ranking-rank">
                            <span className="rank-number">{myRank.rank}</span>
                          </td>
                          <td className="ranking-username">
                            {myRank.username}
                            <span className="you-badge">você</span>
                          </td>
                          <td className="ranking-wins">{myRank.gamesWon}</td>
                          <td className="ranking-losses">{myRank.gamesLost}</td>
                          <td className="ranking-winrate">
                            <div className="winrate-bar-container">
                              <div
                                className="winrate-bar-fill"
                                style={{ width: `${Math.min(parseFloat(myRank.winRate), 100)}%` }}
                              />
                              <span className="winrate-label">{myRank.winRate}%</span>
                            </div>
                          </td>
                          <td className="ranking-score">{myRank.score}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
