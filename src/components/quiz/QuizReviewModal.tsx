"use client";

import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuizReviewStore } from "@/stores/quiz/quizReviewStore";

export const QuizReviewModal: React.FC = () => {
  const {
    isModalOpen,
    questions,
    userAnswers,
    currentQuestionIndex,
    correctAnswers,
    totalQuestions,
    loading,
    error,
    closeModal,
    nextQuestion,
    prevQuestion,
    showMissedOnly,
    toggleShowMissedOnly
  } = useQuizReviewStore();

  const filteredQuestions = showMissedOnly
    ? questions.filter((q) => {
        const answer = userAnswers.find((a) => a.question_extract_pk === q.question_extract_pk);
        return answer && !answer.is_correct;
      })
    : questions;

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userAnswers.find(
    (answer) => answer.question_extract_pk === currentQuestion?.question_extract_pk
  );

  // Find the index in filtered questions for UI purposes
  const filteredIndex = filteredQuestions.findIndex(
    q => q.question_extract_pk === currentQuestion?.question_extract_pk
  );

  if (!isModalOpen) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-2xl mx-auto my-auto max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b pb-1 bg-white">
          <DialogTitle className="text-xl font-bold text-gray-900 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span>
                {filteredQuestions.length > 0
                  ? `Review of yr Quiz -  Qus ${filteredIndex >= 0 ? filteredIndex + 1 : 0}/${filteredQuestions.length}`
                  : "Review of yr Quiz"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleShowMissedOnly}
              >
                {showMissedOnly ? "Missed" : "All"}
              </Button>
            </div>
            <div className="flex space-x-4 mr-6">
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                onClick={prevQuestion}
                disabled={loading || 
                  filteredQuestions.length === 0 || 
                  (showMissedOnly ? filteredIndex <= 0 : currentQuestionIndex <= 0)}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-green-50 hover:bg-green-100 text-green-700"
                onClick={nextQuestion}
                disabled={loading || 
                  filteredQuestions.length === 0 || 
                  (showMissedOnly ? filteredIndex >= filteredQuestions.length - 1 : currentQuestionIndex >= questions.length - 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            <h3 className="font-bold">Error loading details</h3>
            <p>{error}</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-4 text-gray-700">
            <p>{showMissedOnly ? "No missed questions found." : "No questions found for this session."}</p>
          </div>
        ) : !currentQuestion ? (
          <div className="p-4 text-gray-700">
            <p>No question data available.</p>
          </div>
        ) : (
          <div className="space-y-3 p-4 bg-white">
            <div className="grid grid-cols-5 gap-2 text-sm">
              <DetailRow label="Score" value={`${correctAnswers}/${totalQuestions}`} />
              <DetailRow label="Exam" value={currentQuestion.exam || "N/A"} />
              <DetailRow label="Subject" value={currentQuestion.subject || "N/A"} />
              <DetailRow label="Year" value={currentQuestion.exam_year?.toString() || "N/A"} />
              <DetailRow label="Q.No" value={currentQuestion.question_number?.toString() || "N/A"} />
            </div>

            <div className="w-full bg-gray-50 p-3 rounded-md">
              <div dangerouslySetInnerHTML={{ __html: `${currentQuestion.question_html || ""}`.replace(/Q:\s*-\s*/g, "Q: - ") }} />
            </div>

            <div className="w-full bg-gray-50 p-3 rounded-md">
              <ul className="space-y-2">
                <li
                  className={`p-2 rounded ${
                    currentAnswer?.selected_answer === "A"
                      ? currentAnswer.is_correct
                        ? "bg-green-100"
                        : "bg-red-100"
                      : currentQuestion.answer_a_b_c_d_e_option === "A"
                      ? "bg-green-200"
                      : ""
                  }`}
                  dangerouslySetInnerHTML={{ __html: currentQuestion.question_option_a_as_html || "" }}
                />
                <li
                  className={`p-2 rounded ${
                    currentAnswer?.selected_answer === "B"
                      ? currentAnswer.is_correct
                        ? "bg-green-100"
                        : "bg-red-100"
                      : currentQuestion.answer_a_b_c_d_e_option === "B"
                      ? "bg-green-200"
                      : ""
                  }`}
                  dangerouslySetInnerHTML={{ __html: currentQuestion.question_option_b_as_html || "" }}
                />
                <li
                  className={`p-2 rounded ${
                    currentAnswer?.selected_answer === "C"
                      ? currentAnswer.is_correct
                        ? "bg-green-100"
                        : "bg-red-100"
                      : currentQuestion.answer_a_b_c_d_e_option === "C"
                      ? "bg-green-200"
                      : ""
                  }`}
                  dangerouslySetInnerHTML={{ __html: currentQuestion.question_option_c_as_html || "" }}
                />
                <li
                  className={`p-2 rounded ${
                    currentAnswer?.selected_answer === "D"
                      ? currentAnswer.is_correct
                        ? "bg-green-100"
                        : "bg-red-100"
                      : currentQuestion.answer_a_b_c_d_e_option === "D"
                      ? "bg-green-200"
                      : ""
                  }`}
                  dangerouslySetInnerHTML={{ __html: currentQuestion.question_option_d_as_html || "" }}
                />
              </ul>
            </div>

            <div className="w-full flex justify-between">
              <span className="text-sm text-gray-600">Your Answer: </span>
              <span className="font-medium text-gray-900">{currentAnswer?.selected_answer || "Not attempted"}</span>
              <span className="text-sm text-gray-600">Correct Answer: </span>
              <span className="font-medium text-gray-900">{currentQuestion.answer_a_b_c_d_e_option || "N/A"}</span>
            </div>

            {currentQuestion.answer_explanation_html && (
              <div className="w-full bg-gray-50 p-3 rounded-md">
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Explanation</h3>
                <div dangerouslySetInnerHTML={{ __html: currentQuestion.answer_explanation_html }} />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end border-t pt-2 bg-white">
          <Button 
            variant="destructive" 
            onClick={closeModal}
            className="bg-red-50 hover:bg-red-100 text-red-700"
          >
            <X className="mr-2 h-4 w-4" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-gray-50 p-1 rounded-md">
    <span className="text-xs text-gray-600 block">{label}</span>
    <span className="font-medium text-gray-900 text-sm">{value}</span>
  </div>
);

export default QuizReviewModal;