// src/app/(dashboard)/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ROLES, PATHS } from '@/lib/constants';
import { UserRole } from '@/types/next-auth';
import React from 'react'; // Import React for React.ElementType

// Dashboard component imports
import ApplicantDashboard from '@/components/dashboards/ApplicantDashboard';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import LecturerDashboard from '@/components/dashboards/LecturerDashboard';

// Role-to-component mapping
// FIX: Use Partial to make properties optional. This allows for a fallback.
const roleComponents: Partial<Record<UserRole, React.ElementType>> = {
  [ROLES.APPLICANT]: ApplicantDashboard,
  [ROLES.STUDENT]: StudentDashboard,
  [ROLES.ADMIN]: AdminDashboard,
  [ROLES.TEACHER]: LecturerDashboard,
  // 'public' is now allowed to be missing from this list.
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(PATHS.SIGNIN);
  }

  // If a user has a role not in roleComponents (like 'public'), it will be undefined
  const userRole = session.user.role || ROLES.APPLICANT;
  
  // The fallback logic now correctly handles any missing roles
  const DashboardComponent = roleComponents[userRole] || ApplicantDashboard;

  return <DashboardComponent user={session.user} />;
}