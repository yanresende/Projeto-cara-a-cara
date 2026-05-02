import React from 'react';
import type { Character } from '../../types/index';
import './GameComponents.css';

interface CharacterCardProps {
  character: Character;
  isEliminated?: boolean;
  isDisabled?: boolean;
  guessingMode?: boolean;
  onClick: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isEliminated = false,
  isDisabled = false,
  guessingMode = false,
  onClick,
}) => {
  const classes = [
    'character-card',
    isEliminated ? 'eliminated' : '',
    isDisabled ? 'disabled' : '',
    guessingMode && !isEliminated ? 'guessing-mode' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={!isDisabled ? onClick : undefined}
      title={guessingMode && !isEliminated ? `Adivinhar: ${character.name}` : character.name}
    >
      <div className="character-image">
        <img src={character.imageUrl} alt={character.name} />
        {isEliminated && <div className="eliminated-overlay">✕</div>}
      </div>
      <div className="character-name">{character.name}</div>
    </div>
  );
};
