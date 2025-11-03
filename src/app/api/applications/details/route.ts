// src/app/api/applications/details/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ROLES } from '@/lib/constants';

// Helper to get string value from JSON body more robustly
function getStringFromBody(body: any, key: string): string | undefined {
  const value = body[key];
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value.trim() === '' ? undefined : value.trim();
  }
  if (typeof value === 'number') { 
    return value.toString().trim() === '' ? undefined : value.toString().trim();
  }
  return undefined;
}

const requiredApplicationTextFields = [
  'surname', 'firstName', 'gender', 'dateOfBirth', 'maritalStatus', 
  'stateOfOrigin', 'lga', 'religion', 'address', 'phoneNumber', 'email',
  'guardianName', 'guardianAddress', 'guardianOccupation', 'guardianRelationship', 'guardianPhoneNumber',
  'schoolName', 'yearOfEntry', 'yearOfGraduation', 'qualificationObtained',
  'firstChoice', 'secondChoice', 'jambRegistrationNumber'
];

export async function GET() {
  console.log("API_DETAILS_GET: Request received");
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      console.error("API_DETAILS_GET: Unauthorized - No session user ID");
      return NextResponse.json({ error: 'Unauthorized: No session found' }, { status: 401 });
    }

    if (session.user.role !== ROLES.APPLICANT) {
      console.error(`API_DETAILS_GET: Forbidden - User role ${session.user.role} is not APPLICANT`);
      return NextResponse.json({ error: 'Forbidden: User is not an applicant' }, { status: 403 });
    }

    const applicantUserId = session.user.id;
    console.log(`API_DETAILS_GET: Fetching application for user ID: ${applicantUserId}`);

    const { data: applications, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', applicantUserId)
      .order('updated_at', { ascending: false });

    if (fetchError) {
      console.error('API_DETAILS_GET: Supabase error fetching applications list:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch application data', details: fetchError.message }, { status: 500 });
    }

    if (!applications || applications.length === 0) {
      console.log(`API_DETAILS_GET: No application found for user ID: ${applicantUserId}`);
      return NextResponse.json({ message: 'No application found for this user.' }, { status: 404 });
    }
    
    const applicationToReturn = applications[0];

    if (applications.length > 1) {
        console.warn(`API_DETAILS_GET: Multiple applications (${applications.length}) found for user ${applicantUserId}. Returning ID: ${applicationToReturn.id}. Consider data cleanup.`);
    }
    
    console.log(`API_DETAILS_GET: Application found for user ID: ${applicantUserId}, ID: ${applicationToReturn.id}.`);
    // console.log(`API_DETAILS_GET: Data:`, JSON.stringify(applicationToReturn)); // Uncomment for deep debug
    return NextResponse.json(applicationToReturn, { status: 200 });

  } catch (error: any) {
    console.error('API_DETAILS_GET: General error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log("API_DETAILS_POST: Request received");
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id || !session.user.email) {
      console.error("API_DETAILS_POST: Unauthorized - No session user ID or email");
      return NextResponse.json({ error: 'Unauthorized: No session found or missing user ID' }, { status: 401 });
    }

    if (session.user.role !== ROLES.APPLICANT) {
      console.error(`API_DETAILS_POST: Forbidden - User role ${session.user.role} is not APPLICANT`);
      return NextResponse.json({ error: 'Forbidden: User is not an applicant' }, { status: 403 });
    }

    const applicantUserId = session.user.id;
    const body = await request.json();
    console.log("API_DETAILS_POST: Request body keys:", Object.keys(body));

    const missingTextFields = [];
    for (const field of requiredApplicationTextFields) {
        if (!getStringFromBody(body, field)) {
            missingTextFields.push(field);
        }
    }
    
    if (missingTextFields.length > 0) {
      console.error(`API_DETAILS_POST: Missing required fields: ${missingTextFields.join(', ')}`);
      return NextResponse.json(
        { error: `Missing required text fields: ${missingTextFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    const applicationData = {
      user_id: applicantUserId,
      surname: getStringFromBody(body, 'surname')!,
      first_name: getStringFromBody(body, 'firstName')!,
      middle_name: getStringFromBody(body, 'middleName') || null,
      gender: getStringFromBody(body, 'gender')!,
      date_of_birth: getStringFromBody(body, 'dateOfBirth')!,
      marital_status: getStringFromBody(body, 'maritalStatus')!,
      state_of_origin: getStringFromBody(body, 'stateOfOrigin')!,
      lga: getStringFromBody(body, 'lga')!,
      religion: getStringFromBody(body, 'religion')!,
      address: getStringFromBody(body, 'address')!,
      phone_number: getStringFromBody(body, 'phoneNumber')!,
      email: getStringFromBody(body, 'email')!, 
      disability: getStringFromBody(body, 'disability') || null,
      health_challenge: getStringFromBody(body, 'healthChallenge') || null,
      guardian_name: getStringFromBody(body, 'guardianName')!,
      guardian_address: getStringFromBody(body, 'guardianAddress')!,
      guardian_occupation: getStringFromBody(body, 'guardianOccupation')!,
      guardian_relationship: getStringFromBody(body, 'guardianRelationship')!,
      guardian_phone_number: getStringFromBody(body, 'guardianPhoneNumber')!,
      school_name: getStringFromBody(body, 'schoolName')!,
      year_of_entry: body.yearOfEntry ? parseInt(body.yearOfEntry.toString(), 10) : null,
      year_of_graduation: body.yearOfGraduation ? parseInt(body.yearOfGraduation.toString(), 10) : null,
      qualification_obtained: getStringFromBody(body, 'qualificationObtained')!,
      first_choice: getStringFromBody(body, 'firstChoice')!,
      second_choice: getStringFromBody(body, 'secondChoice')!,
      jamb_registration_number: getStringFromBody(body, 'jambRegistrationNumber')!,
    };

    let savedApplicationId: string;
    let operation: 'inserted' | 'updated';
    let applicationIdToActUpon = body.applicationId || null;

    if (!applicationIdToActUpon) {
      const { data: existingApp, error: checkErr } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', applicantUserId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (checkErr) {
        console.warn("API_DETAILS_POST: Error checking for existing app on insert attempt:", checkErr.message);
      }
      if (existingApp) {
        applicationIdToActUpon = existingApp.id;
        console.log(`API_DETAILS_POST: No applicationId in body, but found existing app ID ${existingApp.id} for user. Will update.`);
      }
    }

    if (applicationIdToActUpon) {
      console.log(`API_DETAILS_POST: Updating application ID: ${applicationIdToActUpon}`);
      const updatePayload = { ...applicationData, updated_at: new Date().toISOString() }; // Explicitly set updated_at
      // delete (updatePayload as any).status; // Example: Don't change status on typical update unless intended

      const { data: updatedApplication, error: updateError } = await supabase
        .from('applications')
        .update(updatePayload)
        .eq('id', applicationIdToActUpon)
        .eq('user_id', applicantUserId)
        .select('id')
        .single();

      if (updateError || !updatedApplication) {
        console.error('API_DETAILS_POST: Supabase application update error:', updateError);
        return NextResponse.json({ error: 'Failed to update application data', details: updateError.message }, { status: 500 });
      }
      savedApplicationId = updatedApplication.id;
      operation = 'updated';
      console.log(`API_DETAILS_POST: Application updated. ID: ${savedApplicationId}`);
    } else {
      console.log(`API_DETAILS_POST: Inserting new application for user ID: ${applicantUserId}`);
      const insertPayload = { ...applicationData, status: 'DRAFT' }; // Set initial status

      const { data: insertedApplication, error: insertError } = await supabase
        .from('applications')
        .insert(insertPayload)
        .select('id')
        .single();

      if (insertError || !insertedApplication) {
        console.error('API_DETAILS_POST: Supabase application insert error:', insertError);
        if (insertError.message.includes("duplicate key value violates unique constraint")) {
            return NextResponse.json({ error: 'A unique constraint was violated. This might be a duplicate entry.', details: insertError.message }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to save application data', details: insertError.message }, { status: 500 });
      }
      savedApplicationId = insertedApplication.id;
      operation = 'inserted';
      console.log(`API_DETAILS_POST: Application inserted. ID: ${savedApplicationId}`);
    }

    return NextResponse.json({ 
      message: `Application details ${operation} successfully!`, 
      applicationId: savedApplicationId 
    }, { status: operation === 'inserted' ? 201 : 200 });

  } catch (error: any) { // Corrected: error parameter typed as 'any' or 'unknown'
    console.error('API_DETAILS_POST: General error:', error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ error: 'Invalid JSON in request body', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  } // Corrected: Added missing closing brace for the 'try' block
} // Corrected: Closing brace for 'export async function POST'