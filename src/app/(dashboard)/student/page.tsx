'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { FaBookOpen, FaClipboardCheck, FaChartLine } from 'react-icons/fa';
import { useEffect } from 'react';
import { ROLES, PATHS } from '@/lib/constants'; // Added import for ROLES and PATHS

export default function StudentPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = session.user.role;
      // Allow access if the user role is student, teacher, or admin.
      // Redirect to unauthorized if the role is not one of these.
      if (
        userRole !== ROLES.STUDENT &&
        userRole !== ROLES.TEACHER &&
        userRole !== ROLES.ADMIN
      ) {
        redirect(PATHS.UNAUTHORIZED); // Use PATHS constant for the path
      }
    }
    // The 'unauthenticated' status is handled below, which will redirect to signin.
  }, [session, status]);

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    // Assuming PATHS.SIGN_IN is defined, otherwise '/auth/signin' is fine.
    // For consistency with TeacherPage potentially using PATHS, let's check if '/auth/signin' is in PATHS
    // If PATHS.SIGN_IN exists, use it. Otherwise, keep the hardcoded path.
    // For this example, I'll keep '/auth/signin' as it was originally.
    redirect('/auth/signin');
  }
  
  // If the user is authenticated and has one of the allowed roles,
  // or if the session is still loading (covered by the loading check),
  // the component will render.
  // Note: If session is null even if status is 'authenticated' (should not happen with proper setup),
  // session?.user?.role would be undefined, leading to a redirect by the useEffect logic.

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Student Portal</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <FaBookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">My Courses</h2>
            <p className="text-gray-600">Access your enrolled courses</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md flex items-start gap-4">
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <FaClipboardCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Assignments</h2>
            <p className="text-gray-600">View and submit your assignments</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md flex items-start gap-4">
          <div className="bg-orange-100 p-3 rounded-full text-orange-600">
            <FaChartLine size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Progress</h2>
            <p className="text-gray-600">Track your learning progress</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <p className="text-gray-500 italic">No recent activity to display.</p>
      </div>
    </div>
  );
}