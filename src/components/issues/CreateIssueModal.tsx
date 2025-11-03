// src/components/issues/CreateIssueModal.tsx
'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { IssuePriority, IssueType } from '@/types/issue';
import { createIssue, CreateIssuePayload } from '@/lib/actions/issues_actions';

// Define the options for the form dropdowns
const priorityOptions: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical'];
const typeOptions: IssueType[] = ['Bug', 'Feature Request', 'Change Request', 'Question'];

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated: () => void;
}

export default function CreateIssueModal({ isOpen, onClose, onIssueCreated }: CreateIssueModalProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [type, setType] = useState<IssueType>('Bug');

  // Modal operational state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form state when the modal is closed and reopened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setType('Bug');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and Description are required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateIssuePayload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        type
      };
      
      const result = await createIssue(payload);

      if (result.error) {
        throw new Error(result.error);
      }
      
      // onIssueCreated will refresh the table and close the modal
      onIssueCreated();

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative border w-full max-w-lg shadow-xl rounded-lg bg-white">
        <form onSubmit={handleSubmit}>
          {/* --- MODAL HEADER --- */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Create New Issue</h2>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <FaTimes size={22} />
              </button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{error}</div>}
            
            {/* --- FORM FIELDS --- */}
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                <input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                <textarea
                  id="description"
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  className={inputClass}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                    <select id="priority" value={priority} onChange={e => setPriority(e.target.value as IssuePriority)} disabled={isSubmitting} className={inputClass}>
                        {priorityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                 </div>
                 <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                    <select id="type" value={type} onChange={e => setType(e.target.value as IssueType)} disabled={isSubmitting} className={inputClass}>
                        {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                 </div>
              </div>
            </div>
          </div>

          {/* --- MODAL FOOTER --- */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 disabled:opacity-70">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center">
              {isSubmitting && <FaSpinner className="animate-spin -ml-1 mr-2" />}
              {isSubmitting ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}