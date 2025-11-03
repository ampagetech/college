// src/app/api/applications/bio-data/[applicationId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ROLES } from '@/lib/constants';

// GET /api/applications/bio-data/[applicationId] - Fetch a specific application
export async function GET(
  _request: Request, // Use underscore to mark as intentionally unused
  { params }: { params: { applicationId: string } }
) {
  console.log("BIO_DATA_INDIVIDUAL_GET: Request received");
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id || session.user.role !== ROLES.APPLICANT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = params;
    const applicantUserId = session.user.id;

    console.log(`Fetching bio data for app ID: ${applicationId}, user ID: ${applicantUserId}`);

    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', applicantUserId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Bio data not found or access denied' }, { status: 404 });
      }
      throw fetchError;
    }
    
    return NextResponse.json(application, { status: 200 });

  } catch (error: any) {
    console.error('BIO_DATA_INDIVIDUAL_GET Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}


// PUT /api/applications/bio-data/[applicationId] - Update an existing application
export async function PUT(
  request: Request, // 'request' is used here to get the body
  { params }: { params: { applicationId: string } }
) {
  console.log("BIO_DATA_INDIVIDUAL_PUT: Request received");

  try {
    const session = await getServerSession(authOptions);
    const { applicationId } = params;

    if (!session?.user.id || session.user.role !== ROLES.APPLICANT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const keyMap: { [key: string]: string } = {
      firstName: 'first_name', middleName: 'middle_name', dateOfBirth: 'date_of_birth',
      maritalStatus: 'marital_status', stateOfOrigin: 'state_of_origin', phoneNumber: 'phone_number',
      healthChallenge: 'health_challenge', guardianName: 'guardian_name', guardianAddress: 'guardian_address',
      guardianOccupation: 'guardian_occupation', guardianRelationship: 'guardian_relationship',
      guardianPhoneNumber: 'guardian_phone_number', schoolName: 'school_name', yearOfEntry: 'year_of_entry',
      yearOfGraduation: 'year_of_graduation', qualificationObtained: 'qualification_obtained',
      firstChoice: 'first_choice', secondChoice: 'second_choice', jambRegistrationNumber: 'jamb_registration_number'
    };

    const dataToUpdate: { [key: string]: any } = {};

    for (const camelCaseKey in body) {
      if (Object.prototype.hasOwnProperty.call(body, camelCaseKey)) {
        const snakeCaseKey = keyMap[camelCaseKey] || camelCaseKey;
        if (camelCaseKey === 'yearOfEntry' || camelCaseKey === 'yearOfGraduation') {
            const value = body[camelCaseKey];
            dataToUpdate[snakeCaseKey] = value ? parseInt(value.toString(), 10) : null;
        } else {
            dataToUpdate[snakeCaseKey] = body[camelCaseKey];
        }
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: 'No valid data provided to update.' }, { status: 200 });
    }

    const { data: updatedApp, error: updateError } = await supabase
      .from('applications')
      .update(dataToUpdate)
      .eq('id', applicationId)
      .eq('user_id', session.user.id)
      .select('id')
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ message: 'Bio data updated successfully!', applicationId: updatedApp.id }, { status: 200 });

  } catch (error: any) {
    console.error('BIO_DATA_INDIVIDUAL_PUT Error:', error);
    if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Application not found or access denied.' }, { status: 404 });
    }
    if (error.code === '42703') { // Column does not exist
        return NextResponse.json({ error: `Database column error: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}


// DELETE /api/applications/bio-data/[applicationId] - Delete a specific application
export async function DELETE(
  _request: Request, // Use underscore to mark as intentionally unused
  { params }: { params: { applicationId: string } }
) {
  console.log("BIO_DATA_INDIVIDUAL_DELETE: Request received");
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id || session.user.role !== ROLES.APPLICANT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = params;
    const applicantUserId = session.user.id;
    
    // First, verify ownership and status before deleting
    const { data: existingApp, error: checkError } = await supabase
      .from('applications')
      .select('status')
      .eq('id', applicationId)
      .eq('user_id', applicantUserId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Application not found or access denied' }, { status: 404 });
      }
      throw checkError;
    }

    if (existingApp.status === 'SUBMITTED') {
      return NextResponse.json({ error: 'Cannot delete a submitted application' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)
      .eq('user_id', applicantUserId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: 'Bio data deleted successfully!' }, { status: 200 });

  } catch (error: any) {
    console.error('BIO_DATA_INDIVIDUAL_DELETE Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}