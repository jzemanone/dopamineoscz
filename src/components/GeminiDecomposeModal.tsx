import React from 'react';
import { StepDecomposer } from './StepDecomposer';
import { Task } from '../types';

interface GeminiDecomposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onConfirmDecompose: (taskId: string, subtaskTitles: string[]) => void;
  onPlayClick: () => void;
}

export const GeminiDecomposeModal: React.FC<GeminiDecomposeModalProps> = (props) => {
  return <StepDecomposer {...props} />;
};
