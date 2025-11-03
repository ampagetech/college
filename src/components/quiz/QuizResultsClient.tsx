"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Download, MessageSquare, Bot
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import AICoachingPanel from "./AICoachingPanel"; // Import the new component

// Export types so they can be shared with the hook and panel
export type Question = {
  question_extract_pk: number;
  question_html: string;
  question_option_a_as_html: string;
  question_option_b_as_html: string;
  question_option_c_as_html: string;
  question_option_d_as_html: string;
  answer_a_b_c_d_e_option: string;
  answer_explanation_html?: string;
};

export type UserAnswer = {
  question_extract_pk: number;
  selected_answer: string;
  is_correct: boolean;
};

type ResultsData = {
  session: any;
  userAnswers: UserAnswer[];
  questions: Question[];
  stats: {
    correctAnswers: number;
    wrongAnswers: number;
    unattempted: number;
    totalQuestions: number;
    score: number;
    timeSpent: number;
  };
};

interface QuizResultsClientProps {
  results: ResultsData;
}

const QuizResultsClient: React.FC<QuizResultsClientProps> = ({ results }) => {
  const { session, userAnswers, questions, stats } = results;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMissedOnly, setShowMissedOnly] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);

  const missedQuestions = useMemo(
    () => questions.filter(q => !userAnswers.find(a => a.question_extract_pk === q.question_extract_pk)?.is_correct),
    [questions, userAnswers]
  );

  const questionsToDisplay = showMissedOnly ? missedQuestions : questions;
  const currentQuestion = questionsToDisplay[currentIndex];
  const currentAnswer = userAnswers.find((a) => a.question_extract_pk === currentQuestion?.question_extract_pk);

  const handleNext = () => {
    if (currentIndex < questionsToDisplay.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleToggleMissed = () => {
    setCurrentIndex(0);
    setShowMissedOnly(!showMissedOnly);
  };

  const getOptionClass = (optionLetter: string) => {
    const isCorrectAnswer = currentQuestion?.answer_a_b_c_d_e_option === optionLetter;
    const isSelectedAnswer = currentAnswer?.selected_answer === optionLetter;

    if (isSelectedAnswer) {
      return currentAnswer?.is_correct ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400";
    }
    if (isCorrectAnswer) return "bg-green-100 border-green-400";
    return "bg-gray-50 border-gray-200";
  };

  const handleExport = () => {
    const csvRows = [
      ["Question ID", "Selected Answer", "Correct Answer", "Correct?", "Explanation"],
      ...userAnswers.map((a) => {
        const q = questions.find((q) => q.question_extract_pk === a.question_extract_pk);
        return [
          a.question_extract_pk, a.selected_answer, q?.answer_a_b_c_d_e_option || "N/A",
          a.is_correct ? "Yes" : "No",
          q?.answer_explanation_html ? `"${q.answer_explanation_html.replace(/"/g, '""')}"` : "",
        ];
      }),
    ];
    const blob = new Blob([csvRows.map((row) => row.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quiz_results_${session.quiz_session_id || "session"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center"><div className="text-2xl font-bold">{stats.score}%</div><div className="text-xs opacity-90">Score</div></div>
            <div className="text-center"><div className="text-lg font-semibold">{stats.correctAnswers}/{stats.totalQuestions}</div><div className="text-xs opacity-90">Correct</div></div>
            <div className="text-center"><div className="text-lg font-semibold">{formatTime(stats.timeSpent)}</div><div className="text-xs opacity-90">Time</div></div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{session.exam?.exam_name || "Exam"}</div>
            <div className="text-sm opacity-90">{session.subject?.subject_name || "Subject"}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-220px)]">
        {/* Question Panel */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex flex-wrap justify-between items-center gap-2">
              <CardTitle>Question {currentIndex + 1} of {questionsToDisplay.length}</CardTitle>
              <div className="flex items-center gap-2">
                {/* MODIFIED: Removed variant="outline" for better visibility */}
                <Button onClick={handlePrev} disabled={currentIndex === 0} size="sm"><ChevronLeft className="h-4 w-4" /></Button>
                <Button onClick={handleNext} disabled={currentIndex >= questionsToDisplay.length - 1} size="sm"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
             <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={handleToggleMissed}>{showMissedOnly ? `All (${questions.length})` : `Missed (${missedQuestions.length})`}</Button>
                <Button onClick={() => setShowAICoach(true)} variant="outline" size="sm" className="flex gap-2"><MessageSquare className="h-4 w-4" />AI Coach</Button>
                <Button onClick={handleExport} variant="outline" size="sm" className="flex gap-2"><Download className="h-4 w-4" />Export</Button>
              </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4">
            {!currentQuestion ? (
              <div className="text-center p-8 text-gray-500">{showMissedOnly ? "You got all questions correct! 🎉" : "No questions found."}</div>
            ) : (
              <div className="space-y-4">
                <div className="prose max-w-none p-4 bg-gray-50 rounded-md" dangerouslySetInnerHTML={{ __html: currentQuestion.question_html }} />
                <div className="space-y-2">
                  {["A", "B", "C", "D"].map((opt) => (
                    <div key={opt} className={`p-3 border rounded-md ${getOptionClass(opt)}`} dangerouslySetInnerHTML={{ __html: currentQuestion[`question_option_${opt.toLowerCase()}_as_html` as keyof Question] || "" }} />
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm p-3 bg-gray-100 rounded-md">
                  <div className="flex items-center gap-2">Your Answer: <span className="font-bold">{currentAnswer?.selected_answer || "N/A"}</span>{currentAnswer && (currentAnswer.is_correct ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />)}</div>
                  <div>Correct: <span className="font-bold text-green-700">{currentQuestion.answer_a_b_c_d_e_option}</span></div>
                </div>
                {currentQuestion.answer_explanation_html && (
                  <div>
                    <h4 className="font-semibold mb-2">Explanation</h4>
                    <div className="prose max-w-none p-3 bg-blue-50/50 rounded-md text-sm" dangerouslySetInnerHTML={{ __html: currentQuestion.answer_explanation_html }} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Coaching Panel */}
        <div className={`h-full ${showAICoach ? 'block' : 'hidden lg:block'}`}>
          {currentQuestion ? (
            <AICoachingPanel
              question={currentQuestion}
              userAnswer={currentAnswer}
              session={session}
              onClose={() => setShowAICoach(false)}
            />
          ) : (
             <Card className="h-full flex items-center justify-center text-center p-8 text-gray-500">
                <div>
                  <Bot className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-semibold mb-2">AI Tutor</p>
                  <p className="text-sm max-w-sm mx-auto">Select a question to start an interactive coaching session.</p>
                </div>
              </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResultsClient;