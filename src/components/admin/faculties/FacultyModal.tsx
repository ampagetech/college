'use client';

import { useState, useEffect } from 'react';
import { Faculty } from '@/types/university';

interface FacultyModalProps {
  faculty: Faculty | null;
  onClose: () => void;
  onSave: (payload: { name: string; code: string; dean_name: string | null }) => void;
  isSaving: boolean;
}

export default function FacultyModal({
  faculty,
  onClose,
  onSave,
  isSaving,
}: FacultyModalProps): JSX.Element {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [deanName, setDeanName] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect((): void => {
    if (faculty) {
      setName(faculty.name);
      setCode(faculty.code);
      setDeanName(faculty.dean_name || '');
    }
  }, [faculty]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!name || !code) {
      setError('Faculty Name and Code are required.');
      return;
    }
    onSave({ name, code, dean_name: deanName || null });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">{faculty ? 'Edit' : 'Add'} Faculty</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Faculty Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e): void => {
                  setName(e.target.value);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Faculty Code (e.g., FMS)
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e): void => {
                  setCode(e.target.value);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="deanName" className="block text-sm font-medium text-gray-700">
                Dean&apos;s Name (Optional)
              </label>
              <input
                type="text"
                id="deanName"
                value={deanName}
                onChange={(e): void => {
                  setDeanName(e.target.value);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Faculty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
