// src/types/tahfiz.ts

export type LLMProvider = 'gemini' | 'openai' | 'claude';

export interface RecitationAttempt {
  id: string;
  timestamp: Date;
  audioBlob: Blob;
  transcription: string;
  score: number;
  feedback: string;
  llmProvider: LLMProvider;
  duration: number;
  originalText: string;
  tashkeelText: string;
  verseReference: string;
  accuracyDetails?: {
    overallAccuracy: number;
    pronunciation: number;
    completeness: number;
    correctOrder: number;
  };
  mistakes?: Array<{
    type: 'missing' | 'incorrect' | 'extra' | 'order';
    description: string;
  }>;
  suggestions?: string[];
}