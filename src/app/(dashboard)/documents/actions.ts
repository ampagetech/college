// src/app/(dashboard)/documents/actions.ts
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { documentFields } from '@/lib/config/documentFields';

export type DocumentState = {
  success: boolean;
  message: string | null;
  errors?: Record<string, string[]> | null;
};

type DocumentUpdateData = {
  [key: string]: string | number | Date | null;
};

// --- CORRECTED TO YOUR NEW BUCKET NAME ---
const BUCKET_NAME = 'docsbucket';

// Create validation schema for documents
const DocumentSchema = z.object(
  documentFields.reduce<Record<string, any>>((acc, field) => {
    acc[field.id] = field.required 
      ? z.instanceof(File, { message: `${field.label} is required.` })
      : z.instanceof(File).optional();
    return acc;
  }, {})
);

export async function upsertDocuments(prevState: DocumentState, formData: FormData): Promise<DocumentState> {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return { success: false, message: 'Authentication failed. Please sign in again.' };
  }

  const supabase = createClient();

  // Get existing record for the user
  const { data: existingRecord } = await supabase
    .from('application_documents')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  const updates: DocumentUpdateData = {};
  const filesToDelete: string[] = [];
  let hasNewFiles = false;

  try {
    for (const field of documentFields) {
      const file = formData.get(field.id) as File | null;

      if (file && file.size > 0) {
        hasNewFiles = true;
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          return { 
            success: false, 
            message: `${field.label} file size exceeds 5MB limit.`,
            errors: { [field.id]: [`File size must be less than 5MB`] }
          };
        }

        // Mark old file for deletion if it exists
        const oldFilePathKey = `${field.id}_file_path`;
        if (existingRecord && existingRecord[oldFilePathKey]) {
          filesToDelete.push(existingRecord[oldFilePathKey]);
        }
        
        const fileExtension = file.name.split('.').pop();
        const newFilePath = `${session.user.id}/${field.id}-${Date.now()}.${fileExtension}`;
        
        // Upload new file to storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(newFilePath, file);

        if (uploadError) {
          console.error('Upload Error:', uploadError);
          return { 
            success: false, 
            message: `Failed to upload ${field.label}.`,
            errors: { [field.id]: [`Upload failed: ${uploadError.message}`] }
          };
        }
        
        // Update database fields
        updates[`${field.id}_file_path`] = newFilePath;
        updates[`${field.id}_original_filename`] = file.name;
        updates[`${field.id}_file_size`] = file.size;
        updates[`${field.id}_uploaded_at`] = new Date();
      }
    }

    // If no new files were uploaded
    if (!hasNewFiles) {
      return { 
        success: false, 
        message: 'No files were selected for upload.' 
      };
    }
    
    // Delete old files from storage
    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToDelete);
        
      if (deleteError) {
        console.error("Failed to delete old files from storage:", deleteError.message);
      }
    }

    // Upsert document record
    updates.user_id = session.user.id;
    
    const { error: upsertError } = await supabase
      .from('application_documents')
      .upsert(updates, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Upsert Error:', upsertError);
      return { 
        success: false, 
        message: 'Failed to save document information to the database.',
        errors: { general: [upsertError.message] }
      };
    }
    
    revalidatePath('/documents');
    return { 
      success: true, 
      message: 'Documents uploaded successfully!' 
    };

  } catch (err: any) {
    console.error('Unexpected error:', err);
    return { 
      success: false, 
      message: err.message || 'An unexpected error occurred.' 
    };
  }
}

// Function to get document download URL
export async function getDocumentUrl(filePath: string): Promise<{ url: string | null; error: string | null }> {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return { url: null, error: 'Authentication required' };
  }

  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    console.error('Error creating signed URL:', error);
    return { url: null, error: error.message };
  }

  return { url: data.signedUrl, error: null };
}