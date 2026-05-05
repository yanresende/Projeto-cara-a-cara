import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socketService';
import type { Character, Question } from '../types/index';

export type TurnPhase =
  | 'waiting_start'
  | 'my_turn_ask'
  | 'my_turn_wait_answer'
  | 'my_turn_after_answer'
  | 'opponent_turn'
  | 'opponent_asking_me'
  | 'last_chance_my_turn'
  | 'last_chance_opponent_turn';

interface GameState {
  player1Id: string;
  player2Id: string;
  currentTurnPlayerId: string;
  currentTurnUsername: string;
}

interface UseGameSocketResult {
  gameState: GameState | null;
  characters: Character[];
  mySecretCharacter: Character | null;
  questions: Question[];
  turnPhase: TurnPhase;
  pendingQuestion: string | null;
  eliminatedCharacters: Set<string>;
  isLoading: boolean;
  error: string | null;
  gameEnded: boolean;
  winnerId: string | null;
  winnerName: string | null;
  guessResult: { characterName: string; opponentSecretName: string; isCorrect: boolean; message: string } | null;
  isMyTurn: boolean;
  gameMode: 'online' | 'local';
  opponentEliminatedCount: number;
  lastChance: boolean;
  lastChancePlayerId: string | null;
  submitQuestion: (question: string) => void;
  answerQuestion: (answer: 'sim' | 'nao') => void;
  eliminateCharacter: (characterId: string) => void;
  submitGuess: (characterId: string) => void;
  endTurn: () => void;
  startGame: (roomId: string) => void;
  resetGame: () => void;
}

export const useGameSocket = (roomId: string): UseGameSocketResult => {
  const { user } = useAuth();

  // Ref garante que handlers dentro do useEffect sempre leem o valor atual
  const gameModeRef = useRef<'online' | 'local'>(
    (localStorage.getItem('gameMode') as 'online' | 'local') || 'online'
  );
  const [gameMode, setGameMode] = useState<'online' | 'local'>(gameModeRef.current);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [mySecretCharacter, setMySecretCharacter] = useState<Character | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('waiting_start');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [eliminatedCharacters, setEliminatedCharacters] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [guessResult, setGuessResult] = useState<{ characterName: string; opponentSecretName: string; isCorrect: boolean; message: string } | null>(null);
  const [opponentEliminatedCount, setOpponentEliminatedCount] = useState(0);
  const [lastChance, setLastChance] = useState(false);
  const [lastChancePlayerId, setLastChancePlayerId] = useState<string | null>(null);

  const isMyTurn = gameState?.currentTurnPlayerId === user?.id;

  useEffect(() => {
    const handleGameStarted = (data: any) => {
      const mode: 'online' | 'local' = data.gameMode || 'online';
      gameModeRef.current = mode;
      setGameMode(mode);
      localStorage.setItem('gameMode', mode);

      const mySecret = data.characters.find((c: Character) => c.id === data.mySecretCharacterId) || null;

      setGameState({
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        currentTurnPlayerId: data.firstTurnPlayerId,
        currentTurnUsername: '',
      });
      setCharacters(data.characters || []);
      setMySecretCharacter(mySecret);
      setQuestions([]);
      setEliminatedCharacters(new Set());
      const myFirstPhase = data.firstTurnPlayerId === user?.id
        ? (mode === 'local' ? 'my_turn_after_answer' : 'my_turn_ask')
        : 'opponent_turn';
      setTurnPhase(myFirstPhase);
      setGameEnded(false);
      setIsLoading(false);
      setError(null);
      setGuessResult(null);
    };

    const handleTurnChanged = (data: any) => {
      setGameState(prev => prev ? { ...prev, currentTurnPlayerId: data.currentTurnPlayerId, currentTurnUsername: data.currentTurnUsername } : null);
      if (data.currentTurnPlayerId === user?.id) {
        setTurnPhase(gameModeRef.current === 'local' ? 'my_turn_after_answer' : 'my_turn_ask');
      } else {
        setTurnPhase('opponent_turn');
      }
      setPendingQuestion(null);
      setGuessResult(null);
    };

    // Adversário me fez uma pergunta — preciso responder
    const handleQuestionPending = (data: any) => {
      setPendingQuestion(data.question);
      setTurnPhase('opponent_asking_me');
    };

    // Pergunta foi respondida — atualiza histórico e muda fase
    const handleQuestionAnswered = (data: any) => {
      const newQuestion: Question = {
        id: Date.now().toString(),
        content: data.question,
        askedBy: data.askedByUsername,
        answer: data.answer,
        createdAt: new Date(),
      };
      setQuestions(prev => [...prev, newQuestion]);
      setPendingQuestion(null);
      setIsLoading(false);

      setTurnPhase(prev => {
        if (prev === 'my_turn_wait_answer') return 'my_turn_after_answer';
        if (prev === 'opponent_asking_me') return 'opponent_turn';
        return prev;
      });
    };

    const handleGuessResult = (data: any) => {
      setGuessResult({ characterName: data.characterName, opponentSecretName: data.opponentSecretName, isCorrect: data.isCorrect, message: data.message });
      setIsLoading(false);
    };

    const handleLastChance = (data: any) => {
      setLastChance(true);
      setLastChancePlayerId(data.loserPlayerId);
      // Atualiza currentTurnPlayerId para que isMyTurn reflita corretamente
      setGameState(prev => prev ? { ...prev, currentTurnPlayerId: data.loserPlayerId } : null);
      if (data.loserPlayerId === user?.id) {
        setTurnPhase('last_chance_my_turn');
      } else {
        setTurnPhase('last_chance_opponent_turn');
      }
    };

    const handleGameEnded = (data: any) => {
      setGameEnded(true);
      setWinnerId(data.winnerId);
      setWinnerName(data.winnerUsername);
      setIsLoading(false);
    };

    const handleGameStateRestored = (data: any) => {
      const mode: 'online' | 'local' = data.gameMode || gameModeRef.current;
      gameModeRef.current = mode;
      setGameMode(mode);
      localStorage.setItem('gameMode', mode);

      const mySecret = data.characters.find((c: Character) => c.id === data.mySecretCharacterId) || null;

      setGameState({
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        currentTurnPlayerId: data.currentTurnPlayerId,
        currentTurnUsername: data.currentTurnUsername,
      });
      setCharacters(data.characters || []);
      setMySecretCharacter(mySecret);
      setQuestions(data.questions || []);
      setEliminatedCharacters(new Set());
      setGameEnded(false);
      setIsLoading(false);
      setError(null);
      setGuessResult(null);
      setLastChance(data.lastChance || false);
      setLastChancePlayerId(data.lastChancePlayerId || null);

      // Calcular quantos personagens do adversário foram eliminados
      const isPlayer1 = data.player1Id === user?.id;
      const opponentEliminatedCount = isPlayer1 ? data.player2EliminatedCount : data.player1EliminatedCount;
      setOpponentEliminatedCount(opponentEliminatedCount || 0);

      if (data.lastChance) {
        if (data.lastChancePlayerId === user?.id) {
          setTurnPhase('last_chance_my_turn');
        } else {
          setTurnPhase('last_chance_opponent_turn');
        }
      } else if (mode === 'local') {
        setTurnPhase(data.isMyTurn ? 'my_turn_after_answer' : 'opponent_turn');
      } else if (data.isMyTurn) {
        if (data.waitingForAnswer) {
          setTurnPhase('my_turn_wait_answer');
        } else if (data.hasAskedThisTurn) {
          setTurnPhase('my_turn_after_answer');
        } else {
          setTurnPhase('my_turn_ask');
        }
      } else if (data.pendingQuestion) {
        setPendingQuestion(data.pendingQuestion);
        setTurnPhase('opponent_asking_me');
      } else {
        setTurnPhase('opponent_turn');
      }
    };

    const handleError = (data: any) => {
      setError(data.message || 'Erro no jogo');
      setIsLoading(false);
    };

    const handleCharacterEliminated = (data: any) => {
      if (data.playerId !== user?.id) {
        setOpponentEliminatedCount(data.remainingCount);
      }
    };

    socketService.on('game_started', handleGameStarted);
    socketService.on('game_state_restored', handleGameStateRestored);
    socketService.on('turn_changed', handleTurnChanged);
    socketService.on('question_pending', handleQuestionPending);
    socketService.on('question_answered', handleQuestionAnswered);
    socketService.on('guess_result', handleGuessResult);
    socketService.on('last_chance', handleLastChance);
    socketService.on('game_ended', handleGameEnded);
    socketService.on('character_eliminated', handleCharacterEliminated);
    socketService.on('error', handleError);
    socketService.on('game_error', handleError);

    return () => {
      socketService.off('game_started', handleGameStarted);
      socketService.off('game_state_restored', handleGameStateRestored);
      socketService.off('turn_changed', handleTurnChanged);
      socketService.off('question_pending', handleQuestionPending);
      socketService.off('question_answered', handleQuestionAnswered);
      socketService.off('guess_result', handleGuessResult);
      socketService.off('last_chance', handleLastChance);
      socketService.off('game_ended', handleGameEnded);
      socketService.off('character_eliminated', handleCharacterEliminated);
      socketService.off('error', handleError);
      socketService.off('game_error', handleError);
    };
  }, [roomId, user?.id]);

  const submitQuestion = (question: string) => {
    setIsLoading(true);
    setError(null);
    socketService.emit('submit_question', { roomId, question }, (response: any) => {
      setIsLoading(false);
      if (!response.success) {
        setError(response.error || 'Erro ao enviar pergunta');
      } else {
        setTurnPhase('my_turn_wait_answer');
      }
    });
  };

  const answerQuestion = (answer: 'sim' | 'nao') => {
    setIsLoading(true);
    setError(null);
    socketService.emit('answer_question', { roomId, answer }, (response: any) => {
      setIsLoading(false);
      if (!response.success) {
        setError(response.error || 'Erro ao responder');
      }
    });
  };

  const eliminateCharacter = (characterId: string) => {
    setEliminatedCharacters(prev => {
      const next = new Set(prev);
      const isEliminated = next.has(characterId);

      if (isEliminated) {
        next.delete(characterId);
      } else {
        next.add(characterId);
      }

      // Sincronizar com servidor
      socketService.emit('eliminate_character', { roomId, characterId }, (response: any) => {
        if (!response.success) {
          // Desfazer eliminação local se falhar
          setEliminatedCharacters(current => {
            const reverted = new Set(current);
            if (isEliminated) {
              reverted.add(characterId);
            } else {
              reverted.delete(characterId);
            }
            return reverted;
          });
        }
      });

      return next;
    });
  };

  const submitGuess = (characterId: string) => {
    setIsLoading(true);
    setError(null);
    socketService.emit('submit_guess', { roomId, characterId }, (response: any) => {
      setIsLoading(false);
      if (!response.success) {
        setError(response.error || 'Erro ao adivinhar');
      }
    });
  };

  const endTurn = () => {
    setIsLoading(true);
    setError(null);
    socketService.emit('end_turn', { roomId }, (response: any) => {
      setIsLoading(false);
      if (!response.success) {
        setError(response.error || 'Erro ao finalizar turno');
      }
    });
  };

  const startGame = (roomIdParam: string) => {
    setIsLoading(true);
    setError(null);
    socketService.startGame(roomIdParam, (response: any) => {
      if (!response.success) {
        setError(response.error || 'Erro ao iniciar jogo');
        setIsLoading(false);
      }
    });
  };

  const resetGame = () => {
    setGameState(null);
    setCharacters([]);
    setMySecretCharacter(null);
    setQuestions([]);
    setTurnPhase('waiting_start');
    setPendingQuestion(null);
    setEliminatedCharacters(new Set());
    setIsLoading(false);
    setError(null);
    setGameEnded(false);
    setWinnerId(null);
    setWinnerName(null);
    setGuessResult(null);
    setOpponentEliminatedCount(0);
    setLastChance(false);
    setLastChancePlayerId(null);
  };

  return {
    gameState,
    characters,
    mySecretCharacter,
    questions,
    turnPhase,
    pendingQuestion,
    eliminatedCharacters,
    isLoading,
    error,
    gameEnded,
    winnerId,
    winnerName,
    guessResult,
    isMyTurn,
    gameMode,
    opponentEliminatedCount,
    lastChance,
    lastChancePlayerId,
    submitQuestion,
    answerQuestion,
    eliminateCharacter,
    submitGuess,
    endTurn,
    startGame,
    resetGame,
  };
};
