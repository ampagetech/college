// src/app/api/applications/documents/[applicationId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';
import { documentFields as documentFieldsConfig } from '@/lib/config/documentFields';

interface ExistingDocumentAPIResponse {
  id: string;
 
  original_filename: string;
  file_url: string;
  uploadedAt: string;
  file_size: number;
  content_type: string;
}

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

// Read bucket name from environment variable
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME;

// --- GET Handler ---
export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const consolePrefix = '[API GET /api/applications/documents/[applicationId]]';

  // Critical check for bucket name
  if (!SUPABASE_BUCKET_NAME) {
    console.error(`${consolePrefix} CRITICAL: SUPABASE_BUCKET_NAME is not defined in environment variables.`);
    return NextResponse.json({ error: "Server configuration error: Storage bucket not configured." }, { status: 500 });
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.sub || String(token.role).toLowerCase() !== ROLES.APPLICANT) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.sub;
  const { applicationId } = params;

  if (!applicationId) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
  }

  console.log(`${consolePrefix} Fetching documents for User ID: ${userId}, Application ID: ${applicationId}, Bucket: ${SUPABASE_BUCKET_NAME}`);
  const supabase = createClient();

  try {
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', applicationId)
      .eq('user_id', userId)
      .single();

    if (appError || !appData) {
      console.error(`${consolePrefix} Application not found or not owned by user. App ID: ${applicationId}, User ID: ${userId}`, appError);
      return NextResponse.json({ error: 'Application not found or access denied.' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('application_documents')
      .select('id, document_type, original_filename, file_path, file_size, content_type, uploaded_at')
      .eq('application_id', applicationId);

    if (error) {
      console.error(`${consolePrefix} Supabase error fetching documents:`, error);
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const formattedData: ExistingDocumentAPIResponse[] = data.map(doc => {
      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .getPublicUrl(doc.file_path);

      return {
        id: doc.id,
       // documentType: doc.document_type as DocumentTypeEnumType,
        original_filename: doc.original_filename,
        file_url: publicUrlData.publicUrl || '',
        uploadedAt: doc.uploaded_at,
        file_size: doc.file_size,
        content_type: doc.content_type,
      };
    });

    console.log(`${consolePrefix} Successfully fetched ${formattedData.length} documents.`);
    return NextResponse.json(formattedData, { status: 200 });

  } catch (error: any) {
    console.error(`${consolePrefix} General error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch documents' }, { status: 500 });
  }
}

// --- POST Handler ---
export async function POST(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const consolePrefix = '[API POST /api/applications/documents/[applicationId]]';

  console.log(`${consolePrefix} === POST REQUEST STARTED ===`);

  // Critical check for bucket name
  if (!SUPABASE_BUCKET_NAME) {
    console.error(`${consolePrefix} CRITICAL: SUPABASE_BUCKET_NAME is not defined in environment variables.`);
    return NextResponse.json({ error: "Server configuration error: Storage bucket not configured." }, { status: 500 });
  }

  console.log(`${consolePrefix} Bucket name verified: ${SUPABASE_BUCKET_NAME}`);

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.sub || String(token.role).toLowerCase() !== ROLES.APPLICANT) {
    console.error(`${consolePrefix} Unauthorized access attempt. Token: ${!!token}, Sub: ${token?.sub}, Role: ${token?.role}`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.sub;
  const { applicationId } = params;

  if (!applicationId) {
    console.error(`${consolePrefix} Missing application ID`);
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
  }

  console.log(`${consolePrefix} User ID: ${userId}, Application ID: ${applicationId}`);
  const supabase = createClient();

  try {
    // Verify application ownership
    console.log(`${consolePrefix} Verifying application ownership...`);
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', applicationId)
      .eq('user_id', userId)
      .single();

    if (appError || !appData) {
      console.error(`${consolePrefix} Application verification failed:`, appError);
      return NextResponse.json({ error: 'Application not found or access denied for uploading.' }, { status: 404 });
    }

    console.log(`${consolePrefix} Application ownership verified`);

    // Parse form data
    console.log(`${consolePrefix} Parsing form data...`);
    let formData;
    try {
      formData = await request.formData();
      console.log(`${consolePrefix} Form data parsed successfully`);
      
      // Log all form data entries
      // Corrected line: Wrap formData.entries() with Array.from()
      for (const [key, value] of Array.from(formData.entries())) {
        if (value instanceof File) {
          console.log(`${consolePrefix} Form field: ${key}, File: ${value.name}, Size: ${value.size}, Type: ${value.type}`);
        } else {
          console.log(`${consolePrefix} Form field: ${key}, Value: ${value}`);
        }
      }
    } catch (formError: any) {
      console.error(`${consolePrefix} Failed to parse form data:`, formError);
      return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
    }

    const upsertOperations: Array<{
      application_id: string;
      user_id: string;
      //document_type: DocumentTypeEnumType;
      file_path: string;
      original_filename: string;
      content_type: string;
      file_size: number;
    }> = [];

    let filesProcessedCount = 0;

    console.log(`${consolePrefix} Processing ${documentFieldsConfig.length} possible document types...`);

    for (const field of documentFieldsConfig) {
     // const documentType = field.id as DocumentTypeEnumType;
      const file = formData.get(field.id) as File | null;

  //    console.log(`${consolePrefix} Checking field: ${documentType}, File present: ${!!file}`);

      if (file && file instanceof File) {
        filesProcessedCount++;
      //  console.log(`${consolePrefix} Processing file for: ${documentType}, Name: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
          console.error(`${consolePrefix} File too large: ${file.name} (${file.size} bytes)`);
          return NextResponse.json({ 
            error: `File "${file.name}" for ${field.label} (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds max size of ${(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB.` 
          }, { status: 413 });
        }

        // Validate file is not empty
        if (file.size === 0) {
          console.error(`${consolePrefix} Empty file detected: ${file.name}`);
          return NextResponse.json({ 
            error: `File "${file.name}" is empty. Please select a valid file.` 
          }, { status: 400 });
        }

        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const storagePath = `${userId}/${applicationId}/${field.id}.${fileExtension}`;

        console.log(`${consolePrefix} Uploading to storage path: ${storagePath}`);

        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(SUPABASE_BUCKET_NAME)
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type,
            });

          if (uploadError) {
          //  console.error(`${consolePrefix} Storage upload error for ${documentType}:`, uploadError);
            throw new Error(`Failed to upload ${field.label}: ${uploadError.message}`);
          }

          if (!uploadData || !uploadData.path) {
          //  console.error(`${consolePrefix} Upload succeeded but no path returned for ${documentType}`);
            throw new Error(`Failed to get storage path after uploading ${field.label}.`);
          }

         // console.log(`${consolePrefix} Successfully uploaded ${documentType} to ${uploadData.path}`);

          upsertOperations.push({
            application_id: applicationId,
            user_id: userId,
           // document_type: documentType,
            file_path: uploadData.path,
            original_filename: file.name,
            content_type: file.type,
            file_size: file.size,
          });

        } catch (uploadError: any) {
        //  console.error(`${consolePrefix} Upload failed for ${documentType}:`, uploadError);
          throw uploadError;
        }
      }
    }

    console.log(`${consolePrefix} Files processed: ${filesProcessedCount}, Upsert operations: ${upsertOperations.length}`);

    if (upsertOperations.length > 0) {
      console.log(`${consolePrefix} Upserting ${upsertOperations.length} document records...`);
      
      try {
        const { error: dbUpsertError } = await supabase
          .from('application_documents')
          .upsert(upsertOperations, {
            onConflict: 'application_id, document_type',
          });

        if (dbUpsertError) {
          console.error(`${consolePrefix} Database upsert error:`, dbUpsertError);
          throw new Error(`Failed to save document metadata: ${dbUpsertError.message}`);
        }

        console.log(`${consolePrefix} Database upsert completed successfully`);
      } catch (dbError: any) {
        console.error(`${consolePrefix} Database operation failed:`, dbError);
        throw dbError;
      }
    } else if (filesProcessedCount === 0) {
      console.log(`${consolePrefix} No files were present in the form data to process.`);
      return NextResponse.json({ message: 'No new files provided for upload.' }, { status: 200 });
    }

    console.log(`${consolePrefix} === POST REQUEST COMPLETED SUCCESSFULLY ===`);
    return NextResponse.json({
      message: `${upsertOperations.length} document(s) processed successfully.`,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`${consolePrefix} === CRITICAL ERROR ===`);
    console.error(`${consolePrefix} Error type:`, typeof error);
    console.error(`${consolePrefix} Error name:`, error?.name);
    console.error(`${consolePrefix} Error message:`, error?.message);
    console.error(`${consolePrefix} Error stack:`, error?.stack);
    console.error(`${consolePrefix} Full error object:`, error);
    
    return NextResponse.json({ 
      error: error.message || 'Failed to process documents',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}