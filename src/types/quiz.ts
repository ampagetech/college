// src/types/quiz.ts
export interface TQuizResponse {
    quiz: Array<{
      id: string;
      text: string;
      options: string[];
      correctAnswer: string;
    }>;
    total: number;
    metadata: {
      difficulty: string;
      mode: string;
      display: string;
    };
  }