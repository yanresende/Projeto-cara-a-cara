import React from 'react';
import type { Question } from '../../types/index';
import './GameComponents.css';

interface QuestionHistoryProps {
  questions: Question[];
}

export const QuestionHistory: React.FC<QuestionHistoryProps> = ({ questions }) => {
  return (
    <div className="question-history">
      <h3>Histórico de Perguntas</h3>
      {questions.length === 0 ? (
        <p className="empty">Nenhuma pergunta feita ainda</p>
      ) : (
        <div className="questions-list">
          {[...questions].reverse().map((q) => (
            <div key={q.id} className="question-item">
              <div className="question-text">{q.content}</div>
              <div className={`answer ${q.answer}`}>
                {q.answer === 'sim' ? '✓ Sim' : '✗ Não'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
