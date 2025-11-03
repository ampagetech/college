// src/app/admin/users/page.tsx
import { Suspense } from 'react';
import { User } from '@/types/user';
import { getUsers } from './actions';
import AdminUsersFilters from '@/components/admin/users/AdminUsersFilters';
import UserManagement from './UserManagement';
import AdminLoading from '../loading'; // Use your existing loading component

interface AdminUsersPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    role?: string;
    search?: string;
    sortBy?: keyof User;
    sortOrder?: 'asc' | 'desc';
  };
}

async function UserData({ searchParams }: AdminUsersPageProps) {
    const page = parseInt(searchParams.page || '1');
    const limit = parseInt(searchParams.limit || '50');

    const { users, total, totalPages, error } = await getUsers({
        page,
        limit,
        role: searchParams.role,
        search: searchParams.search,
        sortBy: searchParams.sortBy,
        sortOrder: searchParams.sortOrder,
    });

    if (error) {
        return <div className="p-4 my-4 text-red-700 bg-red-100 border border-red-400 rounded-md">Error: {error}</div>;
    }

    return (
        <UserManagement
            users={users}
            pagination={{
                currentPage: page,
                totalPages: totalPages,
                totalItems: total,
            }}
            itemsPerPage={limit}
        />
    );
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
    // Generate a unique key for Suspense from searchParams to ensure it re-triggers on change
    const suspenseKey = JSON.stringify(searchParams);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                </div>

                <AdminUsersFilters />

                <Suspense key={suspenseKey} fallback={<AdminLoading />}>
                    <UserData searchParams={searchParams} />
                </Suspense>
            </div>
        </div>
    );
}