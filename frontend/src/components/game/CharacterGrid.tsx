import React from 'react';
import { CharacterCard } from './CharacterCard';
import type { Character } from '../../types/index';
import './GameComponents.css';

interface CharacterGridProps {
  characters: Character[];
  eliminatedCharacters: Set<string>;
  onCardClick: (characterId: string) => void;
  guessingMode?: boolean;
  interactive?: boolean;
  isLoading?: boolean;
  cardFrameClass?: string;
}

export const CharacterGrid: React.FC<CharacterGridProps> = ({
  characters,
  eliminatedCharacters,
  onCardClick,
  guessingMode = false,
  interactive = false,
  isLoading = false,
  cardFrameClass = '',
}) => {
  return (
    <div className="character-grid-container">
      <div className="character-grid">
        {characters.map(char => {
          const isEliminated = eliminatedCharacters.has(char.id);
          const isDisabled = isLoading || !interactive || (guessingMode && isEliminated);
          return (
            <CharacterCard
              key={char.id}
              character={char}
              isEliminated={isEliminated}
              isDisabled={isDisabled}
              guessingMode={guessingMode && interactive}
              onClick={() => onCardClick(char.id)}
              cardFrameClass={cardFrameClass}
            />
          );
        })}
      </div>
    </div>
  );
};
