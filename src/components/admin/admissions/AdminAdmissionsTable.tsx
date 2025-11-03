'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useTransition } from 'react';
import { getAdmissions, type GetAdmissionsResponse, type AdmissionWithRelations } from '@/app/(dashboard)/admin/admissions/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils';
import AdminAdmissionActions from './AdminAdmissionActions';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { toast } from 'sonner';
import type { AdmissionStatusType } from '@/lib/constants'; // <-- 1. IMPORT THE TYPE

interface AdminAdmissionsTableProps {
  page: number;
  limit: number;
  status: string;
  courseId: string;
  sessionId: string;
  searchTerm: string;
}

type AdmissionsData = {
    admissions: AdmissionWithRelations[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
};

const AdminAdmissionsTable: React.FC<AdminAdmissionsTableProps> = ({
  page,
  limit,
  status,
  courseId,
  sessionId,
  searchTerm,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<AdmissionsData | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchAdmissions = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getAdmissions(page, limit, searchTerm, status);
        if ('error' in result) {
          toast.error('Failed to load admissions', { description: result.error });
          setData(null);
        } else {
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching admissions:', error);
        toast.error('An unexpected error occurred while fetching data.');
        setData(null);
      }
    });
  }, [page, limit, searchTerm, status]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  const handlePageChange = (newPage: number): void => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('page', String(newPage));
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  if (isPending && !data) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded w-full animate-pulse"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!data || !data.admissions) {
    return <div className="text-gray-600 p-4 border rounded-md text-center">No admissions found or an error occurred.</div>;
  }
  
  const { admissions, totalCount, currentPage, totalPages } = data;

  return (
    <>
      <div className={`overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref Number</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Admission Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admissions.map((admission) => (
              <TableRow key={admission.id}>
                <TableCell className="font-medium">{admission.admission_ref}</TableCell>
                <TableCell>{`${admission.user?.first_name || ''} ${admission.user?.last_name || ''}`.trim()}</TableCell>
                <TableCell>{admission.course?.name || 'N/A'}</TableCell>
                <TableCell>{admission.academic_session?.session_name || 'N/A'}</TableCell>
                <TableCell>{admission.admission_date ? formatDate(admission.admission_date) : 'N/A'}</TableCell>
                <TableCell>
                  <StatusBadge status={admission.status as AdmissionStatusType} type="admission" />
                </TableCell>
                <TableCell className="text-right">
                  <AdminAdmissionActions
                    admissionId={admission.id}
                    admissionRef={admission.admission_ref}
                    // <-- 2. CAST THE TYPE HERE
                    currentStatus={admission.status as AdmissionStatusType}
                    onDeleted={fetchAdmissions}
                    onUpdated={fetchAdmissions}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Code ... */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
            <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage > 1) handlePageChange(currentPage - 1); }}
                  aria-disabled={currentPage <= 1}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                if (
                  totalPages <= 7 ||
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(pageNum); }}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  (pageNum === currentPage - 2) ||
                  (pageNum === currentPage + 2)
                ) {
                  return <PaginationItem key={pageNum}><PaginationEllipsis /></PaginationItem>;
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) handlePageChange(currentPage + 1); }}
                  aria-disabled={currentPage >= totalPages}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      <div className="text-sm text-gray-500 mt-2 text-center">
        Page {currentPage} of {totalPages} ({totalCount} records)
      </div>
    </>
  );
};

export default AdminAdmissionsTable;