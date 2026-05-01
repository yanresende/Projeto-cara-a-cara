import React from 'react';
import type { Character } from '../../types/index';
import './GameComponents.css';

interface CharacterCardProps {
  character: Character;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected = false,
  isDisabled = false,
  onClick,
}) => {
  return (
    <div
      className={`character-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
      onClick={!isDisabled ? onClick : undefined}
    >
      <div className="character-image">
        <img src={character.imageUrl} alt={character.name} />
      </div>
      <div className="character-name">{character.name}</div>
    </div>
  );
};
