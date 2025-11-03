// src/app/admin/users/UserManagement.tsx
'use client';

// REMOVE: We don't need useState for selectedUserIds anymore
import { User } from '@/types/user';
import UserTable, { PaginationData } from '@/components/admin/users/UserTable';
// REMOVE: We are deleting the UserActions component
// import UserActions from '@/components/admin/users/UserActions';
import { updateUser } from './actions';

interface UserManagementProps {
    users: User[];
    pagination: PaginationData;
    itemsPerPage: number;
}

export default function UserManagement({
    users,
    pagination,
    itemsPerPage,
}: UserManagementProps) {
    // REMOVED: const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    // REMOVED: The handleBulkAction function is no longer needed.

    const handleSaveUser = async (userId: string, payload: { role: string; status:string }) => {
        const result = await updateUser(userId, payload);
        if (result.error) {
            alert(`Failed to update user: ${result.error}`);
        }
        return { error: result.error };
    };

    return (
        <div className="space-y-4 mt-6">
            {/* REMOVED: The UserActions component is gone */}
            <UserTable
                users={users}
                pagination={pagination}
                itemsPerPage={itemsPerPage}
                // REMOVED: No longer need to pass selection state
                onSaveUser={handleSaveUser}
            />
        </div>
    );
}