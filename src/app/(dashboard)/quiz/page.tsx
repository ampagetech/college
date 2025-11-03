"use client";

import { useState } from "react";
// No need for useSession here if the action handles auth, but can be useful for UI
// import { useSession } from "next-auth/react"; 
import { Card, CardContent } from "@/components/ui/card";
import QuizFilter from "@/components/quiz/QuizFilter";
import Quiz from "@/components/quiz/Quiz";
import { useQuizStore } from "@/stores/quiz/quizStore";
// Import the new server action
import { startNewQuiz } from "@/lib/actions/quiz-actions"; 
import type { QuizFilters } from "@/lib/actions/quiz-actions"; // Import the type for clarity

// Interfaces can be simplified or removed if not needed elsewhere
interface DebugInfo {
  [key: string]: string | number | boolean | null | undefined;
}

export default function QuizPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const [filters, setFilters] = useState<QuizFilters>({
    exam: "JAMB",
    subject: "",
    difficulty: "All Types",
    mode: "Practice Mode",
    display: "Single Question",
    question_count: "10",
    seconds_per_question: "60",
  });

  const { activeComponent, startQuiz } = useQuizStore();

  const handleFilterChange = (newFilters: QuizFilters) => {
    setShowInitialMessage(false);
    setFilters(newFilters);
  };

  // UPDATED handleStartQuiz function
  const handleStartQuiz = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    if (!filters.subject) {
      setError("Please select a subject before starting the quiz.");
      setIsLoading(false);
      return;
    }

    try {
      // Directly call the server action
      const result = await startNewQuiz(filters);

      if (result.success) {
        // On success, start the quiz using the data from the action's response
        startQuiz(result.quiz, {
            exam: filters.exam,
            subject: filters.subject,
            ...result.metadata, // Use metadata from the server
            seconds_per_question: filters.seconds_per_question,
        }, result.quizSessionId);
      } else {
        // If the action returned an error, display it
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load quiz data";
      console.error("Start Quiz Error:", err);
      setError(`${errorMessage}. Check your filters or try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {activeComponent === "QuizFilter" && (
              <QuizFilter
                filters={filters}
                onFilterChange={handleFilterChange}
                onStartQuiz={handleStartQuiz}
              />
            )}
            {activeComponent === "Quiz" && <Quiz />}
            {showInitialMessage && activeComponent === "QuizFilter" ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-xl text-gray-500 text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  Select a subject, adjust filters, then Click Start Quiz
                </div>
              </div>
            ) : isLoading ? (
              <div className="h-60 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : error && activeComponent === "QuizFilter" ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-md">
                <h3 className="font-bold">Error</h3>
                <p>{error}</p>
                {debugInfo && (
                  <div className="mt-2 text-sm">
                    <p>Debug Info:</p>
                    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}