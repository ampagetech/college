'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ViewCategory, SortableAdminApplicantKeys } from '@/types/document';

interface AdminSession extends Session { user: { id: string; role: 'admin'; } & Session['user']; }

type ApplicationFromDB = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  document_review_notes: string | null;
  surname: string;
  first_name: string;
  middle_name: string | null;
  first_choice_course_id: string | null;
  second_choice_course_id: string | null;
  first_choice_course: { name: string } | null;
  second_choice_course: { name: string } | null;
  gender?: string;
  date_of_birth?: string;
  marital_status?: string;
  guardian_name?: string;
  guardian_address?: string;
  guardian_occupation?: string;
  guardian_relationship?: string;
  guardian_phone_number?: string;
  school_name?: string;
  year_of_entry?: number;
  year_of_graduation?: number;
  qualification_obtained?: string;
  jamb_registration_number?: string;
};

type ApplicationDocumentsFromDB = {
  id: string;
  user_id: string;
  status: string | null;
  admin_comment: string | null;
  reviewed_at: string | null;
  reviewed_by_admin_id: string | null;
  passport_file_path: string | null;
  passport_original_filename: string | null;
  passport_file_size: number | null;
  passport_uploaded_at: string | null;
  sponsorconsentletter_file_path: string | null;
  sponsorconsentletter_original_filename: string | null;
  sponsorconsentletter_file_size: number | null;
  sponsorconsentletter_uploaded_at: string | null;
  primaryschoolcertificate_file_path: string | null;
  primaryschoolcertificate_original_filename: string | null;
  primaryschoolcertificate_file_size: number | null;
  primaryschoolcertificate_uploaded_at: string | null;
  sscecertificate_file_path: string | null;
  sscecertificate_original_filename: string | null;
  sscecertificate_file_size: number | null;
  sscecertificate_uploaded_at: string | null;
  jambresult_file_path: string | null;
  jambresult_original_filename: string | null;
  jambresult_file_size: number | null;
  jambresult_uploaded_at: string | null;
};

type TransformedDocument = {
  id: string;
  document_type: string;
  file_path: string | null;
  public_url: string | null;
  original_filename: string | null;
  file_size: number | null;
  uploaded_at: string | null;
};

interface FetchApplicantsParams {
  page: number;
  limit: number;
  filters: {
    applicantSearch?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    courseSearch?: string;
    document_type?: string;
    applicationIdSearch?: string;
  };
  sortConfig: { key: SortableAdminApplicantKeys; direction: 'asc' | 'desc' } | null;
  viewCategory: ViewCategory;
}

const OverallReviewSchema = z.object({
  status: z.string().min(1, "Status is required."),
  notes: z.string().optional().nullable(),
  firstChoiceCourseId: z.string().uuid().optional().nullable(),
  secondChoiceCourseId: z.string().uuid().optional().nullable(),
});

const DocumentSetReviewSchema = z.object({
  status: z.string().min(1, "Status is required."),
  comment: z.string().optional().nullable(),
});

export async function getApplicationDetailsForReview(applicationId: string) {
  const supabase = createClient();
  const session = await getServerSession(authOptions) as AdminSession;
  if (!session) {
    return { success: false, error: 'No session found.' };
  }
  if (session.user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  if (!applicationId) {
    return { success: false, error: 'Application ID is missing.' };
  }

  try {
    const { data: applicationData, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();
    if (appError) throw new Error(`Failed to fetch application: ${appError.message}`);
    if (!applicationData) {
      return { success: false, error: 'Application not found.' };
    }

    const { data: docData, error: docError } = await supabase
      .from('application_documents')
      .select('*')
      .eq('user_id', applicationData.user_id)
      .single();
    if (docError) {
      console.warn(`Could not find documents for user ${applicationData.user_id}: ${docError.message}`);
    }

    const transformedDocuments: TransformedDocument[] = [];
    if (docData) {
      const bucketName = process.env.SUPABASE_BUCKET_NAME!;
      const documentFields = {
        passport: 'passport',
        sponsorconsentletter: 'sponsorconsentletter',
        primaryschoolcertificate: 'primaryschoolcertificate',
        sscecertificate: 'sscecertificate',
        jambresult: 'jambresult',
      } as const;
      for (const type in documentFields) {
        const key = type as keyof typeof documentFields;
        const filePath = docData[`${key}_file_path`];
        if (filePath) {
          const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
          transformedDocuments.push({
            id: `${docData.id}-${key}`,
            document_type: key,
            file_path: filePath,
            public_url: urlData.publicUrl,
            original_filename: docData[`${key}_original_filename`],
            file_size: docData[`${key}_file_size`],
            uploaded_at: docData[`${key}_uploaded_at`],
          });
        }
      }
    }
    const fullDetails = { ...applicationData, application_documents_row: docData, applicant_documents: transformedDocuments };
    return { success: true, data: fullDetails };
  } catch (err: any) {
    console.error('Server Action Error [getApplicationDetailsForReview]:', err);
    return { success: false, error: err.message || 'An unexpected error occurred while fetching application details.' };
  }
}

export async function updateApplicationReview(applicationId: string, payload: z.infer<typeof OverallReviewSchema>) {
  const supabase = createClient();
  const session = await getServerSession(authOptions) as AdminSession;
  if (!session) {
    return { success: false, error: 'No session found.' };
  }
  if (session.user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  if (!applicationId) {
    return { success: false, error: 'Application ID is missing.' };
  }

  const validatedFields = OverallReviewSchema.safeParse(payload);
  if (!validatedFields.success) {
    return { success: false, error: 'Invalid data provided for application review.' };
  }

  try {
    const { status, notes, firstChoiceCourseId, secondChoiceCourseId } = validatedFields.data;
    const dataToUpdate: any = {
      status,
      document_review_notes: notes,
      documents_reviewed_at: new Date().toISOString(),
      documents_reviewed_by: session.user.id,
    };
    if (firstChoiceCourseId) {
      dataToUpdate.first_choice_course_id = firstChoiceCourseId;
    }
    if (secondChoiceCourseId) {
      dataToUpdate.second_choice_course_id = secondChoiceCourseId;
    }

    const { data, error } = await supabase
      .from('applications')
      .update(dataToUpdate)
      .eq('id', applicationId)
      .select()
      .single();
    if (error) {
      throw new Error(`Failed to update application: ${error.message}`);
    }
    if (!data) {
      throw new Error('No data returned after updating application.');
    }
    revalidatePath('/admin/documents');
    return { success: true, message: 'Application updated successfully.' };
  } catch (err: any) {
    console.error('Server Action Error [updateApplicationReview]:', err);
    return { success: false, error: err.message || 'An unexpected error occurred while updating the application.' };
  }
}

export async function updateDocumentSetReview(applicationDocumentsId: string, payload: z.infer<typeof DocumentSetReviewSchema>) {
  const supabase = createClient();
  const session = await getServerSession(authOptions) as AdminSession;
  if (!session) {
    return { success: false, error: 'No session found.' };
  }
  if (session.user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  if (!applicationDocumentsId) {
    return { success: false, error: 'Application documents ID is missing.' };
  }

  const validatedFields = DocumentSetReviewSchema.safeParse(payload);
  if (!validatedFields.success) {
    return { success: false, error: 'Invalid data provided for document set review.' };
  }

  try {
    const { status, comment } = validatedFields.data;
    const dataToUpdate = {
      status,
      admin_comment: comment,
      reviewed_at: new Date().toISOString(),
      reviewed_by_admin_id: session.user.id,
    };

    const { data, error } = await supabase
      .from('application_documents')
      .update(dataToUpdate)
      .eq('id', applicationDocumentsId)
      .select()
      .single();
    if (error) {
      throw new Error(`Failed to update document set: ${error.message}`);
    }
    if (!data) {
      throw new Error('No data returned after updating document set.');
    }
    revalidatePath('/admin/documents');
    return { success: true, message: 'Document set updated successfully.' };
  } catch (err: any) {
    console.error('Server Action Error [updateDocumentSetReview]:', err);
    return { success: false, error: err.message || 'An unexpected error occurred while updating the document set.' };
  }
}

export async function getApplicantsForReview(params: FetchApplicantsParams) {
  const supabase = createClient();
  const session = await getServerSession(authOptions) as AdminSession;
  if (!session) {
    return { success: false, error: 'No session found.' };
  }
  if (session.user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  const { page, limit, filters, sortConfig, viewCategory } = params;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    let baseSelect = `id, user_id, status, created_at, document_review_notes, surname, first_name, middle_name, first_choice_course_id, second_choice_course_id, first_choice_course:courses!first_choice_course_id(name), second_choice_course:courses!second_choice_course_id(name)`;
    // Adjust baseSelect based on viewCategory if needed
    switch (viewCategory) {
      case 'personal':
        baseSelect += `, gender, date_of_birth, marital_status`;
        break;
      case 'guardian':
        baseSelect += `, guardian_name, guardian_address, guardian_occupation, guardian_relationship, guardian_phone_number`;
        break;
      case 'education':
        baseSelect += `, school_name, year_of_entry, year_of_graduation, qualification_obtained, jamb_registration_number`;
        break;
      default:
        break;
    }

    let query = supabase.from('applications').select(baseSelect, { count: 'exact' });

    if (filters.applicantSearch) {
      query = query.or(`surname.ilike.%${filters.applicantSearch}%,first_name.ilike.%${filters.applicantSearch}%`);
    }
    if (filters.courseSearch) {
      const p = `%${filters.courseSearch}%`;
      query = query.or(`courses!first_choice_course_id.name.ilike.${p},courses!second_choice_course_id.name.ilike.${p}`);
    }
    if (filters.applicationIdSearch) {
      query = query.ilike('id', `%${filters.applicationIdSearch}%`);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', new Date(filters.dateFrom).toISOString());
    }
    if (filters.dateTo) {
      const d = new Date(filters.dateTo);
      d.setDate(d.getDate() + 1);
      query = query.lt('created_at', d.toISOString());
    }

    if (sortConfig) {
      const k = sortConfig.key === 'application_created_at' ? 'created_at' : sortConfig.key;
      query = query.order(k, { ascending: sortConfig.direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: applicationData, error: appError, count } = await query.range(start, end) as {
      data: ApplicationFromDB[] | null;
      error: any;
      count: number | null;
    };
    if (appError) throw new Error(`Database error on applications: ${appError.message}`);
    if (!applicationData || applicationData.length === 0) {
      return { success: true, applicants: [], page, totalPages: 0, total: 0 };
    }

    // Fetch document statuses
    const userIds = applicationData.map(app => app.user_id);
    const { data: docData, error: docError } = await supabase
      .from('application_documents')
      .select('user_id, status, admin_comment')
      .in('user_id', userIds);
    if (docError) {
      console.warn(`Could not fetch documents: ${docError.message}`);
    }

    const docDataMap = new Map<string, Partial<ApplicationDocumentsFromDB>>();
    if (docData) {
      docData.forEach(doc => {
        docDataMap.set(doc.user_id, { status: doc.status, admin_comment: doc.admin_comment });
      });
    }

    const applicants = applicationData.map((app) => {
      const fullName = [app.first_name, app.middle_name, app.surname].filter(Boolean).join(' ');
      const docDetails = docDataMap.get(app.user_id) || {};
      return {
        ...app,
        application_id: app.id,
        applicant_full_name: fullName,
        user_email: '',
        application_status: app.status,
        application_created_at: app.created_at,
        first_choice: app.first_choice_course?.name || 'N/A',
        second_choice: app.second_choice_course?.name || 'N/A',
        doc_status: docDetails.status || 'N/A',
        doc_admin_comment: docDetails.admin_comment || null,
      };
    });

    return { success: true, applicants, page, totalPages: Math.ceil((count || 0) / limit), total: count || 0 };
  } catch (err: any) {
    console.error('Server Action Error [getApplicantsForReview]:', err);
    return { success: false, error: err.message || 'An unexpected server error occurred.' };
  }
}
