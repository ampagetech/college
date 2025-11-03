"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useQuizStore } from "@/stores/quiz/quizStore";
import { Button } from "@/components/ui/button";
import QuizTimer from "./QuizTimer";
import {
  processQuestion,
  containsLatex,
} from "@/components/common/textFormattingUtils.js";
import { submitQuizAnswers } from "@/lib/actions/quiz-actions";

// Define a specific type for ProcessedQuestion
interface ProcessedQuestion {
  text: string;
  options: string[];
  id?: string;
}

const mathJaxConfig = {
  tex: {
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
  },
  startup: {
    typeset: true,
  },
};

export default function Quiz() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { quizData, setCurrentQuestionIndex, updateAnswer, exitQuiz } =
    useQuizStore();

  const {
    questions: rawQuestions,
    currentQuestionIndex,
    answers,
    metadata,
    isTimeUp,
    remainingTime,
    quizSessionId,
    totalTime,
  } = quizData;

  const [processedQuestions, setProcessedQuestions] = useState<
    ProcessedQuestion[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rawQuestions && rawQuestions.length > 0) {
      const processed: ProcessedQuestion[] = rawQuestions.map((question) => {
        const processed = processQuestion(question) as {
          text: string;
          options: string[];
        };
        return {
          text: processed.text,
          options: processed.options,
          id: question.id,
        };
      });
      setProcessedQuestions(processed);
    }
  }, [rawQuestions]);
  

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
  
    setIsSubmitting(true);
    setError(null);
  
    try {
      const result = await submitQuizAnswers(
        quizSessionId,
        answers,
        totalTime - remainingTime
      );
  
      if (result.success) {
        router.push(`/quiz/results/${quizSessionId}`);
      } else {
        setError(result.error || "An unknown error occurred during submission.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("[Quiz Submit Error]", err);
      setIsSubmitting(false);
    }
  }, [answers, isSubmitting, quizSessionId, remainingTime, router, totalTime]);
  

  // Automatically trigger submission when time is up
  useEffect(() => {
    if (isTimeUp) {
      handleSubmit();
    }
  }, [isTimeUp, handleSubmit]);


  if (status === "loading") {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center p-4">Please sign in to take the quiz.</div>
    );
  }

  if (!processedQuestions || processedQuestions.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">
          No questions available. Please try again.
        </p>
        <Button onClick={exitQuiz} variant="secondary" className="mt-4">
          Back to Filters
        </Button>
      </div>
    );
  }

  const currentQuestion = processedQuestions[currentQuestionIndex];
  const examType = metadata?.exam || "Unknown Exam";
  const subjectName = metadata?.subject || "Unknown Subject";

  const handleNext = () => {
    if (currentQuestionIndex < processedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAnswerSelect = (option: string, index: number) => {
    const originalQuestion = rawQuestions[currentQuestionIndex];
    const letterOption = optionLabels[index];
    updateAnswer(originalQuestion.id, option, letterOption);
  };

  const optionLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="relative">
        
        {/* --- SPINNER OVERLAY ADDED HERE --- */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center rounded-lg z-20 transition-opacity duration-300">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-xl font-semibold text-blue-700">
              Finalizing Your Results...
            </p>
            <p className="text-md text-gray-600">
              Please wait, this won't take long.
            </p>
          </div>
        )}

        {isTimeUp && !isSubmitting && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg font-semibold text-lg shadow-sm text-center mb-6">
            Time's up! Submitting your answers...
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm font-semibold mb-6">
          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
            Quiz : Question {currentQuestionIndex + 1} of{" "}
            {processedQuestions.length}
          </div>
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-md">
            {examType} : {subjectName}
          </div>
          <QuizTimer />
        </div>

        <div className="p-4 bg-gray-50 rounded-md shadow mb-6">
          {containsLatex(currentQuestion.text) ? (
            <MathJax dynamic>{currentQuestion.text}</MathJax>
          ) : (
            <p className="text-lg font-medium text-gray-900 mb-4">
              {currentQuestion.text}
            </p>
          )}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const originalQuestion = rawQuestions[currentQuestionIndex];
              const originalOption = originalQuestion.options[index];
              const isSelected =
                answers[originalQuestion.id]?.value === originalOption;

              return (
                <div
                  key={index}
                  className={`border-2 rounded-md transition-all duration-200 ${
                    isSelected
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <button
                    onClick={() => handleAnswerSelect(originalOption, index)}
                    disabled={isTimeUp || isSubmitting}
                    className="w-full text-left py-3 px-4 text-base flex items-center gap-3"
                  >
                    <span className="flex items-center justify-center bg-gray-200 text-gray-800 h-8 w-8 rounded-full flex-shrink-0 font-semibold">
                      {optionLabels[index]}
                    </span>
                    {containsLatex(option) ? (
                      <MathJax dynamic>{option}</MathJax>
                    ) : (
                      <span>{option}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div
            className="h-5 mt-2 transition-opacity duration-300"
            aria-live="polite"
          >
            {/* This small text is no longer needed with the big overlay */}
            {/* {isSubmitting && (
              <span className="text-gray-500 text-sm opacity-100">
                Submitting answers...
              </span>
            )} */}
            {error && (
               <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            type="button" 
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0 || isSubmitting}
            variant="outline"
            className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-100"
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            variant="secondary"
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            {isSubmitting ? "Submitting..." : "Submit & Exit"}
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={
              currentQuestionIndex === processedQuestions.length - 1 ||
              isSubmitting
            }
            variant="outline"
            className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-100"
          >
            Next
          </Button>
        </div>
      </div>
    </MathJaxContext>
  );
}