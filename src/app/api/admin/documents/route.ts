// src/app/api/admin/documents/route.ts

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';
// Corrected Import: Added DocumentAssociatedUser
import { AdminDocumentView, DocumentStatus, DocumentType, DocumentAssociatedUser } from '@/types/document';

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  const consolePrefix = '[API GET /api/admin/documents]';
  const timestamp = new Date().toISOString();

  const responseHeadersBase = {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Timestamp': timestamp,
  };

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: responseHeadersBase });
  }
  if (String(token.role).toLowerCase() !== ROLES.ADMIN.toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: responseHeadersBase });
  }

  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString());

  const statusFilter = searchParams.get('status') as DocumentStatus | "ALL" | null;
  const documentTypeFilter = searchParams.get('document_type') as DocumentType | "ALL" | null;
  const applicantSearch = searchParams.get('applicantSearch')?.trim();
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const sortBy = searchParams.get('sortBy') || 'uploaded_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const ascending = sortOrder === 'asc';

  try {
    console.log(`${consolePrefix} [${timestamp}] Building FRESH query with filters:`, {
      status: statusFilter, document_type: documentTypeFilter, applicantSearch, dateFrom, dateTo, page, limit, sortBy, sortOrder
    });

    let baseQuery = supabase
      .from('application_documents')
      .select(`
        id, application_id, user_id, document_type, file_path, original_filename,
        content_type, file_size, uploaded_at, created_at, updated_at, status,
        admin_comment, reviewed_by_admin_id, reviewed_at
      `, { count: 'exact' });

    if (statusFilter && statusFilter !== "ALL") {
      baseQuery = baseQuery.eq('status', statusFilter);
    }
    if (documentTypeFilter && documentTypeFilter !== "ALL") {
      baseQuery = baseQuery.eq('document_type', documentTypeFilter);
    }

    if (dateFrom) {
      baseQuery = baseQuery.gte('uploaded_at', new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      baseQuery = baseQuery.lte('uploaded_at', endDate.toISOString());
    }
    
    if (sortBy && !sortBy.startsWith('applicant.') && !sortBy.startsWith('reviewed_by_admin.')) {
        if (['uploaded_at', 'status', 'document_type', 'file_size', 'created_at', 'updated_at', 'reviewed_at'].includes(sortBy)) {
            baseQuery = baseQuery.order(sortBy, { ascending });
            console.log(`${consolePrefix} [${timestamp}] Applied DB sorting on ${sortBy}`);
        }
    }

    const offset = (page - 1) * limit;
    baseQuery = baseQuery.range(offset, offset + limit - 1);
    
    const { data: documentsData, error: documentsError, count } = await baseQuery;

    if (documentsError) {
        console.error(`${consolePrefix} [${timestamp}] DB Error fetching documents:`, documentsError);
        throw documentsError;
    }
    console.log(`${consolePrefix} [${timestamp}] Fetched ${documentsData.length || 0} documents base data. Total count from DB: ${count}`);

    let finalDocuments: AdminDocumentView[] = [];

    if (documentsData && documentsData.length > 0) {
        const userIds = new Set<string>();
        documentsData.forEach(doc => {
            if (doc.user_id) userIds.add(doc.user_id); // Check if user_id exists
            if (doc.reviewed_by_admin_id) {
                userIds.add(doc.reviewed_by_admin_id);
            }
        });

        let usersMap = new Map();
        if (userIds.size > 0) {
            const { data: usersData, error: usersError } = await supabase
                .from('users') 
                .select('id, email, first_name, last_name, role') // role is fetched but not in DocumentAssociatedUser, which is fine
                .in('id', Array.from(userIds));

            if (usersError) {
                console.error(`${consolePrefix} [${timestamp}] DB Error fetching user data:`, usersError);
                throw usersError;
            }
            console.log(`${consolePrefix} [${timestamp}] Fetched ${usersData.length || 0} related user details.`);
            usersMap = new Map(usersData.map(u => [u.id, u]));
        }


        // This .map() operation should now work correctly with DocumentAssociatedUser imported
        finalDocuments = documentsData.map(doc => {
            const applicantUser = doc.user_id ? usersMap.get(doc.user_id) : undefined;
            const reviewerUser = doc.reviewed_by_admin_id ? usersMap.get(doc.reviewed_by_admin_id) : undefined;

            return {
                ...doc, // Spreads all properties from the original document data
                applicant: applicantUser as DocumentAssociatedUser | undefined,
                reviewed_by_admin: reviewerUser as DocumentAssociatedUser | undefined,
            };
        });

        if (applicantSearch) {
            const searchLower = applicantSearch.toLowerCase();
            finalDocuments = finalDocuments.filter(doc => {
            const applicant = doc.applicant; // Now typed as DocumentAssociatedUser | undefined
            return (
                applicant?.email?.toLowerCase().includes(searchLower) ||
                applicant?.first_name?.toLowerCase().includes(searchLower) ||
                applicant?.last_name?.toLowerCase().includes(searchLower) ||
                (doc.user_id && doc.user_id.toLowerCase().includes(searchLower))
            );
            });
            console.log(`${consolePrefix} [${timestamp}] Applied applicant search (post-DB): ${finalDocuments.length} records remain on this page.`);
        }

        if (sortBy.startsWith('applicant.') || sortBy.startsWith('reviewed_by_admin.')) {
            const [relation, field] = sortBy.split('.');
            if (field && ['email', 'first_name', 'last_name'].includes(field)) {
                finalDocuments.sort((a, b) => {
                    const aUser = relation === 'applicant' ? a.applicant : a.reviewed_by_admin;
                    const bUser = relation === 'applicant' ? b.applicant : b.reviewed_by_admin;
                    
                    // Access field safely, as aUser/bUser can be undefined or field can be null/undefined
                    const aVal = (aUser as any)?.[field]?.toLowerCase() || '';
                    const bVal = (bUser as any)?.[field]?.toLowerCase() || '';
                    
                    const comparison = aVal.localeCompare(bVal);
                    return ascending ? comparison : -comparison;
                });
                console.log(`${consolePrefix} [${timestamp}] Applied client-side sorting on ${relation}.${field}`);
            }
        }
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    console.log(`${consolePrefix} [${timestamp}] ✅ FINAL SUCCESS: Returning ${finalDocuments.length} documents.`);
    
    return NextResponse.json({
        documents: finalDocuments,
        page,
        limit,
        totalPages,
        totalItems,
        timestamp,
    }, { headers: responseHeadersBase });

  } catch (error: any) {
    console.error(`${consolePrefix} [${timestamp}] ❌ GENERAL ERROR:`, error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch documents',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp
    }, { status: 500, headers: responseHeadersBase });
  }
}