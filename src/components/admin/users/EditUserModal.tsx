// --- CLEANED VERSION ---
// src/components/admin/users/EditUserModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: { role: string; status: string }) => Promise<{ error?: string | null }>;
}

const roleOptions = [
  { value: 'student', label: 'Student' },
  { value: 'applicant', label: 'Applicant' },
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
];

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
}: EditUserModalProps): JSX.Element | null {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  useEffect((): void => {
    if (isOpen && user) {
      setSelectedRole(user.role || '');
      setSaveError('');
      setShowConfirm(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSaveClick = (): void => {
    setShowConfirm(true);
  };

  const confirmSave = async (): Promise<void> => {
    setIsSaving(true);
    setSaveError('');
    try {
      const result = await onSave({
        role: selectedRole,
        status: user.status || 'active',
      });
      if (result.error) {
        setSaveError(result.error);
        setShowConfirm(false);
      } else {
        onClose();
      }
    } catch {
      setSaveError('An unexpected error occurred');
      setShowConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelSave = (): void => {
    setShowConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl mx-4">
        {showConfirm ? (
          <div className="p-6 text-center">
            <h3 className="text-lg font-bold mb-4">Confirm Changes</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to change this user&apos;s role to{' '}
              <strong className="capitalize">{selectedRole}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelSave}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => void confirmSave()}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold">Edit User</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <div className="mt-1 p-2 bg-gray-100 rounded">{user.name || 'N/A'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 p-2 bg-gray-100 rounded">{user.email || 'N/A'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e): void => {
                    setSelectedRole(e.target.value);
                  }}
                  className="mt-1 w-full p-2 border border-gray-300 rounded"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {saveError && (
                <div className="p-3 bg-red-100 text-red-700 rounded">
                  <p>{saveError}</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t">
              <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">
                Cancel
              </button>
              <button
                onClick={handleSaveClick}
                disabled={selectedRole === user.role || isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
              >
                Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
