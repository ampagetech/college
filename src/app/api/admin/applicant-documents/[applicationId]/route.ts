// src/app/api/admin/applicant-documents/[applicationId]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// It's generally better practice to use SUPABASE_URL for server-side, 
// but NEXT_PUBLIC_SUPABASE_URL will work if it's the only one defined.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const applicantDocumentsBucketName = process.env.SUPABASE_BUCKET_NAME!; // Ensure this is set in your .env

// Ensure you're using the service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

interface ApplicationData {
  id: string;
  user_id: string | null;
  surname: string;
  first_name: string;
  middle_name: string | null;
  gender: string;
  date_of_birth: string; // ISO date string
  marital_status: string;
  state_of_origin: string;
  lga: string;
  religion: string;
  address: string;
  phone_number: string;
  email: string;
  disability: string | null;
  health_challenge: string | null;
  guardian_name: string;
  guardian_address: string;
  guardian_occupation: string;
  guardian_relationship: string;
  guardian_phone_number: string;
  school_name: string;
  year_of_entry: number;
  year_of_graduation: number;
  qualification_obtained: string;
  first_choice: string;
  second_choice: string;
  jamb_registration_number: string;
  application_date: string; // ISO datetime string
  status: string; // e.g., 'SUBMITTED', 'REVIEWED', 'APPROVED'
  document_review_notes: string | null;
  documents_reviewed_by: string | null; // user_id of admin
  documents_reviewed_at: string | null; // ISO datetime string
  created_at: string | null; // ISO datetime string
  updated_at: string | null; // ISO datetime string
  applicant_documents?: ApplicantDocument[]; // This will be populated
}

interface ApplicantDocument {
  id: string;
  document_type: string;
  file_path: string; // Path within the bucket
  public_url?: string; // <<<< ADDED: Full public URL for the document
  original_filename: string;
  content_type: string;
  file_size: number;
  uploaded_at: string;
  status: string;
  admin_comment: string | null;
  reviewed_by_admin_id: string | null;
  reviewed_at: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    // TODO: Implement robust admin authentication/authorization
    // ... (your auth code placeholder)

    const { applicationId } = params;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !applicantDocumentsBucketName) {
        console.error('Supabase URL or Applicant Documents Bucket Name is not configured in environment variables.');
        return NextResponse.json(
            { error: 'Server configuration error for file storage.' },
            { status: 500 }
        );
    }

    // 1. Fetch application data
    const { data: applicationData, error: applicationError } =
      await supabaseAdmin
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

    if (applicationError) {
      console.error('Error fetching application data:', applicationError);
      if (applicationError.code === 'PGRST116') {
        return NextResponse.json(
          { error: `Application with ID ${applicationId} not found` },
          { status: 404 }
        );
      }
      throw applicationError;
    }

    if (!applicationData) {
      return NextResponse.json(
        { error: `Application with ID ${applicationId} not found` },
        { status: 404 }
      );
    }

    // 2. Fetch related documents for this application
    const { data: documentsData, error: documentsError } =
      await supabaseAdmin
        .from('application_documents')
        .select(`
          id,
          document_type,
          file_path,
          original_filename,
          content_type,
          file_size,
          uploaded_at,
          status,
          admin_comment,
          reviewed_by_admin_id,
          reviewed_at
        `)
        .eq('application_id', applicationId)
        .order('document_type', { ascending: true });

    if (documentsError) {
      console.error('Error fetching applicant documents:', documentsError);
      throw documentsError;
    }

    // 3. Construct public URLs for each document
    const documentsWithPublicUrls = (documentsData || []).map(doc => {
      // Ensure filePathInBucket doesn't start with a slash for URL construction
      const cleanedFilePath = doc.file_path.startsWith('/') 
        ? doc.file_path.substring(1) 
        : doc.file_path;

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${applicantDocumentsBucketName}/${cleanedFilePath}`;
      
      return {
        ...doc,
        public_url: publicUrl, // Add the fully constructed public URL
      };
    });

    // Combine data
    const fullApplicationDetails: ApplicationData = {
      ...applicationData,
      applicant_documents: documentsWithPublicUrls,
    };

    return NextResponse.json({ application: fullApplicationDetails });

  } catch (error: any) {
    console.error('API Error in applicant-documents GET:', error);
    return NextResponse.json(
      { 
        error: error.message || 'An unexpected error occurred while fetching application details.',
        details: error.details || null
      },
      { status: 500 }
    );
  }
}

// Placeholder for POST (e.g., submitting review notes, changing application status)
export async function POST(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    // TODO: Implement robust admin authentication/authorization
    const { applicationId } = params;
    const body = await req.json(); 

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    if (body.document_review_notes !== undefined || body.status !== undefined) {
      const updatePayload: Partial<Pick<ApplicationData, 'document_review_notes' | 'status' | 'documents_reviewed_by' | 'documents_reviewed_at'>> = {}; // Be more specific with type
      if (body.document_review_notes !== undefined) {
        updatePayload.document_review_notes = body.document_review_notes;
      }
      if (body.status !== undefined) {
        updatePayload.status = body.status;
      }
      // TODO: Get currentAdminUserId from authenticated session
      // updatePayload.documents_reviewed_by = currentAdminUserId; 
      // updatePayload.documents_reviewed_at = new Date().toISOString();
      
      const { data, error } = await supabaseAdmin
        .from('applications')
        .update(updatePayload)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating application:', error);
        throw error;
      }
      return NextResponse.json({ message: 'Application updated successfully', application: data });
    }
    
    return NextResponse.json({ message: 'POST request received. No specific action taken for body.', received_body: body }, { status: 200 });

  } catch (error: any) {
    console.error('API Error in applicant-documents POST:', error);
    return NextResponse.json(
      { 
        error: error.message || 'An unexpected error occurred while updating application details.',
        details: error.details || null
      },
      { status: 500 }
    );
  }
}