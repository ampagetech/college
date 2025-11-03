import { Faculty } from '@/types/university';
import React from 'react';

interface FacultyTableProps {
  faculties: Faculty[];
  onEdit: (faculty: Faculty) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}

export default function FacultyTable({
  faculties,
  onEdit,
  onDelete,
  disabled,
}: FacultyTableProps): JSX.Element {
  return (
    <div className="shadow border-b border-gray-200 sm:rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dean</th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {faculties.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No faculties found.</td>
            </tr>
          ) : (
            faculties.map((faculty) => (
              <tr key={faculty.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{faculty.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{faculty.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{faculty.dean_name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <button
                    onClick={() => { onEdit(faculty); }}
                    disabled={disabled}
                    className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { onDelete(faculty.id); }}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
