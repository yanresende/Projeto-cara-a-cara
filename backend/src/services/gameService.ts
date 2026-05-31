import { GameRound, Guess, Question } from '../types/index';
import { Character } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../server';

function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class GameService {
  private games: Map<string, GameRound> = new Map();

  async startGame(roomId: string, themeId: string, player1Id: string, player2Id: string): Promise<GameRound> {
    const characters = await prisma.character.findMany({ where: { themeId } });

    if (characters.length < 2) {
      throw new Error('O tema precisa ter pelo menos 2 personagens');
    }

    const shuffled = fisherYatesShuffle(characters);
    const p1Secret = shuffled[0];
    const p2Secret = shuffled[1];

    const firstTurnPlayerId = Math.random() > 0.5 ? player1Id : player2Id;

    const game: GameRound = {
      id: uuidv4(),
      roomId,
      themeId,
      player1Id,
      player2Id,
      player1SecretCharacterId: p1Secret.id,
      player2SecretCharacterId: p2Secret.id,
      currentTurnPlayerId: firstTurnPlayerId,
      hasAskedThisTurn: false,
      pendingQuestion: null,
      waitingForAnswer: false,
      questions: [],
      guesses: [],
      completed: false,
      createdAt: new Date(),
      player1EliminatedCharacterIds: [],
      player2EliminatedCharacterIds: [],
    };

    this.games.set(roomId, game);
    return game;
  }

  submitQuestion(roomId: string, question: string, playerId: string): { question: string } {
    const game = this.games.get(roomId);
    if (!game || game.completed) throw new Error('Nenhum jogo ativo nessa sala');
    if (game.currentTurnPlayerId !== playerId) throw new Error('Não é o seu turno');
    if (game.hasAskedThisTurn) throw new Error('Você já fez sua pergunta neste turno');
    if (game.waitingForAnswer) throw new Error('Aguardando resposta da pergunta anterior');
    if (game.lastChance) throw new Error('Não é possível fazer perguntas durante a última chance');

    game.pendingQuestion = { content: question, askedBy: playerId };
    game.waitingForAnswer = true;
    game.hasAskedThisTurn = true;

    return { question };
  }

  answerQuestion(roomId: string, answer: 'sim' | 'nao', playerId: string): Question {
    const game = this.games.get(roomId);
    if (!game || game.completed) throw new Error('Nenhum jogo ativo nessa sala');
    if (!game.waitingForAnswer || !game.pendingQuestion) throw new Error('Nenhuma pergunta pendente');

    const opponentId = this.getOpponentId(game, game.pendingQuestion.askedBy);
    if (playerId !== opponentId) throw new Error('Apenas o adversário pode responder');

    const q: Question = {
      id: uuidv4(),
      content: game.pendingQuestion.content,
      askedBy: game.pendingQuestion.askedBy,
      answer,
      createdAt: new Date(),
    };

    game.questions.push(q);
    game.pendingQuestion = null;
    game.waitingForAnswer = false;

    return q;
  }

  async submitGuess(roomId: string, characterId: string, playerId: string): Promise<{ correct: boolean; characterName: string; opponentSecretName: string; triggeredLastChance: boolean }> {
    const game = this.games.get(roomId);
    if (!game || game.completed) throw new Error('Nenhum jogo ativo nessa sala');
    if (game.currentTurnPlayerId !== playerId) throw new Error('Não é o seu turno');
    if (game.waitingForAnswer) throw new Error('Ainda aguardando resposta à pergunta');

    const opponentSecretId = this.getOpponentSecretId(game, playerId);
    const isCorrect = characterId === opponentSecretId;

    const guessedCharacter = await prisma.character.findUnique({ where: { id: characterId } });
    const opponentSecret = await prisma.character.findUnique({ where: { id: opponentSecretId } });

    const guess: Guess = {
      characterId,
      createdAt: new Date(),
      correct: isCorrect,
    };
    game.guesses.push(guess);

    if (game.lastChance) {
      // Tentativa de última chance do perdedor
      game.completed = true;
      game.winner = game.originalWinner!;
      if (isCorrect) game.lastChanceSuccess = true;
      await this.persistGame(game);
      return {
        correct: isCorrect,
        characterName: guessedCharacter?.name || '',
        opponentSecretName: opponentSecret?.name || '',
        triggeredLastChance: false,
      };
    }

    if (isCorrect) {
      // Acertou: dá última chance ao perdedor antes de finalizar
      game.lastChance = true;
      game.originalWinner = playerId;
      game.currentTurnPlayerId = this.getOpponentId(game, playerId);
    } else {
      // Adivinhação errada: adversário vence imediatamente
      game.completed = true;
      game.winner = this.getOpponentId(game, playerId);
      await this.persistGame(game);
    }

    return {
      correct: isCorrect,
      characterName: guessedCharacter?.name || '',
      opponentSecretName: opponentSecret?.name || '',
      triggeredLastChance: isCorrect,
    };
  }

  endTurn(roomId: string, playerId: string): { nextTurnPlayerId: string } {
    const game = this.games.get(roomId);
    if (!game || game.completed) throw new Error('Nenhum jogo ativo nessa sala');
    if (game.currentTurnPlayerId !== playerId) throw new Error('Não é o seu turno');
    if (game.waitingForAnswer) throw new Error('Aguardando resposta antes de finalizar o turno');
    if (game.lastChance) throw new Error('Não é possível finalizar o turno durante a última chance');

    game.currentTurnPlayerId = this.getOpponentId(game, playerId);
    game.hasAskedThisTurn = false;

    return { nextTurnPlayerId: game.currentTurnPlayerId };
  }

  eliminateCharacter(roomId: string, characterId: string, playerId: string): { remainingCount: number } {
    const game = this.games.get(roomId);
    if (!game || game.completed) throw new Error('Nenhum jogo ativo nessa sala');
    if (!game.questions.length && game.currentTurnPlayerId !== playerId) {
      throw new Error('Você só pode eliminar durante seu turno');
    }

    const isPlayer1 = playerId === game.player1Id;
    const eliminatedArray = isPlayer1 ? game.player1EliminatedCharacterIds : game.player2EliminatedCharacterIds;

    const idx = eliminatedArray.indexOf(characterId);
    if (idx === -1) {
      eliminatedArray.push(characterId);
    } else {
      eliminatedArray.splice(idx, 1);
    }

    return { remainingCount: eliminatedArray.length };
  }

  private getOpponentId(game: GameRound, playerId: string): string {
    return playerId === game.player1Id ? game.player2Id : game.player1Id;
  }

  private getOpponentSecretId(game: GameRound, playerId: string): string {
    return playerId === game.player1Id
      ? game.player2SecretCharacterId
      : game.player1SecretCharacterId;
  }

  private async persistGame(game: GameRound): Promise<void> {
    try {
      await prisma.game.create({
        data: {
          themeId: game.themeId,
          questionerId: game.player1Id,
          thinkerId: game.player2Id,
          secretCharacterId: game.player1SecretCharacterId,
          questionCount: game.questions.length,
          winnerId: game.winner,
          guessList: {
            create: game.guesses.map(g => ({
              characterId: g.characterId,
              correct: g.correct,
            })),
          },
        },
      });

      if (game.winner) {
        const loserId = this.getOpponentId(game, game.winner);

        // Buscar LP atual do perdedor para não ir abaixo de 0
        const loser = await prisma.user.findUnique({ where: { id: loserId }, select: { leaguePoints: true } });
        const lpWinnerGain = game.lastChanceSuccess ? 15 : 20;
        const lpLoserDeductBase = game.lastChanceSuccess ? 5 : 10;
        const lpDeduct = Math.min(loser?.leaguePoints ?? 0, lpLoserDeductBase);

        await prisma.user.update({
          where: { id: game.winner },
          data: {
            gamesWon: { increment: 1 },
            gamesPlayed: { increment: 1 },
            leaguePoints: { increment: lpWinnerGain },
            coins: { increment: 15 },
          },
        });
        await prisma.user.update({
          where: { id: loserId },
          data: {
            gamesPlayed: { increment: 1 },
            leaguePoints: { decrement: lpDeduct },
          },
        });
      }
    } catch (error) {
      console.error('Erro ao persistir jogo no banco de dados:', error);
    }
  }

  getGameByRoomId(roomId: string): GameRound | null {
    return this.games.get(roomId) || null;
  }

  isGameActive(roomId: string): boolean {
    const game = this.games.get(roomId);
    return game ? !game.completed : false;
  }

  endGame(roomId: string): void {
    this.games.delete(roomId);
  }

  async getCharactersByTheme(themeId: string): Promise<Character[]> {
    return await prisma.character.findMany({ where: { themeId } });
  }

  async getCharacterById(characterId: string): Promise<Character | null> {
    return await prisma.character.findUnique({ where: { id: characterId } });
  }
}

export const gameService = new GameService();
