import React from 'react';
import SubjectDropdown from "@/components/common/SubjectDropdown";
import { Slider } from "@/components/ui/slider";

interface QuizFilters {
  exam: string;
  subject: string;
  difficulty: string;
  mode: string;
  display: string;
  question_count: string;
  seconds_per_question: string;
}

export default function QuizFilter({
  filters,
  onFilterChange,
  onStartQuiz,
}: {
  filters: QuizFilters;
  onFilterChange: (filters: QuizFilters) => void;
  onStartQuiz: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <select
          value={filters.exam}
          onChange={(e) => onFilterChange({ ...filters, exam: e.target.value })}
          className="p-2 border rounded w-full bg-white dark:bg-gray-800 max-w-[140px]"
        >
          <option value="JAMB">JAMB</option>
          <option value="WAEC">WAEC</option>
        </select>

        <SubjectDropdown
          value={filters.subject}
          onSubjectChange={(id, name) =>
            onFilterChange({ ...filters, subject: name })
          }
        />

        <select
          value={filters.difficulty}
          onChange={(e) => onFilterChange({ ...filters, difficulty: e.target.value })}
          className="p-2 border rounded w-full bg-white dark:bg-gray-800 max-w-[140px]"
        >
          <option value="All Types">All Types</option>
          <option value="Missed">Your Misses</option>
          <option value="Hard">Hard</option>
          <option value="Medium">Medium</option>
          <option value="Easy">Easy</option>
        </select>

        <select
          value={filters.mode}
          onChange={(e) => onFilterChange({ ...filters, mode: e.target.value })}
          className="p-2 border rounded w-full bg-white dark:bg-gray-800 max-w-[140px]"
        >
          <option value="Practice Mode">Practice Mode</option>
          <option value="Exam Mode">Exam Mode</option>
        </select>

        <button
          onClick={onStartQuiz}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded whitespace-nowrap"
        >
          Start Quiz
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-700 min-w-[80px]">
            No of Qus: {filters.question_count}
          </label>
          <Slider
            value={[parseInt(filters.question_count) || 5]}
            min={5}
            max={50}
            step={5}
            onValueChange={(value) => 
              onFilterChange({ ...filters, question_count: value[0].toString() })
            }
            className="w-[200px]"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-700 min-w-[80px]">
            Seconds Per Qus: {filters.seconds_per_question}
          </label>
          <Slider
            value={[parseInt(filters.seconds_per_question) || 10]}
            min={10}
            max={120}
            step={10}
            onValueChange={(value) => 
              onFilterChange({ ...filters, seconds_per_question: value[0].toString() })
            }
            className="w-[200px]"
          />
        </div>
      </div>
    </div>
  );
}