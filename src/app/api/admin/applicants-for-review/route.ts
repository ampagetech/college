// src/app/api/admin/applicants-for-review/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Add this to fix the dynamic server usage error
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Interface for the data structure we'll return
interface ApiApplicantData {
  user_id: string; // From view: u.id
  application_id: string; // From view: a.id
  applicant_full_name: string; // From view
  user_email: string; // From view: u.email
  document_review_notes?: string | null; // From view: a.document_review_notes
  application_status?: string | null; // From view: a.status
  application_created_at?: string; // From view: a.created_at (for sorting/filtering)
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement admin authentication/authorization

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('applicantSearch') || searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status'); // <<<< ADDED: Extract status parameter
    // Default sort by application_created_at from the view
    const sortBy = searchParams.get('sortBy') || 'application_created_at';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    const offset = (page - 1) * limit;

    console.log('API Query params:', { page, limit, search, dateFrom, dateTo, status, sortBy, sortOrder }); // <<<< ADDED: Log status

    // Base query from the view
    let query = supabaseAdmin
      .from('applicant_docs_verification_view')
      .select(
        `
          user_id,
          application_id,
          applicant_full_name,
          user_email,
          document_review_notes,
          application_status,
          application_created_at
        `,
        { count: 'exact' } // Important for pagination to get total count
      );

    // Apply search filter (on view columns)
    if (search) {
      // Check if the search term looks like a UUID (for exact application_id matching)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isUuidSearch = uuidRegex.test(search.trim());
      
      if (isUuidSearch) {
        // If search term is a UUID, search only in application_id with exact match
        query = query.eq('application_id', search.trim());
      } else {
        // For non-UUID searches, search in text fields only
        query = query.or(
          `applicant_full_name.ilike.%${search}%,` +
          `user_email.ilike.%${search}%`
          // Removed application_id from text search since it's a UUID
          // Add other text fields from the view to search if necessary:
          // `document_review_notes.ilike.%${search}%`
        );
      }
      console.log('Applied search filter:', { search, isUuidSearch }); // Debug log
    }

    // Apply date filters (on application_created_at from the view)
    if (dateFrom) {
      // Ensure dateFrom is in ISO format or a format Supabase understands
      query = query.gte('application_created_at', new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      const toDateObj = new Date(dateTo);
      toDateObj.setHours(23, 59, 59, 999); // Set to end of day for inclusive range
      query = query.lte('application_created_at', toDateObj.toISOString());
    }

    // <<<< ADDED: Apply status filter
    if (status && status.trim() !== '') {
      // Apply exact match filter for application status
      // Since your database stores status in ALL CAPS (e.g., 'APPROVED', 'PENDING')
      // and the frontend now sends the correct ALL CAPS values, this should work
      query = query.eq('application_status', status.trim());
      console.log('Applied status filter:', status.trim()); // Debug log
    }

    // Apply sorting (on view columns)
    // Map incoming sortBy parameter to actual view column names
    let actualSortByColumn = 'application_created_at'; // Default
    if (sortBy === 'applicant_name') { // frontend might send 'applicant_name'
      actualSortByColumn = 'applicant_full_name'; // map to view's column name
    } else if (sortBy === 'email') {
      actualSortByColumn = 'user_email';
    } else if (sortBy === 'application_id') {
      actualSortByColumn = 'application_id';
    } else if (sortBy === 'application_status') {
      actualSortByColumn = 'application_status';
    }
    // Add more mappings if you allow sorting by other view columns

    query = query.order(actualSortByColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching from applicant_docs_verification_view:', error);
      throw error;
    }

    const totalItems = count || 0;
    const paginatedApplicants: ApiApplicantData[] = (data || []).map(item => ({
        user_id: item.user_id,
        application_id: item.application_id,
        applicant_full_name: item.applicant_full_name,
        user_email: item.user_email,
        document_review_notes: item.document_review_notes,
        application_status: item.application_status,
        application_created_at: item.application_created_at,
    }));


    console.log('Final result:', {
      totalItems,
      currentPageItems: paginatedApplicants.length,
      page,
      totalPages: Math.ceil(totalItems / limit),
      appliedFilters: { search, dateFrom, dateTo, status } // <<<< ADDED: Log applied filters
    });

    return NextResponse.json({
      // You can name this key 'users' or 'applicants' based on frontend expectation
      applicants: paginatedApplicants,
      page: page,
      totalPages: Math.ceil(totalItems / limit),
      total: totalItems,
    });

  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({
      message: error.message || 'An unexpected error occurred.',
      applicants: [],
      page: 1,
      totalPages: 0,
      total: 0
    }, { status: 500 });
  }
}