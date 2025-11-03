// src/app/api/applications/submit/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ROLES } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Helper to get string value from FormData
function getString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value === 'string') {
    return value.trim() === '' ? undefined : value.trim();
  }
  return undefined;
}

// Helper to get file value from FormData
function getFile(formData: FormData, key: string): File | undefined {
  const value = formData.get(key);
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return undefined;
}

const MAX_FILE_SIZE_MB = 3;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  primarySchoolCertificate: ['image/jpeg', 'image/png', 'application/pdf'],
  ssceCertificate: ['image/jpeg', 'image/png', 'application/pdf'],
  jambResult: ['image/jpeg', 'image/png', 'application/pdf'],
  passport: ['image/jpeg', 'image/png'],
  sponsorConsentLetter: ['image/jpeg', 'image/png', 'application/pdf'],
};

const requiredTextFields = [
  'surname', 'firstName', 'gender', 'dateOfBirth', 'maritalStatus', 
  'stateOfOrigin', 'lga', 'religion', 'address', 'phoneNumber', 'email',
  'guardianName', 'guardianAddress', 'guardianOccupation', 'guardianRelationship', 'guardianPhoneNumber',
  'schoolName', 'yearOfEntry', 'yearOfGraduation', 'qualificationObtained',
  'firstChoice', 'secondChoice', 'jambRegistrationNumber'
];

const fileFields = [
  'primarySchoolCertificate', 'ssceCertificate', 'jambResult', 
  'passport', 'sponsorConsentLetter'
];
const requiredFileFields = [...fileFields];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized: No session found or missing user ID' }, { status: 401 });
    }

    if (session.user.role !== ROLES.APPLICANT) {
      return NextResponse.json({ error: 'Forbidden: User is not an applicant' }, { status: 403 });
    }

    const applicantUserId = session.user.id;
    const formData = await request.formData();

    // Validate required text fields
    const missingTextFields = requiredTextFields.filter(field => !getString(formData, field));
    if (missingTextFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required text fields: ${missingTextFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Validate required file fields, their size, and type
    for (const fieldName of requiredFileFields) {
      const file = getFile(formData, fieldName);
      if (!file) {
        return NextResponse.json(
          { error: `Missing required document upload: ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File "${file.name}" for ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} exceeds the ${MAX_FILE_SIZE_MB}MB size limit.` },
          { status: 400 }
        );
      }
      const allowedTypesForField = ALLOWED_FILE_TYPES[fieldName];
      if (allowedTypesForField && !allowedTypesForField.includes(file.type)) {
         return NextResponse.json(
          { error: `File "${file.name}" for ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} has an unsupported file type (${file.type}). Allowed types: ${allowedTypesForField.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Prepare data for 'applications' table
    const applicationRecord = {
      user_id: applicantUserId,
      surname: getString(formData, 'surname')!,
      first_name: getString(formData, 'firstName')!,
      middle_name: getString(formData, 'middleName') || null,
      gender: getString(formData, 'gender')!,
      date_of_birth: getString(formData, 'dateOfBirth')!, 
      marital_status: getString(formData, 'maritalStatus')!,
      state_of_origin: getString(formData, 'stateOfOrigin')!,
      lga: getString(formData, 'lga')!,
      religion: getString(formData, 'religion')!,
      address: getString(formData, 'address')!,
      phone_number: getString(formData, 'phoneNumber')!,
      email: getString(formData, 'email')!, 
      disability: getString(formData, 'disability') || null,
      health_challenge: getString(formData, 'healthChallenge') || null,
      guardian_name: getString(formData, 'guardianName')!,
      guardian_address: getString(formData, 'guardianAddress')!,
      guardian_occupation: getString(formData, 'guardianOccupation')!,
      guardian_relationship: getString(formData, 'guardianRelationship')!,
      guardian_phone_number: getString(formData, 'guardianPhoneNumber')!,
      school_name: getString(formData, 'schoolName')!,
      year_of_entry: parseInt(getString(formData, 'yearOfEntry')!, 10),
      year_of_graduation: parseInt(getString(formData, 'yearOfGraduation')!, 10),
      qualification_obtained: getString(formData, 'qualificationObtained')!,
      first_choice: getString(formData, 'firstChoice')!,
      second_choice: getString(formData, 'secondChoice')!,
      jamb_registration_number: getString(formData, 'jambRegistrationNumber')!,
    };

    // Insert into 'applications' table
    const { data: insertedApplication, error: applicationInsertError } = await supabase
      .from('applications')
      .insert(applicationRecord)
      .select('id') 
      .single();

    if (applicationInsertError || !insertedApplication) {
      console.error('Supabase application insert error:', applicationInsertError);
      return NextResponse.json({ error: 'Failed to save application data', details: applicationInsertError.message }, { status: 500 });
    }

    const applicationId = insertedApplication.id;
    console.log('Application created with ID:', applicationId);

    // DEBUG: Verify application exists and user ownership
    const { data: verifyApp, error: verifyError } = await supabase
      .from('applications')
      .select('id, user_id')
      .eq('id', applicationId)
      .eq('user_id', applicantUserId)
      .single();

    if (verifyError || !verifyApp) {
      console.error('Application verification failed:', verifyError);
      return NextResponse.json({ error: 'Application verification failed' }, { status: 500 });
    }

    console.log('Application verified:', verifyApp);

    // Process file uploads and insert into 'applicant-documents'
    const uploadedDocumentsMetadata = [];
    const BUCKET_NAME = 'applicant-documents';

    for (const fieldName of fileFields) {
      const file = getFile(formData, fieldName); 
      if (file) {
        const originalFileExtension = path.extname(file.name).toLowerCase();
        if (!originalFileExtension) {
            console.warn(`File ${file.name} for ${fieldName} has no discernible extension.`);
        }

        const uniqueFilenameInStorage = `${uuidv4()}${originalFileExtension}`;
        const storagePath = `${applicationId}/${fieldName}/${uniqueFilenameInStorage}`;
        
        console.log(`Attempting to upload file to path: ${storagePath}`);
        console.log(`File details: name=${file.name}, size=${file.size}, type=${file.type}`);

        // Add a small delay to ensure application record is fully committed
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME) 
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false, 
          });

        if (uploadError || !uploadData) {
          console.error(`Supabase storage upload error for ${fieldName} (original: ${file.name}):`, uploadError);
          console.error('Storage path attempted:', storagePath);
          console.error('Application ID:', applicationId);
          console.error('User ID from session:', applicantUserId);
          
          // Check if the application still exists
          const { data: recheckApp } = await supabase
            .from('applications')
            .select('id, user_id')
            .eq('id', applicationId)
            .single();
          console.error('Application recheck result:', recheckApp);

          await supabase.from('applications').update({ status: 'DOCUMENT_UPLOAD_FAILED' }).eq('id', applicationId);
          return NextResponse.json({ 
            error: `Failed to upload ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 
            details: uploadError.message,
            debugInfo: {
              storagePath,
              applicationId,
              userId: applicantUserId,
              applicationExists: !!recheckApp
            }
          }, { status: 500 });
        }
        
        console.log(`Successfully uploaded ${fieldName} to:`, uploadData.path);

        const documentRecord = {
          application_id: applicationId,
          document_type: fieldName,
          file_path: uploadData.path,
          original_filename: file.name,
          content_type: file.type,
          file_size: file.size,
        };

        const { error: docInsertError } = await supabase
          .from('applicant-documents')
          .insert(documentRecord);

        if (docInsertError) {
          console.error(`Supabase document insert error for ${fieldName} (original: ${file.name}):`, docInsertError);
          await supabase.from('applications').update({ status: 'DB_DOCUMENT_ERROR' }).eq('id', applicationId);
          await supabase.storage.from(BUCKET_NAME).remove([storagePath]); 
          return NextResponse.json({ error: `Failed to save document record for ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}`, details: docInsertError.message }, { status: 500 });
        }
        uploadedDocumentsMetadata.push(documentRecord);
      }
    }

    // Update application status to 'SUBMITTED'
    const { error: statusUpdateError } = await supabase
      .from('applications')
      .update({ status: 'SUBMITTED' })
      .eq('id', applicationId);

    if (statusUpdateError) {
      console.error('Supabase status update error post-submission:', statusUpdateError);
    }

    return NextResponse.json({ 
      message: 'Application submitted successfully!', 
      applicationId: applicationId,
      documents: uploadedDocumentsMetadata.map(doc => ({ 
        type: doc.document_type, 
        path: doc.file_path,
        originalFilename: doc.original_filename 
      }))
    }, { status: 201 });

  } catch (error: any) {
    console.error('API /applications/submit general error:', error);
    if (error.message.includes("duplicate key value violates unique constraint")) {
        return NextResponse.json({ error: 'A unique constraint was violated during submission. Please try again or contact support.', details: "Duplicate data detected." }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}