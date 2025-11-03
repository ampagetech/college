// C:\DevWeb\jewel-univ-apply\src\app\(dashboard)\admin\admissions\page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path if needed
import { ROLES, PATHS } from '@/lib/constants'; // Ensure PATHS.ADMIN_ADMISSIONS_CREATE exists or adjust
import AdminAdmissionsTable from '@/components/admin/admissions/AdminAdmissionsTable'; // We'll create this
import AdminAdmissionsFilters from '@/components/admin/admissions/AdminAdmissionsFilters'; // We'll create this
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

// Define a type for search parameters for better type safety
interface AdminAdmissionsPageProps {
  searchParams?: {
    page?: string;
    limit?: string;
    status?: string;
    courseId?: string;
    sessionId?: string;
    searchTerm?: string;
  };
}

export default async function AdminManageAdmissionsPage({ searchParams }: AdminAdmissionsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(PATHS.SIGNIN);
  }
  if (session.user.role !== ROLES.ADMIN) {
    redirect(PATHS.UNAUTHORIZED);
  }

  // Parse searchParams safely
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const currentLimit = parseInt(searchParams?.limit || '10', 10);
  const currentStatus = searchParams?.status || '';
  const currentCourseId = searchParams?.courseId || '';
  const currentSessionId = searchParams?.sessionId || '';
  const currentSearchTerm = searchParams?.searchTerm || '';


  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Manage Admissions</CardTitle>
              <CardDescription>
                View, create, and manage student admission records.
              </CardDescription>
            </div>
            <Link href={`${PATHS.ADMIN_ADMISSIONS}/create`}> {/* Corrected path */}
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Admission
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters will update searchParams, re-rendering the page & AdminAdmissionsTable */}
          <Suspense fallback={<FiltersLoading />}>
             <AdminAdmissionsFilters
                initialFilters={{
                    status: currentStatus,
                    courseId: currentCourseId,
                    sessionId: currentSessionId,
                    searchTerm: currentSearchTerm,
                }}
             />
          </Suspense>

          <div className="mt-6">
            <Suspense fallback={<TableLoadingSkeleton />}>
              <AdminAdmissionsTable
                page={currentPage}
                limit={currentLimit}
                status={currentStatus}
                courseId={currentCourseId}
                sessionId={currentSessionId}
                searchTerm={currentSearchTerm}
              />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const FiltersLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
        ))}
    </div>
);

const TableLoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="h-12 bg-gray-200 rounded w-full animate-pulse"></div> {/* Header row */}
    {[...Array(5)].map((_, i) => ( // 5 skeleton data rows
      <div key={i} className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
    ))}
    <div className="flex justify-between items-center mt-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
    </div>
  </div>
);