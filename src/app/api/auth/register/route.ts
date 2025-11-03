// src/app/api/auth/register/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ROLES } from '@/lib/constants'; // Make sure ROLES.APPLICANT is defined here

// Optional: Define UserStatus enum if you haven't already, for better type safety
// enum UserStatus {
//   PENDING = 'pending', // Lowercase value
//   ACTIVE = 'active',
//   // ... other statuses
// }

export async function POST(request: Request) {
  try {
    const { email, password, name, role } = await request.json();

    // --- Basic Input Check ---
    if (!email || !password || !name || !role) {
        return NextResponse.json(
            { error: 'Missing required fields (email, password, name, role).' },
            { status: 400 }
        );
    }

    const supabase = createRouteHandlerClient({ cookies });

    const normalizedEmail = email.toLowerCase().trim();
    const mobileAsPassword = password.toString().replace(/\s+/g, ''); // Clean mobile number
    const receivedRole = role.toLowerCase().trim();

    // --- Backend Mobile Number Validation ---
    const mobileRegex = /^0[0-9]{10}$/; // Must start with 0, followed by 10 digits
    if (!mobileRegex.test(mobileAsPassword)) {
      return NextResponse.json(
        {
          error:
            'Invalid mobile number format for password. Must be 11 digits starting with 0.',
        },
        { status: 400 }
      );
    }

    // --- Updated Role Validation/Normalization ---
    let normalizedRole;
    switch (receivedRole) {
      case ROLES.ADMIN: // Assumes ROLES consts are lowercase strings
        normalizedRole = ROLES.ADMIN;
        break;
      case ROLES.TEACHER:
        normalizedRole = ROLES.TEACHER;
        break;
      case ROLES.STUDENT:
        normalizedRole = ROLES.STUDENT;
        break;
      case ROLES.APPLICANT: // Explicitly handle applicant
        normalizedRole = ROLES.APPLICANT;
        break;
      default:
         return NextResponse.json(
             { error: `Invalid role specified: ${receivedRole}` },
             { status: 400 }
         );
    }

    // Check if user with this email already exists in your custom 'users' table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users') // Ensure 'users' is your correct table name
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userCheckError && userCheckError.code !== 'PGRST116') { // PGRST116: no rows found (expected for new user)
      console.error('Error checking existing user:', userCheckError);
      return NextResponse.json(
        { error: 'Database error checking user existence.' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            'Email already registered. Please use a different email address or sign in.',
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Create the Supabase Auth user (handles password hashing)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: mobileAsPassword, // Pass the validated mobile number as password
    });

    if (authError) {
      console.error('Supabase Auth signup error:', authError.message);
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          {
            error:
              'Email already registered with authentication provider. Please sign in.',
          },
          { status: 409 }
        );
      }
      if (authError.message.toLowerCase().includes('password should be')) {
           return NextResponse.json(
             { error: `Registration failed: ${authError.message}. Ensure mobile number meets password length rules.` },
             { status: 400 }
           );
      }
      return NextResponse.json(
        { error: 'Authentication service failed: ' + authError.message },
        { status: 500 } 
      );
    }

     if (!authData || !authData.user) {
       console.error('Supabase Auth signup did not return user data.');
       return NextResponse.json(
         { error: 'Authentication succeeded but failed to get user details.' },
         { status: 500 }
       );
     }

    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');

    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id, 
      email: normalizedEmail,
      first_name: firstName || '', 
      last_name: lastName || '',
      role: normalizedRole, 
      // --- THIS IS THE CORRECTED LINE ---
      status: 'pending', // Changed 'Pending' to 'pending' (lowercase)
      // Example if using an enum: status: UserStatus.PENDING, 
      // --- END OF CORRECTION ---
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      console.warn(`User ${authData.user.id} created in auth, but profile insertion failed. Manual cleanup may be needed.`);
      return NextResponse.json(
        {
          error:
            'Account authenticated but profile creation failed: ' +
            profileError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Registration successful. Please check your email to verify.' }, 
      { status: 201 } 
    );

  } catch (error) {
    console.error('Unhandled Registration error:', error);
    let errorMessage = 'An unexpected error occurred during registration.';
    if (error instanceof Error) { // Get more specific error message if possible
        errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}