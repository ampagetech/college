// src/app/api/applications/bio-data/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ROLES } from '@/lib/constants';

// Helper function to robustly get string values from the request body
function getStringFromBody(body: any, key: string): string | undefined {
  const value = body[key];
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }
  return value.toString().trim();
}

// Fields required ONLY for the initial creation of the application record.
const initialCreationRequiredFields = [
  'surname', 'firstName', 'gender', 'dateOfBirth', 'maritalStatus', 
  'stateOfOrigin', 'lga', 'religion', 'address', 'phoneNumber', 'email'
];

// POST /api/applications/bio-data - Create a new application draft
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id || session.user.role !== ROLES.APPLICANT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicantUserId = session.user.id;
    const body = await request.json();

    const missingFields = initialCreationRequiredFields.filter(field => !getStringFromBody(body, field));
    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 });
    }

    // Prepare data for insertion. Fields from other steps will be NULL if not provided.
    const bioData = {
      user_id: applicantUserId,
      surname: getStringFromBody(body, 'surname'),
      first_name: getStringFromBody(body, 'firstName'),
      middle_name: getStringFromBody(body, 'middleName') || null,
      gender: getStringFromBody(body, 'gender'),
      date_of_birth: getStringFromBody(body, 'dateOfBirth'),
      marital_status: getStringFromBody(body, 'maritalStatus'),
      state_of_origin: getStringFromBody(body, 'stateOfOrigin'),
      lga: getStringFromBody(body, 'lga'),
      religion: getStringFromBody(body, 'religion'),
      address: getStringFromBody(body, 'address'),
      phone_number: getStringFromBody(body, 'phoneNumber'),
      email: getStringFromBody(body, 'email'),
      disability: getStringFromBody(body, 'disability') || null,
      health_challenge: getStringFromBody(body, 'healthChallenge') || null,
      guardian_name: getStringFromBody(body, 'guardianName') || null,
      guardian_address: getStringFromBody(body, 'guardianAddress') || null,
      guardian_occupation: getStringFromBody(body, 'guardianOccupation') || null,
      guardian_relationship: getStringFromBody(body, 'guardianRelationship') || null,
      guardian_phone_number: getStringFromBody(body, 'guardianPhoneNumber') || null,
      school_name: getStringFromBody(body, 'schoolName') || null,
      year_of_entry: body.yearOfEntry ? parseInt(body.yearOfEntry.toString(), 10) : null,
      year_of_graduation: body.yearOfGraduation ? parseInt(body.yearOfGraduation.toString(), 10) : null,
      qualification_obtained: getStringFromBody(body, 'qualificationObtained') || null,
      first_choice: getStringFromBody(body, 'firstChoice') || null,
      second_choice: getStringFromBody(body, 'secondChoice') || null,
      jamb_registration_number: getStringFromBody(body, 'jambRegistrationNumber') || null,
      status: 'DRAFT' // Default status is now DRAFT
    };

    const { data: insertedApp, error: insertError } = await supabase
      .from('applications')
      .insert(bioData)
      .select('id')
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ message: 'Bio data created successfully!', applicationId: insertedApp.id }, { status: 201 });

  } catch (error: any) {
    console.error('BIO_DATA_POST Error:', error);
    // Handle specific errors like unique constraints if a user retries quickly
    if (error.code === '23505') {
       return NextResponse.json({ error: 'An application for this user already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// You can also include the GET handler from your original file if needed.