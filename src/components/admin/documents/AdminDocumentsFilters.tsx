// src/components/admin/documents/AdminDocumentsFilters.tsx
'use client';

import { AdminDocumentsFiltersType, ViewCategory } from '@/types/document';
import { applicationStatusLabels } from '@/lib/constants';

interface AdminDocumentsFiltersProps {
  filters: Partial<AdminDocumentsFiltersType>;
  onFilterChange: (newFilters: Partial<AdminDocumentsFiltersType>) => void;
  viewCategory: ViewCategory;
  onCategoryChange: (category: ViewCategory) => void;
}

export default function AdminDocumentsFilters({
  filters,
  onFilterChange,
  viewCategory,
  onCategoryChange,
}: AdminDocumentsFiltersProps): JSX.Element {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    onFilterChange({ ...filters, [e.target.name]: e.target.value });
  };

  const handleResetFilters = (): void => {
    onFilterChange({
      applicantSearch: '',
      dateFrom: '',
      dateTo: '',
      status: '',
      courseSearch: '',
    });
  };

  const inputClass = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm";

  return (
    <div className="p-4 bg-white shadow rounded-lg mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
        <div>
          <label htmlFor="viewCategory" className="block text-xs font-medium text-gray-700 mb-1">
            View Category
          </label>
          <select
            id="viewCategory"
            name="viewCategory"
            className={inputClass}
            value={viewCategory}
            onChange={(e) => {
              onCategoryChange(e.target.value as ViewCategory);
            }}
          >
            <option value="status">Application Status</option>
            <option value="course_selection">Course Selection</option>
            <option value="documents">Uploaded Documents</option>
            <option value="personal">Personal Info</option>
            <option value="guardian">Guardian Info</option>
            <option value="education">Education Info</option>
          </select>
        </div>
        <div>
          <label htmlFor="applicantSearch" className="block text-xs font-medium text-gray-700 mb-1">
            Search Applicant
          </label>
          <input
            type="text"
            id="applicantSearch"
            name="applicantSearch"
            placeholder="Name..."
            className={inputClass}
            value={filters.applicantSearch || ''}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">
            Application Status
          </label>
          <select
            id="status"
            name="status"
            className={inputClass}
            value={filters.status || ''}
            onChange={handleInputChange}
          >
            <option value="">All Statuses</option>
            {Object.entries(applicationStatusLabels).map(([statusValue, label]) => (
              <option key={statusValue} value={statusValue}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="courseSearch" className="block text-xs font-medium text-gray-700 mb-1">
            Search Course
          </label>
          <input
            type="text"
            id="courseSearch"
            name="courseSearch"
            placeholder="e.g. Computer Science"
            className={inputClass}
            value={filters.courseSearch || ''}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="dateFrom" className="block text-xs font-medium text-gray-700 mb-1">
            Date From
          </label>
          <input
            type="date"
            id="dateFrom"
            name="dateFrom"
            className={inputClass}
            value={filters.dateFrom || ''}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-xs font-medium text-gray-700 mb-1">
            Date To
          </label>
          <input
            type="date"
            id="dateTo"
            name="dateTo"
            className={inputClass}
            value={filters.dateTo || ''}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleResetFilters}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          Clear Search Filters
        </button>
      </div>
    </div>
  );
}