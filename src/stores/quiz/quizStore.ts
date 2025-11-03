import { create } from 'zustand';

// INTERFACES
interface QuizAnswer {
  value: string;
  letter: string; 
}

interface QuizData {
  questions: { id: string; text: string; options: string[]; correctAnswer?: string }[];
  currentQuestionIndex: number;
  answers: Record<string, QuizAnswer>;
  quizSessionId: string;
  metadata: {
    exam: string;
    subject: string;
    difficulty?: string;
    mode?: string;
    display?: string;
    seconds_per_question?: string;
  };
  startTime: number | null;
  totalTime: number;
  remainingTime: number;
  isTimeUp: boolean;
}

interface QuizState {
  activeComponent: 'QuizFilter' | 'Quiz';
  quizData: QuizData;
  startQuiz: (questions: QuizData['questions'], metadata: QuizData['metadata'], quizSessionId: string) => void;
  setCurrentQuestionIndex: (index: number) => void;
  updateAnswer: (questionId: string, value: string, letter: string) => void;
  exitQuiz: () => void;
  setRemainingTime: (time: number) => void;
  setTimeUp: () => void;
  // THIS FUNCTION WAS MISSING. LET'S ADD IT BACK.
  decrementRemainingTime: () => void; 
}

// Define the initial state for resetting the quiz
const initialQuizData: QuizData = {
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    quizSessionId: '',
    metadata: { exam: '', subject: '' },
    startTime: null,
    totalTime: 0,
    remainingTime: 0,
    isTimeUp: false,
};


export const useQuizStore = create<QuizState>((set, get) => ({
  activeComponent: 'QuizFilter',
  quizData: initialQuizData,

  startQuiz: (questions, metadata, quizSessionId) => {
    const secondsPerQuestion = metadata?.seconds_per_question ? parseInt(metadata.seconds_per_question) : 60;
    const totalTime = questions.length * secondsPerQuestion;
    
    set({
      activeComponent: 'Quiz',
      quizData: {
        ...initialQuizData,
        questions,
        metadata,
        quizSessionId,
        startTime: Date.now(),
        totalTime,
        remainingTime: totalTime,
      },
    });
  },

  setCurrentQuestionIndex: (index) => set((state) => ({
    quizData: { ...state.quizData, currentQuestionIndex: index },
  })),

  updateAnswer: (questionId, value, letter) => set((state) => ({
    quizData: {
      ...state.quizData,
      answers: { 
        ...state.quizData.answers, 
        [questionId]: { value, letter }
      },
    },
  })),

  exitQuiz: () => set({
    activeComponent: 'QuizFilter',
    quizData: initialQuizData,
  }),

  setRemainingTime: (time) => set((state) => ({
    quizData: {
      ...state.quizData,
      remainingTime: time,
    },
  })),

  setTimeUp: () => set((state) => ({
    quizData: {
      ...state.quizData,
      isTimeUp: true,
      remainingTime: 0,
    },
  })),

  // HERE IS THE IMPLEMENTATION OF THE MISSING FUNCTION
  decrementRemainingTime: () => set((state) => {
    if (state.quizData.remainingTime <= 0) {
      return state; // No change if time is already up
    }
    const newRemainingTime = state.quizData.remainingTime - 1;
    return {
      quizData: {
        ...state.quizData,
        remainingTime: newRemainingTime,
        // Automatically set isTimeUp if the timer just hit zero
        isTimeUp: newRemainingTime === 0, 
      },
    };
  }),
}));