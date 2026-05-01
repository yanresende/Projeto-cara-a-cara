import { GameRound, Guess, Question } from '../types/index';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../server';

export class GameService {
  private games: Map<string, GameRound> = new Map();

  async startGame(roomId: string, themeId: string, player1Id: string, player2Id: string): Promise<GameRound> {
    // Fetch random character from theme
    const characters = await prisma.character.findMany({
      where: { themeId },
    });

    if (characters.length === 0) {
      throw new Error('No characters available for this theme');
    }

    const randomChar = characters[Math.floor(Math.random() * characters.length)];

    // Randomly assign roles
    const isPlayer1Questioner = Math.random() > 0.5;
    const questionerPlayerId = isPlayer1Questioner ? player1Id : player2Id;
    const thinkerPlayerId = isPlayer1Questioner ? player2Id : player1Id;

    const game: GameRound = {
      id: uuidv4(),
      roomId,
      themeId,
      questionerPlayerId,
      thinkerPlayerId,
      secretCharacterId: randomChar.id,
      questions: [],
      guesses: [],
      completed: false,
      createdAt: new Date(),
    };

    this.games.set(roomId, game);
    return game;
  }

  async submitQuestion(roomId: string, question: string, playerId: string): Promise<{ question: string; answer: 'sim' | 'nao' }> {
    const game = this.games.get(roomId);
    if (!game || game.completed) {
      throw new Error('No active game in this room');
    }

    if (game.questionerPlayerId !== playerId) {
      throw new Error('Only the questioner can ask questions');
    }

    // Fetch the secret character to get its attributes
    const character = await prisma.character.findUnique({
      where: { id: game.secretCharacterId },
    });

    if (!character) {
      throw new Error('Character not found');
    }

    // Parse character attributes and simulate answer
    let attributes: any = {};
    try {
      attributes = JSON.parse(character.attributes || '{}');
    } catch (e) {
      attributes = {};
    }

    // Simple keyword matching for answer
    const lowerQuestion = question.toLowerCase();
    let answer: 'sim' | 'nao' = 'nao';

    // Check against attributes
    if (lowerQuestion.includes('mamífero') && attributes.type === 'mamífero') answer = 'sim';
    else if (lowerQuestion.includes('ave') && attributes.type === 'ave') answer = 'sim';
    else if (lowerQuestion.includes('aquático') && attributes.type === 'aquático') answer = 'sim';
    else if (lowerQuestion.includes('super-herói') && attributes.tipo === 'super-herói') answer = 'sim';
    else if (lowerQuestion.includes('super-heroína') && attributes.tipo === 'super-heroína') answer = 'sim';
    else if (lowerQuestion.includes('grande') && attributes.tamanho === 'grande') answer = 'sim';
    else if (lowerQuestion.includes('pequeno') && attributes.tamanho === 'pequeno') answer = 'sim';
    else if (lowerQuestion.includes('médio') && attributes.tamanho === 'médio') answer = 'sim';
    else if (lowerQuestion.includes('preto') && attributes.cor === 'preto') answer = 'sim';
    else if (lowerQuestion.includes('branco') && attributes.cor === 'branco') answer = 'sim';
    else if (lowerQuestion.includes('amarelo') && attributes.cor === 'amarelo') answer = 'sim';
    else if (lowerQuestion.includes('azul') && attributes.cor === 'azul') answer = 'sim';
    else if (lowerQuestion.includes('vermelho') && attributes.cor === 'vermelho') answer = 'sim';
    else if (lowerQuestion.includes('marrom') && attributes.cor === 'marrom') answer = 'sim';
    else if (lowerQuestion.includes('roxo') && attributes.cor === 'roxo') answer = 'sim';
    else if (lowerQuestion.includes('cinza') && attributes.cor === 'cinza') answer = 'sim';
    else if (lowerQuestion.includes('uniforme') && attributes.uniforme === true) answer = 'sim';
    else if (lowerQuestion.includes('saúde') && attributes.setor === 'saúde') answer = 'sim';
    else if (lowerQuestion.includes('segurança') && attributes.setor === 'segurança') answer = 'sim';
    else if (lowerQuestion.includes('espaço') && attributes.setor === 'espaço') answer = 'sim';
    else if (lowerQuestion.includes('culinária') && attributes.setor === 'culinária') answer = 'sim';
    else if (lowerQuestion.includes('aviação') && attributes.setor === 'aviação') answer = 'sim';
    else {
      // Default: random answer for unknown questions
      answer = Math.random() > 0.5 ? 'sim' : 'nao';
    }

    // Store question
    const q: Question = {
      id: uuidv4(),
      content: question,
      askedBy: playerId,
      answer,
      createdAt: new Date(),
    };

    game.questions.push(q);
    return { question, answer };
  }

  async submitGuess(roomId: string, characterId: string, playerId: string): Promise<{ correct: boolean; characterName?: string }> {
    const game = this.games.get(roomId);
    if (!game || game.completed) {
      throw new Error('No active game in this room');
    }

    if (game.thinkerPlayerId !== playerId) {
      throw new Error('Only the thinker can make guesses');
    }

    // Fetch the guessed character
    const guessedCharacter = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!guessedCharacter) {
      throw new Error('Character not found');
    }

    const isCorrect = characterId === game.secretCharacterId;

    // Store guess
    const guess: Guess = {
      characterId,
      createdAt: new Date(),
      correct: isCorrect,
    };

    game.guesses.push(guess);

    if (isCorrect) {
      game.completed = true;
      game.winner = playerId;

      // Persist game to database
      await this.persistGame(game);
    }

    return { correct: isCorrect, characterName: guessedCharacter.name };
  }

  private async persistGame(game: GameRound): Promise<void> {
    try {
      // Create game record in database
      await prisma.game.create({
        data: {
          themeId: game.themeId,
          questionerId: game.questionerPlayerId,
          thinkerId: game.thinkerPlayerId,
          secretCharacterId: game.secretCharacterId,
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

      // Update user stats
      if (game.winner) {
        await prisma.user.update({
          where: { id: game.winner },
          data: {
            gamesWon: { increment: 1 },
            gamesPlayed: { increment: 1 },
          },
        });

        // Update loser's games played
        const loserId = game.winner === game.thinkerPlayerId ? game.questionerPlayerId : game.thinkerPlayerId;
        await prisma.user.update({
          where: { id: loserId },
          data: {
            gamesPlayed: { increment: 1 },
          },
        });
      }
    } catch (error) {
      console.error('Error persisting game to database:', error);
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

  async getCharactersByTheme(themeId: string): Promise<any[]> {
    return await prisma.character.findMany({
      where: { themeId },
    });
  }

  async getSecretCharacter(characterId: string): Promise<any> {
    return await prisma.character.findUnique({
      where: { id: characterId },
    });
  }
}

export const gameService = new GameService();
