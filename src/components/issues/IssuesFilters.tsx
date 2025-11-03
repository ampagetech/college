// src/components/issues/IssuesFilters.tsx
'use client';

import React, { ChangeEvent } from 'react';
import { IssueFiltersType, IssueStatus, IssuePriority, IssueType } from '@/types/issue';
import { FaPlus } from 'react-icons/fa';

const statusOptions: IssueStatus[] = ['New', 'In Progress', 'Resolved', 'Accepted', 'Reopened', 'Next Upgrade'];
const priorityOptions: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical'];
const typeOptions: IssueType[] = ['Bug', 'Feature Request', 'Change Request', 'Question'];

interface IssuesFiltersProps {
  filters: IssueFiltersType;
  onFilterChange: (newFilters: Partial<IssueFiltersType>) => void;
  // --- MODIFIED: Added a prop to handle the button click ---
  onNewIssueClick: () => void;
}

export default function IssuesFilters({ filters, onFilterChange, onNewIssueClick }: IssuesFiltersProps): JSX.Element {

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    onFilterChange({ [e.target.name]: e.target.value });
  };

  const handleClearFilters = (): void => {
    onFilterChange({
      userSearch: '',
      status: '',
      priority: '',
      type: '',
    });
  };

  const inputClass = 'w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm';

  return (
    <div className="p-4 bg-white shadow rounded-lg mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
        <div className="md:col-span-2 lg:col-span-1">
          <label htmlFor="userSearch" className="block text-xs font-medium text-gray-700 mb-1">Search Issues</label>
          <input type="text" id="userSearch" name="userSearch" placeholder="Title, description..." className={inputClass} value={filters.userSearch} onChange={handleInputChange}/>
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select id="status" name="status" className={inputClass} value={filters.status} onChange={handleInputChange}>
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (<option key={status} value={status}>{status}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
          <select id="priority" name="priority" className={inputClass} value={filters.priority} onChange={handleInputChange}>
            <option value="">All Priorities</option>
            {priorityOptions.map((priority) => (<option key={priority} value={priority}>{priority}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <select id="type" name="type" className={inputClass} value={filters.type} onChange={handleInputChange}>
            <option value="">All Types</option>
            {typeOptions.map((type) => (<option key={type} value={type}>{type}</option>))}
          </select>
        </div>
      </div>

      {/* --- MODIFIED: Replaced the button layout --- */}
      <div className="mt-4 flex items-center justify-end space-x-4">
        <button
          onClick={handleClearFilters}
          className="text-sm font-medium text-gray-600 hover:text-indigo-600"
        >
          Clear All Filters
        </button>
        <button
          onClick={onNewIssueClick}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FaPlus className="mr-2 h-4 w-4" />
          Create New Issue
        </button>
      </div>
    </div>
  );
}