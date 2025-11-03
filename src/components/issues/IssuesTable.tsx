// src/components/issues/IssuesTable.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaEdit, FaSpinner, FaSort, FaSortUp, FaSortDown, FaEllipsisV, FaPlus } from 'react-icons/fa';
import ManageIssueModal from '@/components/issues/ManageIssueModal';
import IssueStatusBadge from '@/components/issues/IssueStatusBadge';
import { Issue, IssueFiltersType, IssueStatus } from '@/types/issue';
import { getIssues, updateIssue, AdminUpdateIssuePayload } from '@/lib/actions/issues_actions';
import toast from 'react-hot-toast';

interface ActionDropdownProps {
  issue: Issue;
  onNewClick: () => void; // Kept this prop
  onEditClick: () => void;
  onStatusChange: (status: IssueStatus) => Promise<void>;
  isUpdating: boolean;
}

// --- MODIFIED: No changes here, the "New Issue" button remains ---
function ActionDropdown({ issue, onNewClick, onEditClick, onStatusChange, isUpdating }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ... (rest of the dropdown component is unchanged)

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'Reopened': return 'text-red-600 hover:text-red-800 hover:bg-red-50';
      case 'Resolved': case 'Accepted': return 'text-green-600 hover:text-green-800 hover:bg-green-50';
      default: return 'text-black hover:text-gray-800 hover:bg-gray-50';
    }
  };

  const handleStatusClick = async (status: IssueStatus) => {
    setIsOpen(false);
    await onStatusChange(status);
  };
  
  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button type="button" className="inline-flex items-center p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none" onClick={() => setIsOpen(!isOpen)} disabled={isUpdating}>
        {isUpdating ? <FaSpinner className="animate-spin h-4 w-4" /> : <FaEllipsisV className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            <button onClick={() => handleStatusClick('Accepted')} disabled={issue.status === 'Accepted'} className={`${getStatusColor('Accepted')} group flex items-center px-4 py-2 text-sm w-full text-left disabled:opacity-50`}><div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>Accepted{issue.status === 'Accepted' && <span className="ml-auto text-xs">(Current)</span>}</button>
            <button onClick={() => handleStatusClick('Resolved')} disabled={issue.status === 'Resolved'} className={`${getStatusColor('Resolved')} group flex items-center px-4 py-2 text-sm w-full text-left disabled:opacity-50`}><div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>Resolved{issue.status === 'Resolved' && <span className="ml-auto text-xs">(Current)</span>}</button>
            <button onClick={() => handleStatusClick('Reopened')} disabled={issue.status === 'Reopened'} className={`${getStatusColor('Reopened')} group flex items-center px-4 py-2 text-sm w-full text-left disabled:opacity-50`}><div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>Reopened{issue.status === 'Reopened' && <span className="ml-auto text-xs">(Current)</span>}</button>
            <div className="border-t border-gray-100 my-1"></div>
            <button onClick={() => { setIsOpen(false); onNewClick(); }} className="text-gray-700 hover:bg-gray-50 group flex items-center px-4 py-2 text-sm w-full text-left"><FaPlus className="mr-3 h-4 w-4" />New Issue</button>
            <button onClick={() => { setIsOpen(false); onEditClick(); }} className="text-gray-700 hover:bg-gray-50 group flex items-center px-4 py-2 text-sm w-full text-left"><FaEdit className="mr-3 h-4 w-4" />Edit Issue</button>
          </div>
        </div>
      )}
    </div>
  );
}


interface IssuesTableProps {
  filters: IssueFiltersType;
  refreshTrigger: number;
  onIssueUpdated: () => void;
  onNewIssueClick: () => void; // Receives the click handler from parent
}

type SortableKeys = keyof Omit<Issue, 'assignee'> | 'reporter.email';

export default function IssuesTable({ filters, onIssueUpdated, refreshTrigger, onNewIssueClick }: IssuesTableProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 15 });
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [updatingIssues, setUpdatingIssues] = useState<Set<string>>(new Set());

  // Modal state for EDIT modal only
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Data fetching and other logic remains the same...
  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getIssues({ page: pagination.currentPage, limit: pagination.limit, filters, sortConfig });
      if (result.error) throw new Error(result.error);
      setIssues(result.data?.issues || []);
      setPagination(prev => ({ ...prev, currentPage: result.data?.page || 1, totalPages: result.data?.totalPages || 1, totalItems: result.data?.totalItems || 0 }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, filters, sortConfig]);

  useEffect(() => { void fetchIssues(); }, [fetchIssues, refreshTrigger]);
  useEffect(() => { setPagination(prev => ({ ...prev, currentPage: 1 })); }, [filters, sortConfig]);

  const handleEditClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsEditModalOpen(true);
  };

  const handleStatusChange = async (issue: Issue, newStatus: IssueStatus) => {
    setUpdatingIssues(prev => new Set(prev).add(issue.id));
    const toastId = toast.loading(`Updating status...`);
    try {
      const result = await updateIssue(issue.id, { status: newStatus });
      if (result.error) throw new Error(result.error);
      toast.success(`Updated to "${newStatus}"`, { id: toastId });
      onIssueUpdated();
    } catch (err) {
      toast.error('Update failed.', { id: toastId });
    } finally {
      setUpdatingIssues(prev => { const newSet = new Set(prev); newSet.delete(issue.id); return newSet; });
    }
  };

  const handleEditModalSave = async (issueId: string, updatedData: AdminUpdateIssuePayload) => {
    try {
      const result = await updateIssue(issueId, updatedData);
      if (result.error) throw new Error(result.error);
      onIssueUpdated();
      setIsEditModalOpen(false);
    } catch (err) {
      throw err;
    }
  };


  // --- The rest of the component (render logic) ---

  const colSpanValue = 7; // Remains 7 after removing Assignee

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* --- MODIFIED: Assignee column header removed --- */}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && issues.length > 0 && (
              <tr><td colSpan={colSpanValue} className="p-4 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Refreshing...</td></tr>
            )}
            {!isLoading && issues.length === 0 ? (
              <tr><td colSpan={colSpanValue} className="px-6 py-10 text-center text-gray-500">No issues found.</td></tr>
            ) : (
              issues.map((issue) => (
                <tr key={issue.id} className={`hover:bg-gray-50 transition-colors ${issue.status === 'Resolved' ? 'bg-green-50/70' : issue.status === 'Accepted' ? 'bg-blue-50/70' : issue.status === 'Reopened' ? 'bg-red-50/70' : ''}`}>
                  {/* --- MODIFIED: Assignee data cell removed --- */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{issue.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{issue.reporter?.name || issue.reporter?.email || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm"><IssueStatusBadge status={issue.status} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{issue.priority}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{issue.type}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(issue.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <ActionDropdown
                      issue={issue}
                      onNewClick={onNewIssueClick}
                      onEditClick={() => handleEditClick(issue)}
                      onStatusChange={(status) => handleStatusChange(issue, status)}
                      isUpdating={updatingIssues.has(issue.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination remains the same */}
      {!isLoading && pagination.totalPages > 1 && (
         <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 bg-white">
            <span className="text-sm text-gray-700">Page {pagination.currentPage} of {pagination.totalPages} (Total: {pagination.totalItems} items)</span>
            <div>
              <button onClick={() => setPagination(p => ({...p, currentPage: p.currentPage - 1}))} disabled={pagination.currentPage <= 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Previous</button>
              <button onClick={() => setPagination(p => ({...p, currentPage: p.currentPage + 1}))} disabled={pagination.currentPage >= pagination.totalPages} className="relative -ml-px inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
         </div>
      )}

      {/* Edit Modal remains */}
      {selectedIssue && (
        <ManageIssueModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          issue={selectedIssue}
          onSave={handleEditModalSave}
        />
      )}
      
      {/* --- MODIFIED: CreateIssueModal is now removed from here --- */}
    </div>
  );
}