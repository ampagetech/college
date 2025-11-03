// C:\DevWeb\jewel-univ-apply\src\app\(dashboard)\admissions\page.tsx

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import AdminAdmissionsTable from '@/components/admin/admissions/AdminAdmissionsTable';
import { Suspense } from 'react';

// Props for the page, which come from the Next.js URL search parameters
interface AdminAdmissionsPageProps {
  searchParams?: {
    page?: string;
    limit?: string;
    status?: string;
    q?: string; // 'q' is a common query param for search
    courseId?: string;
    sessionId?: string;
  };
}

// Helper function to safely parse numbers with validation
function parsePositiveInt(value: string | undefined, defaultValue: number, min: number = 1, max?: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < min) return defaultValue;
  if (max && parsed > max) return max;
  return parsed;
}

// This is a Server Component that handles authentication and parameter parsing
export default async function AdminAdmissionsPage({ searchParams }: AdminAdmissionsPageProps) {
  // Check authentication and authorization
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/signin');
  }

  // Check if user has admin privileges
  if (session.user.role !== 'admin') {
    redirect('/dashboard'); // or wherever non-admin users should go
  }

  // Parse search params with default values and validation
  const page = parsePositiveInt(searchParams?.page, 1, 1, 1000);
  const limit = parsePositiveInt(searchParams?.limit, 10, 5, 100);
  const status = searchParams?.status?.trim() || '';
  const searchTerm = searchParams?.q?.trim() || '';
  const courseId = searchParams?.courseId?.trim() || '';
  const sessionId = searchParams?.sessionId?.trim() || '';

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admissions Management</h1>
        <p className="text-muted-foreground">Manage and review student admission applications</p>
      </div>
      
      {/* Suspense with a more detailed loading state */}
      <Suspense fallback={
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admissions data...</p>
        </div>
      }>
        <AdminAdmissionsTable
          page={page}
          limit={limit}
          status={status}
          searchTerm={searchTerm}
          courseId={courseId}
          sessionId={sessionId}
        />
      </Suspense>
    </div>
  );
}