"use client";

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon, XIcon } from 'lucide-react';
import SubjectDropdownAll  from '@/components/common/SubjectDropdownAll';
import { useEffect } from 'react';

// Define a more specific type for filters
export interface Filters 
 {
  exam: string;
  subject: string;
  startDate: string;
  endDate: string;
}

interface QuizFilterControlsProps {
  filters: Filters;
  searchQuery: string;
  onFilterChange: (filters: Partial<Filters>) => void;
  onSearchChange: (search: string) => void;
  onSearchClear: () => void;
  onShowClick: () => void;
}

export default function QuizFilterControls({
  filters,
  searchQuery,
  onFilterChange,
  onSearchChange,
  onSearchClear,
  onShowClick
}: QuizFilterControlsProps) {
  // Set today's date as default when component mounts
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Only set default dates if they're currently empty
    if (!filters.startDate || !filters.endDate) {
      onFilterChange({
        startDate: filters.startDate || today,
        endDate: filters.endDate || today
      });
    }
  }, [filters, onFilterChange]);

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ exam: e.target.value });
  };

  const handleSubjectChange = (id: string, name: string) => {
    onFilterChange({ subject: name });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ startDate: e.target.value });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ endDate: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleShowClick = () => {
    onShowClick();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Exam Select */}
        <div className="space-y-2">
          <label htmlFor="exam" className="block text-sm font-medium text-gray-700">
            Exam
          </label>
          <select
            id="exam"
            value={filters.exam}
            onChange={handleExamChange}
            className="p-2 border rounded w-full bg-white dark:bg-gray-800 max-w-[140px]"
          >
            <option value="all">All Exams</option>
            <option value="JAMB">JAMB</option>
          </select>
        </div>

        {/* Subject Select */}
        <div className="space-y-2">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <SubjectDropdownAll
            value={filters.subject}
            onSubjectChange={handleSubjectChange}
          />
        </div>

        {/* Start Date Input */}
        <div className="space-y-2">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <div className="relative">
            <Input
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={handleStartDateChange}
              className="w-full"
            />
            {filters.startDate && (
              <div className="absolute -bottom-5 left-0 text-xs text-gray-500">
                (00:00:00)
              </div>
            )}
          </div>
        </div>

        {/* End Date Input */}
        <div className="space-y-2">
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <div className="relative">
            <Input
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={handleEndDateChange}
              className="w-full"
            />
            {filters.endDate && (
              <div className="absolute -bottom-5 left-0 text-xs text-gray-500">
                (23:59:59)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Show Buttons */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 w-full"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute inset-y-0 right-0 px-3"
              onClick={onSearchClear}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button 
          onClick={handleShowClick}
          variant="default"
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Show Results
        </Button>
      </div>
    </div>
  );
}