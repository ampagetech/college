// src/components/issues/ManageIssueModal.tsx
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { Issue, IssueStatus, IssuePriority, IssueType } from '@/types/issue';
import { AdminUpdateIssuePayload } from '@/lib/actions/issues_actions';
import IssueStatusBadge from './IssueStatusBadge';

const statusOptions: IssueStatus[] = ['New', 'In Progress', 'Resolved', 'Accepted', 'Reopened', 'Next Upgrade'];
const typeOptions: IssueType[] = ['Bug', 'Feature Request', 'Change Request', 'Question'];

interface ManageIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  onSave: (issueId: string, data: AdminUpdateIssuePayload) => Promise<void>;
}

export default function ManageIssueModal({
  isOpen,
  onClose,
  issue,
  onSave,
}: ManageIssueModalProps): JSX.Element | null {
  // State for the form fields
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [currentDescription, setCurrentDescription] = useState<string>(''); // ADDED state for description
  const [currentStatus, setCurrentStatus] = useState<IssueStatus>('New');
  const [currentType, setCurrentType] = useState<IssueType>('Bug');
  const [adminComment, setAdminComment] = useState<string>('');
  
  // State for the modal's operation
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // When the modal opens or the issue changes, populate the form fields
  useEffect(() => {
    if (issue) {
      setCurrentTitle(issue.title);
      setCurrentDescription(issue.description); // ADDED: Populate description
      setCurrentStatus(issue.status);
      setCurrentType(issue.type);
      setAdminComment('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [issue, isOpen]);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!currentTitle.trim() || !currentDescription.trim()) {
        setError("Title and Description cannot be empty.");
        return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      // Construct the payload with only the fields that have changed
      const payload: AdminUpdateIssuePayload = {};
      if (currentTitle.trim() !== issue.title) {
        payload.title = currentTitle.trim();
      }
      // ADDED: Include description in payload if it has changed
      if (currentDescription.trim() !== issue.description) {
        payload.description = currentDescription.trim();
      }
      if (currentStatus !== issue.status) {
        payload.status = currentStatus;
      }
      if (currentType !== issue.type) {
        payload.type = currentType;
      }
      if (adminComment.trim() !== '') {
        payload.comment = adminComment.trim();
      }
      
      if (Object.keys(payload).length > 0) {
        await onSave(issue.id, payload);
      } else {
        onClose();
      }
      
    } catch (err: unknown) {
      console.error('Issue update failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ADDED: Check for changes in description
  const hasChanges = currentTitle !== issue.title ||
                     currentDescription !== issue.description ||
                     currentStatus !== issue.status ||
                     currentType !== issue.type ||
                     adminComment !== '';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
      <div className="relative border w-full max-w-2xl shadow-xl rounded-lg bg-white max-h-[90vh] flex flex-col">
        <form onSubmit={(e): void => void handleSubmit(e)} className="flex flex-col flex-grow">
          {/* --- MODAL HEADER --- */}
          <div className="p-6 pb-0">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Manage Issue</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
                disabled={isSubmitting}
              >
                <FaTimes size={22} />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{error}</div>
            )}
          </div>

          {/* --- EDITABLE DETAILS --- */}
          <div className="overflow-y-auto flex-grow px-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                disabled={isSubmitting}
                className="text-lg font-semibold text-gray-900 w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            {/* ADDED: Editable Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
                disabled={isSubmitting}
                className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>
            
            {/* Non-editable details for reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm pt-2">
              <div><strong>Reporter:</strong> <span className="text-gray-600">{issue.reporter?.name || issue.reporter?.email || 'N/A'}</span></div>
              <div><strong>Assignee:</strong> <span className="text-gray-600">{issue.assignee?.name || issue.assignee?.email || 'Unassigned'}</span></div>
              <div><strong>Priority:</strong> <span className="text-gray-600">{issue.priority}</span></div>
              <div><strong>Created At:</strong> <span className="text-gray-600">{new Date(issue.created_at).toLocaleString()}</span></div>
              <div><strong>Last Updated:</strong> <span className="text-gray-600">{new Date(issue.updated_at).toLocaleString()}</span></div>
              <div><strong>Current Status:</strong> <IssueStatusBadge status={issue.status} /></div>
            </div>
          </div>
          
          {/* --- EDITABLE FORM SECTION --- */}
          <div className="px-6 pt-4 border-t mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Update Status <span className="text-red-500">*</span></label>
                <select
                  id="status"
                  name="status"
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value as IssueStatus)}
                  required
                  disabled={isSubmitting}
                  className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm"
                >
                  {statusOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Update Type <span className="text-red-500">*</span></label>
                <select
                  id="type"
                  name="type"
                  value={currentType}
                  onChange={(e) => setCurrentType(e.target.value as IssueType)}
                  required
                  disabled={isSubmitting}
                  className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm"
                >
                  {typeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="adminComment" className="block text-sm font-medium text-gray-700 mb-1">Add Comment (Optional)</label>
                <textarea
                  id="adminComment"
                  name="adminComment"
                  rows={3}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Add a comment about the status change or progress..."
                  className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* --- MODAL FOOTER (Actions) --- */}
          <div className="mt-auto p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-200 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasChanges}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting && <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}