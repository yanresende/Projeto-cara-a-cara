import React from 'react';
import './GameComponents.css';

interface PlayerRolesProps {
  isQuestioner: boolean;
  questionerName: string;
  thinkerName: string;
}

export const PlayerRoles: React.FC<PlayerRolesProps> = ({
  isQuestioner,
  questionerName,
  thinkerName,
}) => {
  return (
    <div className="player-roles">
      <div className={`role-card ${isQuestioner ? 'current' : ''}`}>
        <div className="role-label">QUESTIONADOR</div>
        <div className="player-name">{questionerName}</div>
      </div>

      <div className="vs">VS</div>

      <div className={`role-card ${!isQuestioner ? 'current' : ''}`}>
        <div className="role-label">ADIVINHADOR</div>
        <div className="player-name">{thinkerName}</div>
      </div>
    </div>
  );
};
