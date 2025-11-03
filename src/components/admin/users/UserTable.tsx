'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import EditUserModal from '@/components/admin/users/EditUserModal';
import StatusBadge from '@/components/common/StatusBadge';
import { User } from '@/types/user';

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface UserTableProps {
  users: User[];
  pagination: PaginationData;
  itemsPerPage: number;
  onSaveUser: (
    userId: string,
    payload: { role: string; status: string }
  ) => Promise<{ error?: string | null }>;
}

export default function UserTable({
  users,
  pagination,
  itemsPerPage,
  onSaveUser,
}: UserTableProps): JSX.Element {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);

  const handleEditClick = (user: User): void => {
    setSelectedUserForEdit(user);
    setIsEditModalOpen(true);
  };

  const handleSaveFromModal = async (
    payload: { role: string; status: string }
  ): Promise<{ error?: string | null }> => {
    if (!selectedUserForEdit) {
      return { error: 'No user selected.' };
    }
    return await onSaveUser(selectedUserForEdit.id, payload);
  };

  const handleUrlChange = (newParams: URLSearchParams): void => {
    startTransition(() => {
      router.push(`${pathname}?${newParams.toString()}`);
    });
  };

  const handlePageChange = (page: number): void => {
    if (page > 0 && page <= pagination.totalPages && page !== pagination.currentPage) {
      const params = new URLSearchParams(searchParams);
      params.set('page', String(page));
      handleUrlChange(params);
    }
  };

  const requestSort = (key: keyof User): void => {
    const params = new URLSearchParams(searchParams);
    const direction =
      params.get('sortBy') === key && params.get('sortOrder') === 'asc' ? 'desc' : 'asc';
    params.set('sortBy', key);
    params.set('sortOrder', direction);
    params.set('page', '1');
    handleUrlChange(params);
  };

  const getSortIcon = (column: keyof User): string => {
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    if (sortBy !== column) {
      return '↕️';
    }
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const tableColSpan = 6;

  return (
    <div>
      {isEditModalOpen && (
        <EditUserModal
          user={selectedUserForEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
          }}
          onSave={handleSaveFromModal}
        />
      )}

      <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
        <table className="divide-y divide-gray-200 w-full min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  requestSort('name');
                }}
              >
                Name {getSortIcon('name')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  requestSort('email');
                }}
              >
                Email {getSortIcon('email')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  requestSort('role');
                }}
              >
                Role {getSortIcon('role')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  requestSort('status');
                }}
              >
                Status {getSortIcon('status')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  requestSort('created_at');
                }}
              >
                Created At {getSortIcon('created_at')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={tableColSpan} className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'moderator'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        handleEditClick(user);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalItems > 0 && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-b-lg shadow">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-start">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.currentPage - 1) * itemsPerPage + 1}</span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(pagination.currentPage * itemsPerPage, pagination.totalItems)}
              </span>{' '}
              of <span className="font-medium">{pagination.totalItems}</span> results
            </p>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end">
            <button
              onClick={() => {
                handlePageChange(pagination.currentPage - 1);
              }}
              disabled={pagination.currentPage === 1 || isPending}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => {
                handlePageChange(pagination.currentPage + 1);
              }}
              disabled={pagination.currentPage === pagination.totalPages || isPending}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
