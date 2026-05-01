import React, { useState } from 'react';
import { Button } from '../common/Button';
import './GameComponents.css';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({
  onSubmit,
  isLoading = false,
  disabled = false,
}) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(question);
      setQuestion('');
    }
  };

  return (
    <form className="question-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Ex: É um mamífero?"
        disabled={isLoading || disabled}
        autoFocus
      />
      <Button
        type="submit"
        isLoading={isLoading}
        disabled={disabled || !question.trim()}
      >
        Enviar
      </Button>
    </form>
  );
};
