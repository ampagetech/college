// C:\DevWeb\college-saas\src\stores\quiz\quizReviewStore.ts
"use client";

import { create } from "zustand";

interface QuestionData {
  question_extract_pk: number;
  exam: string | null;
  subject: string | null;
  exam_year: number | null;
  question_number: number | null;
  question_html: string | null;
  question_option_a_as_html: string | null;
  question_option_b_as_html: string | null;
  question_option_c_as_html: string | null;
  question_option_d_as_html: string | null;
  answer_a_b_c_d_e_option: string | null;
  answer_explanation_html: string | null;
  gemini_long_response: string | null;
  gemini_question_topic: string | null;
}

interface UserAnswer {
  question_extract_pk: number;
  selected_answer: string;
  is_correct: boolean;
}

interface QuizReviewState {
  isModalOpen: boolean;
  questions: QuestionData[];
  userAnswers: UserAnswer[];
  currentQuestionIndex: number;
  correctAnswers: number;
  totalQuestions: number;
  loading: boolean;
  error: string | null;
  showMissedOnly: boolean;
  openModal: (quizSessionId: string) => Promise<void>;
  closeModal: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  fetchSessionDetails: (quizSessionId: string) => Promise<void>;
  toggleShowMissedOnly: () => void;
}

export const useQuizReviewStore = create<QuizReviewState>((set, get) => ({
  isModalOpen: false,
  questions: [],
  userAnswers: [],
  currentQuestionIndex: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  loading: false,
  error: null,
  showMissedOnly: false,

  openModal: async (quizSessionId: string) => {
    set({ loading: true, error: null });
    await get().fetchSessionDetails(quizSessionId);
    set({ isModalOpen: true, currentQuestionIndex: 0, showMissedOnly: false });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      questions: [],
      userAnswers: [],
      currentQuestionIndex: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      error: null,
      loading: false,
      showMissedOnly: false,
    });
  },

  toggleShowMissedOnly: () => {
    const { showMissedOnly, questions, userAnswers, currentQuestionIndex } = get();
    
    // Toggle state
    const newShowMissedOnly = !showMissedOnly;
    
    // Handle special case when switching to "Missed only" mode
    if (newShowMissedOnly) {
      const missedQuestions = questions.filter((q) => {
        const answer = userAnswers.find((a) => a.question_extract_pk === q.question_extract_pk);
        return answer && !answer.is_correct;
      });
      
      // If there are missed questions and current question isn't a missed one,
      // move to the first missed question
      if (missedQuestions.length > 0) {
        const currentAnswer = userAnswers.find(
          (a) => a.question_extract_pk === questions[currentQuestionIndex]?.question_extract_pk
        );
        
        if (!currentAnswer || currentAnswer.is_correct) {
          // Current question isn't missed, move to first missed question
          const newIndex = questions.findIndex(
            (q) => q.question_extract_pk === missedQuestions[0].question_extract_pk
          );
          set({ showMissedOnly: newShowMissedOnly, currentQuestionIndex: newIndex >= 0 ? newIndex : 0 });
          return;
        }
      }
    }
    
    set({ showMissedOnly: newShowMissedOnly });
  },

  nextQuestion: () => {
    const { questions, userAnswers, currentQuestionIndex, showMissedOnly } = get();
    
    if (!showMissedOnly) {
      // Original behavior for "All" mode
      set((state) => ({
        currentQuestionIndex: Math.min(
          state.currentQuestionIndex + 1,
          state.questions.length - 1
        ),
      }));
      return;
    }
    
    // For "Missed only" mode - find the next incorrect question
    const missedQuestions = questions.filter((q) => {
      const answer = userAnswers.find((a) => a.question_extract_pk === q.question_extract_pk);
      return answer && !answer.is_correct;
    });
    
    const currentQuestion = questions[currentQuestionIndex];
    const currentMissedIndex = missedQuestions.findIndex(
      (q) => q.question_extract_pk === currentQuestion.question_extract_pk
    );
    
    if (currentMissedIndex < missedQuestions.length - 1) {
      const nextMissedQuestion = missedQuestions[currentMissedIndex + 1];
      const nextFullIndex = questions.findIndex(
        (q) => q.question_extract_pk === nextMissedQuestion.question_extract_pk
      );
      set({ currentQuestionIndex: nextFullIndex });
    }
  },

  prevQuestion: () => {
    const { questions, userAnswers, currentQuestionIndex, showMissedOnly } = get();
    
    if (!showMissedOnly) {
      // Original behavior for "All" mode
      set((state) => ({
        currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
      }));
      return;
    }
    
    // For "Missed only" mode - find the previous incorrect question
    const missedQuestions = questions.filter((q) => {
      const answer = userAnswers.find((a) => a.question_extract_pk === q.question_extract_pk);
      return answer && !answer.is_correct;
    });
    
    const currentQuestion = questions[currentQuestionIndex];
    const currentMissedIndex = missedQuestions.findIndex(
      (q) => q.question_extract_pk === currentQuestion.question_extract_pk
    );
    
    if (currentMissedIndex > 0) {
      const prevMissedQuestion = missedQuestions[currentMissedIndex - 1];
      const prevFullIndex = questions.findIndex(
        (q) => q.question_extract_pk === prevMissedQuestion.question_extract_pk
      );
      set({ currentQuestionIndex: prevFullIndex });
    }
  },

  fetchSessionDetails: async (quizSessionId: string) => {
    try {
      set({ loading: true, error: null });

      // The fetch call no longer needs a manual Authorization header.
      // Next.js middleware handles authentication via the session cookie.
      const response = await fetch(`/api/quiz-session-details/${quizSessionId}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error(`Failed to fetch session details: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.data) {
        throw new Error("No data was received from the server.");
      }

      set({
        questions: result.data.questions,
        userAnswers: result.data.userAnswers,
        correctAnswers: result.data.correctAnswers,
        totalQuestions: result.data.totalQuestions,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      set({ error: errorMessage, loading: false });
      console.error("Error fetching quiz session details:", error);
    }
  },
}));