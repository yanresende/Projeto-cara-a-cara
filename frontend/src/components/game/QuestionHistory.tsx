import React from 'react';
import type { Question } from '../../types/index';
import './GameComponents.css';

interface QuestionHistoryProps {
  questions: Question[];
  currentUsername?: string;
}

export const QuestionHistory: React.FC<QuestionHistoryProps> = ({ questions, currentUsername }) => {
  return (
    <div className="question-history">
      {questions.length === 0 ? (
        <p className="empty">Nenhuma pergunta feita ainda</p>
      ) : (
        <div className="questions-list">
          {questions.map((q) => {
            const isMine = q.askedBy === currentUsername;
            return (
              <div key={q.id} className={`question-bubble ${isMine ? 'mine' : 'theirs'}`}>
                <span className="bubble-author">{isMine ? 'Você' : q.askedBy}</span>
                <div className="bubble-body">
                  <span className="bubble-text">{q.content}</span>
                  <span className={`bubble-answer ${q.answer}`}>
                    {q.answer === 'sim' ? '✓ Sim' : '✗ Não'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
