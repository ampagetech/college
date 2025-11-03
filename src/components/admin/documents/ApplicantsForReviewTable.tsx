// src/components/admin/documents/ApplicantsForReviewTable.tsx
'use client';

import React from 'react';
import { AdminApplicantData, SortableAdminApplicantKeys, ViewCategory } from '@/types/document';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// Helper functions for clean rendering (No changes here)
const displayValue = (value: string | number | null | undefined): React.ReactNode =>
  value ? value : <span className="text-gray-400 italic">N/A</span>;

const displayDate = (dateStr: string | number | Date | null | undefined): React.ReactNode =>
  dateStr ? new Date(dateStr).toLocaleDateString() : displayValue(null);

const truncate = (text: string | null | undefined, length = 30): React.ReactNode => {
  if (!text) return displayValue(null);
  if (text.length <= length) return text;
  return (
    <span title={text} className="cursor-help">
      {text.substring(0, length)}…
    </span>
  );
};

// Column configurations (No changes here)
const columnConfig: Record<ViewCategory, { header: string; key: string; sortable?: boolean; render: (app: AdminApplicantData) => React.ReactNode }[]> = {
  status: [
    { header: 'Submitted', key: 'application_created_at', sortable: true, render: (app) => displayDate(app.application_created_at) },
    { header: 'App Status', key: 'application_status', sortable: true, render: (app) => displayValue(app.application_status) },
    { header: 'Review Notes', key: 'document_review_notes', render: (app) => truncate(app.document_review_notes, 40) },
  ],
  course_selection: [
    { header: 'First Choice', key: 'first_choice', render: (app) => displayValue(app.first_choice) },
    { header: 'Second Choice', key: 'second_choice', render: (app) => displayValue(app.second_choice) },
  ],
  personal: [
    { header: 'Surname', key: 'surname', render: (app) => displayValue(app.surname) },
    { header: 'First Name', key: 'first_name', render: (app) => displayValue(app.first_name) },
    { header: 'Gender', key: 'gender', sortable: true, render: (app) => displayValue(app.gender) },
    { header: 'DOB', key: 'date_of_birth', sortable: true, render: (app) => displayDate(app.date_of_birth) },
    { header: 'Marital Status', key: 'marital_status', sortable: true, render: (app) => displayValue(app.marital_status) },
  ],
  guardian: [
    { header: 'Guardian Name', key: 'guardian_name', sortable: true, render: (app) => displayValue(app.guardian_name) },
    { header: 'Relationship', key: 'guardian_relationship', sortable: true, render: (app) => displayValue(app.guardian_relationship) },
    { header: 'Occupation', key: 'guardian_occupation', sortable: true, render: (app) => truncate(app.guardian_occupation) },
    { header: 'Phone', key: 'guardian_phone_number', render: (app) => displayValue(app.guardian_phone_number) },
  ],
  education: [
    { header: 'School', key: 'school_name', sortable: true, render: (app) => truncate(app.school_name) },
    { header: 'Entry Year', key: 'year_of_entry', sortable: true, render: (app) => displayValue(app.year_of_entry) },
    { header: 'Grad Year', key: 'year_of_graduation', sortable: true, render: (app) => displayValue(app.year_of_graduation) },
    { header: 'Qualification', key: 'qualification_obtained', sortable: true, render: (app) => displayValue(app.qualification_obtained) },
  ],
  documents: [
    { header: 'Doc Set Status', key: 'doc_status', render: (app) => displayValue(app.doc_status) },
    { header: 'Passport', key: 'passport', render: (app) => app.passport_uploaded_at ? <FaCheckCircle className="text-green-500 mx-auto" title={String(displayDate(app.passport_uploaded_at))} /> : <FaTimesCircle className="text-red-500 mx-auto" /> },
    { header: 'Sponsor', key: 'sponsor', render: (app) => app.sponsorconsentletter_uploaded_at ? <FaCheckCircle className="text-green-500 mx-auto" title={String(displayDate(app.sponsorconsentletter_uploaded_at))} /> : <FaTimesCircle className="text-red-500 mx-auto" /> },
    { header: 'Primary', key: 'primary', render: (app) => app.primaryschoolcertificate_uploaded_at ? <FaCheckCircle className="text-green-500 mx-auto" title={String(displayDate(app.primaryschoolcertificate_uploaded_at))} /> : <FaTimesCircle className="text-red-500 mx-auto" /> },
    { header: 'SSCE', key: 'ssce', render: (app) => app.sscecertificate_uploaded_at ? <FaCheckCircle className="text-green-500 mx-auto" title={String(displayDate(app.sscecertificate_uploaded_at))} /> : <FaTimesCircle className="text-red-500 mx-auto" /> },
    { header: 'JAMB', key: 'jamb', render: (app) => app.jambresult_uploaded_at ? <FaCheckCircle className="text-green-500 mx-auto" title={String(displayDate(app.jambresult_uploaded_at))} /> : <FaTimesCircle className="text-red-500 mx-auto" /> },
  ],
};

// --- FIX: Update the props interface to include pagination props ---
interface ApplicantsForReviewTableProps {
  applicants: AdminApplicantData[];
  isLoading: boolean;
  error?: string | null;
  sortConfig: { key: SortableAdminApplicantKeys; direction: 'asc' | 'desc' } | null;
  onSortChange: (key: SortableAdminApplicantKeys) => void;
  actionButtonLabel: string;
  onActionClick: (applicant: AdminApplicantData) => void;
  viewCategory: ViewCategory;
  // --- ADD THESE MISSING PROPS ---
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

// --- FIX: Update the component signature to accept the new props ---
const ApplicantsForReviewTable: React.FC<ApplicantsForReviewTableProps> = ({
  applicants, isLoading, error, sortConfig,
  onSortChange, actionButtonLabel, onActionClick, viewCategory,
  // Destructure the new props here
  page, totalPages, total, onPageChange,
}) => {
  if (isLoading && applicants.length === 0) return <p className="p-4">Loading...</p>;
  if (error && applicants.length === 0) return <p className="p-4 text-red-500">{error}</p>;
  if (applicants.length === 0) return <p className="p-4">No applicants found.</p>;

  const currentColumns = columnConfig[viewCategory];
  const alwaysOnColumns = [
    { header: 'Applicant Name', key: 'applicant_full_name', sortable: true },
  ];

  const startRecord = (page - 1) * 10 + 1;
  const endRecord = Math.min(page * 10, total);


  return (
    <div>
      <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
        {/* Table structure remains the same */}
        <table className="divide-y divide-gray-200 w-full min-w-full">
          {/* ... thead ... */}
          <thead className="bg-gray-50">
            <tr>
              {alwaysOnColumns.map(col => (
                <th key={col.key} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => { onSortChange(col.key as SortableAdminApplicantKeys); }}>
                  {col.header}
                  {sortConfig?.key === col.key && <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
              {currentColumns.map(col => (
                <th key={col.key} scope="col" className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`} onClick={() => { if (col.sortable) onSortChange(col.key as SortableAdminApplicantKeys); }}>
                  {col.header}
                  {col.sortable && sortConfig?.key === col.key && <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && (
              <tr>
                <td colSpan={alwaysOnColumns.length + currentColumns.length + 1} className="text-center py-4">
                  <span className="text-gray-500">Updating results...</span>
                </td>
              </tr>
            )}
            {!isLoading && applicants.map((applicant) => (
              <tr key={applicant.application_id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{applicant.applicant_full_name || 'N/A'}</div></td>
                {currentColumns.map(col => (
                  <td key={col.key} className="px-4 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{col.render(applicant)}</div></td>
                ))}
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => { onActionClick(applicant); }} className="text-indigo-600 hover:text-indigo-900 hover:underline">{actionButtonLabel}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- RECOMMENDED: Add a pagination control section --- */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
            {/* Mobile buttons */}
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
                <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startRecord}</span> to <span className="font-medium">{endRecord}</span> of <span className="font-medium">{total}</span> results
                </p>
            </div>
            <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Previous
                    </button>
                    {/* Page numbers could be generated here */}
                    <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                    </button>
                </nav>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantsForReviewTable;