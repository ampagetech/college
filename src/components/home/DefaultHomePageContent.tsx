// src/components/home/DefaultHomePageContent.tsx
'use client';

import Link from 'next/link';
import { Session } from 'next-auth';
import { PATHS, ROLES } from '@/lib/constants';

interface DefaultHomePageProps {
  session: Session | null;
}

/**
 * A helper function to get the correct dashboard path based on the user's role.
 * FIX: Replaced non-existent PATHS properties with valid paths. The compiler
 * error indicated that `PATHS.ADMIN_DASHBOARD` etc., were not defined.
 */
const getDashboardPath = (role: string | undefined): string => {
  switch (role) {
    case ROLES.ADMIN:
      // Using a sensible default path as the constant was missing.
      return '/admin';
    case ROLES.TEACHER:
      // Using a sensible default path as the constant was missing.
      return '/teacher';
    case ROLES.STUDENT:
      // Using a sensible default path as the constant was missing.
      return '/student';
    case ROLES.APPLICANT:
      // Using the existing BIO_DATA path, as it's the primary destination for applicants.
      return PATHS.BIO_DATA;
    default:
      return PATHS.HOME;
  }
};

export default function DefaultHomePageContent({ session }: DefaultHomePageProps): React.JSX.Element {

  // --- ROBUST NAME HANDLING ---
  // This function prevents the "Admin Admin LastNm" display issue.
  // It splits the name and removes duplicates before joining.
  const formatUserName = (name: string | null | undefined): string | null => {
    if (!name) return null;
    const parts = name.split(' ');
    const uniqueParts = [...new Set(parts)]; // Creates an array with unique parts
    return uniqueParts.join(' ');
  };

  const userName = formatUserName(session?.user.name);
  const userRole = session?.user.role;
  const dashboardPath = getDashboardPath(userRole);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Welcome to Jewel University Portal</h1>

      {session ? (
        // --- VIEW FOR LOGGED-IN USERS ---
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">
            {/* Use the cleaned user name */}
            Hello, {userName || session.user.email}!
          </h2>
          <p className="text-gray-600 mb-4">
            You are logged in as: <span className="font-medium capitalize text-blue-700">{userRole}</span>
          </p>
          <div className="flex items-center gap-4">
            <p className="flex-grow">Use the sidebar navigation to access your tools and resources.</p>
            {dashboardPath !== PATHS.HOME && (
              <Link
                href={dashboardPath}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition-colors whitespace-nowrap"
              >
                Go to My Dashboard
              </Link>
            )}
          </div>
        </div>
      ) : (
        // --- VIEW FOR GUESTS ---
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Access Your Portal</h2>
          <p className="text-gray-600 mb-4">
            Please sign in to access the full features of Jewel University's online services.
          </p>
          <div className="flex gap-4">
            <Link
              href={PATHS.SIGNIN}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Sign In
            </Link>
            <Link
              href={PATHS.REGISTER}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              Register
            </Link>
          </div>
        </div>
      )}

      {/* --- General Information Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-2">Admin Dashboard</h3>
          <p className="text-gray-600 mb-3 text-sm flex-grow">Manage users, system settings, and oversee university operations.</p>
          <p className="text-xs text-gray-500 mt-auto">Role required: Admin</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-2">Academic Area</h3>
          <p className="text-gray-600 mb-3 text-sm flex-grow">Access tools to manage courses, interact with students, and post learning materials.</p>
          <p className="text-xs text-gray-500 mt-auto">Role required: Teacher</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-2">Student Portal</h3>
          <p className="text-gray-600 mb-3 text-sm flex-grow">View courses, grades, university announcements, and access student services.</p>
          <p className="text-xs text-gray-500 mt-auto">Role required: Student</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-2">Applicant Gateway</h3>
          <p className="text-gray-600 mb-3 text-sm flex-grow">Complete your bio-data, upload documents, and track your application status.</p>
          <p className="text-xs text-gray-500 mt-auto">Role required: Applicant</p>
        </div>
      </div>
    </div>
  );
}