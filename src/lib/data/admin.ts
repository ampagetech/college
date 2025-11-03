// C:\DevWeb\jewel-univ-apply\src\lib\data\admin.ts
import { UserProfile, Course, AcademicSession, Admission } from '@/types/admission';
import { ADMISSION_API_ROUTES  } from '@/lib/constants';
import { cookies } from 'next/headers'; // <<<<<<<<<<< IMPORT THIS

// Helper function to get the correct base URL for API calls
const getApiBaseUrl = (): string => {
  // ... your getApiBaseUrl logic ...
  // Example fallback if others are not set:
  return process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
};


// ... (FormDataForAdmission interface) ...

export async function fetchFormDataForAdmission(): Promise<{
  users: UserProfile[];
  courses: Course[];
  academicSessions: AcademicSession[];
} | null> {
  const API_BASE_URL = getApiBaseUrl();
  console.log(`[fetchFormDataForAdmission] Using API_BASE_URL: ${API_BASE_URL}`);

  const cookieStore = cookies(); // Get cookies
  const cookieHeader = cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
  const authFetchOptions = {
    cache: 'no-store' as RequestCache,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  };
  const publicFetchOptions = { cache: 'no-store' as RequestCache };


  try {
    const usersApiUrl = `${API_BASE_URL}/api/admin/users?role=applicant&role=student&limit=1000`;
    const coursesApiUrl = `${API_BASE_URL}/api/courses`;
    const academicSessionsApiUrl = `${API_BASE_URL}/api/academic-sessions`;

    console.log(`[fetchFormDataForAdmission] Fetching users from: ${usersApiUrl}`);
    console.log(`[fetchFormDataForAdmission] Fetching courses from: ${coursesApiUrl}`);
    console.log(`[fetchFormDataForAdmission] Fetching sessions from: ${academicSessionsApiUrl}`);

    const [usersResponse, coursesResponse, academicSessionsResponse] = await Promise.all([
      fetch(usersApiUrl, authFetchOptions), // Needs auth
      fetch(coursesApiUrl, publicFetchOptions), // Assuming public
      fetch(academicSessionsApiUrl, publicFetchOptions), // Assuming public
    ]);

    // ... (your existing detailed logging and error handling for responses) ...
    // Make sure this part is robust
    let hasError = false;
    const usersText = '', coursesText = '', sessionsText = '';

    if (!usersResponse.ok) { /* ... */ hasError = true; }
    if (!coursesResponse.ok) { /* ... */ hasError = true; }
    if (!academicSessionsResponse.ok) { /* ... */ hasError = true; }

    if (hasError) {
      console.error('[fetchFormDataForAdmission] One or more API calls failed.');
      return null;
    }
    // ... (parsing logic) ...
    // Return { users, courses, academicSessions }

  // Example simplified return for brevity:
    const usersData = await usersResponse.json();
    const coursesData = await coursesResponse.json();
    const academicSessionsData = await academicSessionsResponse.json();
    return {
        users: usersData.users || [],
        courses: coursesData.courses || [],
        academicSessions: academicSessionsData.academicSessions || [],
    };

  } catch (error) {
    console.error('[fetchFormDataForAdmission] CRITICAL ERROR:', error);
    return null;
  }
}


export async function fetchAdmissionForEditing(admissionId: string): Promise<Admission | null> {
  const API_BASE_URL = getApiBaseUrl();
  console.log(`[fetchAdmissionForEditing] Using API_BASE_URL: ${API_BASE_URL}`);
  const apiUrl = `${API_BASE_URL}/api/admin/admissions/${admissionId}`;
  console.log(`[fetchAdmissionForEditing] Fetching from: ${apiUrl} for ID: ${admissionId}`);

  try {
    const cookieStore = cookies();
    const cookieHeader = cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }), // <<<<<<<<<<< PASS COOKIES
      },
      cache: 'no-store',
    });

    console.log(`[fetchAdmissionForEditing] Response for ID ${admissionId}: Status ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => `Failed to read error response text for admission ID ${admissionId}`);
      console.error(`[fetchAdmissionForEditing] Error fetching admission ${admissionId}. Status: ${response.status}. Body: ${errorText}`);
      if (response.status === 404) {
        console.warn(`[fetchAdmissionForEditing] API returned 404 for admission ID: ${admissionId}.`);
      }
      return null; // Return null if not OK
    }

    const data = await response.json();
    console.log(`[fetchAdmissionForEditing] Successfully fetched. Raw data for ID ${admissionId}:`, JSON.stringify(data, null, 2));

    if (data && data.admission) {
      console.log(`[fetchAdmissionForEditing] 'admission' object found for ID ${admissionId}.`);
      return data.admission as Admission;
    } else {
      console.error(`[fetchAdmissionForEditing] 'admission' property NOT found in response data for ID ${admissionId}.`);
      return null;
    }
  } catch (error) {
    console.error(`[fetchAdmissionForEditing] CRITICAL EXCEPTION for ID ${admissionId}:`, error);
    return null;
  }
}