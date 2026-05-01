import React, { useState } from 'react';
import { CharacterCard } from './CharacterCard';
import { Button } from '../common/Button';
import type { Character } from '../../types/index';
import './GameComponents.css';

interface CharacterGridProps {
  characters: Character[];
  onGuess: (characterId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const CharacterGrid: React.FC<CharacterGridProps> = ({
  characters,
  onGuess,
  isLoading = false,
  disabled = false,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleGuess = () => {
    if (selectedId) {
      onGuess(selectedId);
      setSelectedId(null);
    }
  };

  return (
    <div className="character-grid-container">
      <div className="character-grid">
        {characters.map(char => (
          <CharacterCard
            key={char.id}
            character={char}
            isSelected={selectedId === char.id}
            isDisabled={disabled}
            onClick={() => setSelectedId(char.id)}
          />
        ))}
      </div>
      <Button
        onClick={handleGuess}
        isLoading={isLoading}
        disabled={disabled || !selectedId}
        size="large"
      >
        Adivinhar {selectedId ? `(${characters.find(c => c.id === selectedId)?.name})` : ''}
      </Button>
    </div>
  );
};
