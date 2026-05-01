import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socketService';
import { SOCKET_EVENTS } from '../utils/constants';
import type { GameRound, Question, Character } from '../types/index';

interface UseGameSocketResult {
  game: GameRound | null;
  characters: Character[];
  isQuestioner: boolean;
  questions: Question[];
  isLoading: boolean;
  error: string | null;
  gameEnded: boolean;
  winner?: string;
  winnerName?: string;
  submitQuestion: (question: string) => void;
  submitGuess: (characterId: string) => void;
  startGame: (roomId: string) => void;
  resetGame: () => void;
}

export const useGameSocket = (roomId: string): UseGameSocketResult => {
  const { user } = useAuth();
  const [game, setGame] = useState<GameRound | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isQuestioner, setIsQuestioner] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string>();
  const [winnerName, setWinnerName] = useState<string>();

  useEffect(() => {
    // Listen for game started
    const handleGameStarted = (data: any) => {
      console.log('[GameSocket] game_started:', data);
      const myRole = data.questionerId === user?.id ? 'questioner' : 'thinker';
      setIsQuestioner(myRole === 'questioner');

      const gameData: GameRound = {
        id: '1',
        roomId,
        themeId: data.themeId,
        questionerPlayerId: data.questionerId,
        thinkerPlayerId: data.thinkerId,
        secretCharacterId: '',
        questions: [],
        guesses: [],
        completed: false,
        createdAt: new Date(),
      };
      setGame(gameData);
      setCharacters(data.characters || []);
      setQuestions([]);
      setGameEnded(false);
      setError(null);
    };

    // Listen for question submitted
    const handleQuestionSubmitted = (data: any) => {
      console.log('[GameSocket] question_submitted:', data);
      const newQuestion: Question = {
        id: Date.now().toString(),
        content: data.question,
        askedBy: data.questionerUsername,
        answer: data.answer,
        createdAt: new Date(),
      };
      setQuestions(prev => [...prev, newQuestion]);
      setIsLoading(false);
    };

    // Listen for guess result
    const handleGuessResult = (data: any) => {
      console.log('[GameSocket] guess_result:', data);
      setError(data.message || null);
      setIsLoading(false);
    };

    // Listen for game ended
    const handleGameEnded = (data: any) => {
      console.log('[GameSocket] game_ended:', data);
      setGameEnded(true);
      setWinner(data.winnerId);
      setWinnerName(data.winnerUsername);
      setIsLoading(false);
    };

    // Listen for errors
    const handleError = (data: any) => {
      console.error('[GameSocket] error:', data);
      setError(data.message || 'Erro no jogo');
      setIsLoading(false);
    };

    socketService.on(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);
    socketService.on(SOCKET_EVENTS.QUESTION_SUBMITTED, handleQuestionSubmitted);
    socketService.on(SOCKET_EVENTS.GUESS_RESULT, handleGuessResult);
    socketService.on(SOCKET_EVENTS.GAME_ENDED, handleGameEnded);
    socketService.on(SOCKET_EVENTS.ERROR, handleError);
    socketService.on(SOCKET_EVENTS.GAME_ERROR, handleError);

    return () => {
      socketService.off(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);
      socketService.off(SOCKET_EVENTS.QUESTION_SUBMITTED, handleQuestionSubmitted);
      socketService.off(SOCKET_EVENTS.GUESS_RESULT, handleGuessResult);
      socketService.off(SOCKET_EVENTS.GAME_ENDED, handleGameEnded);
      socketService.off(SOCKET_EVENTS.ERROR, handleError);
      socketService.off(SOCKET_EVENTS.GAME_ERROR, handleError);
    };
  }, [roomId, user?.id]);

  const submitQuestion = (question: string) => {
    setIsLoading(true);
    setError(null);
    socketService.submitQuestion(roomId, question, (response: any) => {
      if (!response.success) {
        setError(response.error || 'Erro ao enviar pergunta');
        setIsLoading(false);
      }
    });
  };

  const submitGuess = (characterId: string) => {
    setIsLoading(true);
    setError(null);
    socketService.submitGuess(roomId, characterId, (response: any) => {
      if (!response.success) {
        setError(response.error || 'Erro ao adivinhar');
        setIsLoading(false);
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
    setGame(null);
    setCharacters([]);
    setIsQuestioner(false);
    setQuestions([]);
    setIsLoading(false);
    setError(null);
    setGameEnded(false);
    setWinner(undefined);
    setWinnerName(undefined);
  };

  return {
    game,
    characters,
    isQuestioner,
    questions,
    isLoading,
    error,
    gameEnded,
    winner,
    winnerName,
    submitQuestion,
    submitGuess,
    startGame,
    resetGame,
  };
};
