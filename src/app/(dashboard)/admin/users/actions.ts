// src/app/admin/users/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { User } from '@/types/user';

interface GetUsersResponse {
  users: User[];
  total: number;
  totalPages: number;
  error?: string;
}

interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  sortBy?: keyof User;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Server Action to fetch a paginated, filtered, and sorted list of users.
 */
export async function getUsers(params: GetUsersParams): Promise<GetUsersResponse> {
  const { 
    page = 1, 
    limit = 50, 
    role, 
    search, 
    sortBy = 'created_at', 
    sortOrder = 'desc' 
  } = params;

  try {
    const supabase = createClient();
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }
    
    if (sortBy) {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit - 1;
    query = query.range(startIndex, endIndex);

    const { data: dbUsers, count, error } = await query;

    if (error) throw error;
    
    const users: User[] = dbUsers.map(dbUser => ({
        ...dbUser,
        name: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim(),
    })) || [];

    return {
      users,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    };

  } catch (error: any) {
    console.error('Server Action Error (getUsers):', error);
    return { users: [], total: 0, totalPages: 0, error: error.message };
  }
}

/**
 * Server Action to update a single user's role and/or status.
 */
export async function updateUser(userId: string, payload: { role?: string; status?: string; }): Promise<{ user: User | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath('/admin/users');
    return { user: data, error: null };

  } catch (error: any) {
    console.error(`Server Action Error (updateUser):`, error);
    return { user: null, error: error.message };
  }
}

/**
 * Server Action for bulk-updating user statuses (e.g., activate/deactivate).
 */
export async function updateUsersStatus(userIds: string[], status: string): Promise<{ success: boolean; error: string | null }> {
    if (!userIds || userIds.length === 0) {
        return { success: false, error: 'No user IDs provided.' };
    }

    try {
        const supabase = createClient();
        const { error } = await supabase
            .from('users')
            .update({ status: status, updated_at: new Date().toISOString() })
            .in('id', userIds);

        if (error) throw error;

        revalidatePath('/admin/users');
        return { success: true, error: null };
    } catch (error: any) {
        console.error('Server Action Error (updateUsersStatus):', error);
        return { success: false, error: error.message };
    }
}