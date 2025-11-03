// src/lib/actions/issues_actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Issue, IssueFiltersType, IssueStatus, IssueType, IssuePriority } from '@/types/issue';

// --- UPDATED: Added title and description to the payload ---
export interface AdminUpdateIssuePayload {
  title?: string;
  description?: string;
  status?: IssueStatus;
  assignee_id?: string | null;
  priority?: string;
  type?: string;
  comment?: string;
}

type SortConfig = {
  key: keyof Issue | 'reporter.email' | 'assignee.email';
  direction: 'asc' | 'desc';
} | null;

interface GetIssuesParams {
  page: number;
  limit: number;
  filters: IssueFiltersType;
  sortConfig: SortConfig;
}

export interface CreateIssuePayload {
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
}

// =================================================================
// GET ISSUES WITH DETAILS VIA RPC
// =================================================================

export async function getIssues({ page, limit, filters, sortConfig }: GetIssuesParams) {
  const supabase = createServerActionClient({ cookies });
  const offset = (page - 1) * limit;

  try {
    const { data: issues, error: issuesError } = await supabase
      .rpc('get_issues_with_details', {
        p_status: filters.status || null,
        p_priority: filters.priority || null,
        p_type: filters.type || null,
        p_search_text: filters.userSearch || null,
        p_limit: limit,
        p_offset: offset,
      });
    //console.log('RAW DATA FROM RPC:', issues);
    if (issuesError) throw issuesError;

    const { data: totalItems, error: countError } = await supabase
      .rpc('get_issues_count', {
        p_status: filters.status || null,
        p_priority: filters.priority || null,
        p_type: filters.type || null,
        p_search_text: filters.userSearch || null,
      });

    if (countError) throw countError;

    const totalPages = Math.ceil((totalItems || 0) / limit);

    return {
      data: {
        issues: issues || [],
        page,
        totalPages,
        totalItems: totalItems || 0,
        limit,
      },
      error: null,
    };

  } catch (err: any) {
    console.error('❌ Supabase RPC error in getIssues:', err);
    return { data: null, error: 'Failed to fetch issues via RPC.' };
  }
}

// =================================================================
// UPDATE ISSUE (SECURE, SERVER-SIDE, WITH SESSION)
// =================================================================

export async function updateIssue(issueId: string, payload: AdminUpdateIssuePayload) {
  try {
    const session = await getServerSession(authOptions);
    const supabase = createServerActionClient({ cookies });

    if (!session?.user?.id) {
      console.log('⚠️ updateIssue: No user session found.');
      return { data: null, error: 'Not authenticated.' };
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // --- UPDATED: Added checks for title and description ---
    if (payload.title) updateData.title = payload.title;
    if (payload.description) updateData.description = payload.description;
    if (payload.status) updateData.status = payload.status;
    if (payload.assignee_id !== undefined) updateData.assignee_id = payload.assignee_id;
    if (payload.priority !== undefined) updateData.priority = payload.priority;
    if (payload.type !== undefined) updateData.type = payload.type;

    console.log('📝 Updating issue', issueId, 'with', updateData);

    const { data: updatedIssue, error: updateError } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', issueId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Supabase update error:', updateError);
      return { data: null, error: updateError.message };
    }

    if (payload.comment?.trim()) {
      const { error: commentError } = await supabase
        .from('issue_comments')
        .insert({
          issue_id: issueId,
          user_id: session.user.id,
          comment: payload.comment.trim(),
          created_at: new Date().toISOString(),
        });

      if (commentError) {
        console.warn('⚠️ Comment insert error:', commentError);
      }
    }

    console.log('✅ updateIssue succeeded:', updatedIssue);
    return { data: { success: true, issue: updatedIssue }, error: null };

  } catch (err: any) {
    console.error('🔥 updateIssue unexpected error:', err);
    return { data: null, error: 'Unexpected error during issue update.' };
  }
}

// =================================================================
// CREATE ISSUE (Preserved, using same secure pattern)
// =================================================================

export async function createIssue(payload: CreateIssuePayload) {
  const session = await getServerSession(authOptions);
  const supabase = createServerActionClient({ cookies });

  if (!session?.user?.id) {
    return { data: null, error: 'You must be logged in to create an issue.' };
  }

  const { data, error } = await supabase
    .from('issues')
    .insert({
      title: payload.title,
      description: payload.description,
      type: payload.type,
      priority: payload.priority,
      reporter_id: session.user.id,
      status: 'New',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase create issue error:', error);
    return { data: null, error: 'Failed to create the issue in the database.' };
  }

  return { data, error: null };
}