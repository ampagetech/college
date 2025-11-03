// C:\DevWeb\jewel-univ-apply\src\lib\data\admissions.ts
// Add these types at the TOP of src/lib/data/admissions.ts
interface ErrorPayload {
  message: string;
  context?: Record<string, any>;
  errorBody?: string;
  stack?: string;
}

type FetchResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ErrorPayload };

// --- Imports are correct ---
import { Admission, AdmissionLetterData } from '@/types/admission';
import { ADMISSION_API_ROUTES } from '@/lib/constants';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';





// --- Helper functions are correct ---
const getApiBaseUrl = (): string => {
  if (process.env.VERCEL_URL) { // Vercel system environment variable
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.APP_URL) { // Your custom environment variable for deployed app URL
    return process.env.APP_URL;
  }
  // Fallback for local development
  return process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
};

const getLogoBase64 = (): string | null => {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo-letter-head.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
    return null;
  } catch (error) {
    console.error('[Data Layer] Error loading logo:', error);
    return null;
  }
};

/**
 * Fetches a specific admission's details for a student.
 */
export async function fetchAdmissionDetailsForStudent(
  admissionId: string,
  userId: string
): Promise<Admission | null> {
  const API_BASE_URL = getApiBaseUrl();
  const apiUrl = `${API_BASE_URL}${ADMISSION_API_ROUTES.GET_STUDENT_ADMISSION_DETAIL.replace('[id]', admissionId)}`;
  console.log(`[fetchAdmissionDetailsForStudent] Fetching from: ${apiUrl} for ID: ${admissionId}, User: ${userId}`);

  try {
    const cookieStore = cookies();
    const cookieHeader = cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[fetchAdmissionDetailsForStudent] Error for ${admissionId}: Status ${response.status}`);
      return null;
    }
    const data = await response.json();
    if (data && data.admission) {
      return data.admission as Admission;
    }
    return null;
  } catch (error) {
    console.error(`[fetchAdmissionDetailsForStudent] CRITICAL EXCEPTION for ID ${admissionId}:`, error);
    return null;
  }
}

// --- FIX: Corrected function signature and full implementation ---
/**
 * Fetches the data required to render an admission letter for a student WITH logo.
 * @param admissionId - The ID of the admission for which to fetch letter data.
 * @param userId - The ID of the user (for authorization context and logging).
 * @returns The admission letter data with logo or null if not found or unauthorized.
 */
export async function fetchAdmissionLetterDataForStudent(
  admissionId: string,
  userId: string
): Promise<FetchResult<(AdmissionLetterData & { logoDataUri?: string | null })>> {
  
  // Assuming getApiBaseUrl and getLogoBase64 functions exist in your file
  const API_BASE_URL = getApiBaseUrl(); 
  const apiUrl = `${API_BASE_URL}${ADMISSION_API_ROUTES.GET_STUDENT_ADMISSION_LETTER_DATA.replace('[admissionId]', admissionId)}`;
  
  const debugContext = {
    admissionId,
    userId,
    functionName: 'fetchAdmissionLetterDataForStudent',
    resolvedApiBaseUrl: API_BASE_URL,
    finalApiUrl: apiUrl,
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'Not set',
  };

  try {
    const cookieStore = cookies();
    const cookieHeader = cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Could not read error body.");
      return {
        success: false,
        error: {
          message: `The internal API call to fetch letter data failed with status ${response.status}.`,
          context: { ...debugContext, status: response.status, statusText: response.statusText },
          errorBody: errorText,
        },
      };
    }

    const data = await response.json();

    if (data && data.letterData) {
      const letterData = data.letterData as AdmissionLetterData;
      const logoDataUri = getLogoBase64() || undefined; // Convert null to undefined
      
      return {
        success: true,
        data: { ...letterData, logoDataUri },
      };
    

      
    } else {
      return {
        success: false,
        error: {
          message: "The server responded with data, but it was in an unexpected format (missing 'letterData').",
          context: { ...debugContext, responseKeys: Object.keys(data || {}) },
          errorBody: JSON.stringify(data, null, 2),
        },
      };
    }
  } catch (error) {
    const isInvalidUrlError = error instanceof TypeError && error.message.includes('Invalid URL');
    
    return {
      success: false,
      error: {
        message: isInvalidUrlError 
          ? "Failed to construct a valid URL for the internal API call. Check environment variables."
          : "A critical exception occurred while trying to fetch data.",
        context: debugContext,
        stack: error instanceof Error ? error.stack : 'No stack trace available',
      },
    };
  }
}
