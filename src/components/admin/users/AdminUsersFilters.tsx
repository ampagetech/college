// src/components/admin/users/AdminUsersFilters.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition, ChangeEvent } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import RowsPerPageSelector from '@/components/common/RowsPerPageSelector'; 

export default function AdminUsersFilters(): JSX.Element {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const replace = (url: string): void => {
    router.replace(url);
  };
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (key: 'search' | 'role', value: string): void => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1'); // Reset to first page on any filter change
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  const debouncedSearch = useDebouncedCallback((value: string): void => {
    handleFilterChange('search', value);
  }, 300);

  const handleClearFilters = (): void => {
    startTransition(() => {
      replace(pathname);
    });
  };

  const inputClass =
    'w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm';

    return (
      <div className="p-4 bg-white shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* Column 1: Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Users
            </label>
            <input
              type="text"
              id="search"
              name="search"
              placeholder="Name, Email..."
              className={inputClass}
              defaultValue={searchParams.get('search')?.toString() || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => debouncedSearch(e.target.value)}
              disabled={isPending}
            />
          </div>
  
          {/* Column 2: Role Filter */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Role
            </label>
            <select
              id="role"
              name="role"
              className={inputClass}
              defaultValue={searchParams.get('role')?.toString() || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                handleFilterChange('role', e.target.value);
              }}
              disabled={isPending}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="applicant">Applicant</option>
            </select>
          </div>
  
          {/* Column 3: Rows Per Page Selector (NEW) */}
          <div className="flex justify-end">
            <RowsPerPageSelector />
          </div>
        </div>
  
        {/* Clear Filters Button (remains at the bottom) */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
            disabled={isPending}
          >
            Clear All Filters
          </button>
        </div>
      </div>
    );}
