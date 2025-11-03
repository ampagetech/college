// C:\DevWeb\jewel-univ-apply\src\app\(dashboard)\admin\documents\page.tsx

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import ApplicantsForReviewTable from '@/components/admin/documents/ApplicantsForReviewTable';
import AdminDocumentsFilters from '@/components/admin/documents/AdminDocumentsFilters';
import ApplicantDocumentReviewModal from '@/components/admin/documents/ApplicantDocumentReviewModal';
import { getApplicantsForReview } from './actions/documentActions';
import { FaSpinner } from 'react-icons/fa';
import { PATHS } from '@/lib/constants';
import { AdminDocumentsFiltersType, AdminApplicantData, SortableAdminApplicantKeys, ViewCategory } from '@/types/document';

// --- THE CORRECT AND FINAL IMPORT ---
// We import the types (Faculty, Course) directly from the actions file
// where they are defined and exported, along with the functions that use them.
import { getFaculties, getCourses, type Faculty, type Course } from '@/app/(dashboard)/applications/bio-data/actions';


export default function AdminDocumentsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [applicants, setApplicants] = useState<AdminApplicantData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewCategory, setViewCategory] = useState<ViewCategory>('status');
  
  // These states now correctly use the Faculty and Course types from actions.ts
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [currentFilters, setCurrentFilters] = useState<Partial<AdminDocumentsFiltersType>>({ applicantSearch: '', dateFrom: '', dateTo: '', status: '', document_type: '', applicationIdSearch: '', courseSearch: '' });
  const [sortConfig, setSortConfig] = useState<{ key: SortableAdminApplicantKeys; direction: 'asc' | 'desc'; } | null>({ key: 'application_created_at', direction: 'desc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [facs, crss] = await Promise.all([getFaculties(), getCourses()]);
        // This now works perfectly because the type of `facs` matches the expected type for `setFaculties`.
        setFaculties(facs);
        setCourses(crss);
      } catch (e) {
        console.error("Failed to fetch faculties/courses for admin modal", e);
      }
    };
    fetchDropdownData();
  }, []);

  const fetchApplicants = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getApplicantsForReview({ page, limit: 10, sortConfig, filters: currentFilters, viewCategory });
      if (result.success && result.applicants) {
        const transformedApplicants = result.applicants.map(applicant => ({
            ...applicant,
            year_of_entry: applicant.year_of_entry ? parseInt(String(applicant.year_of_entry), 10) : undefined,
            year_of_graduation: applicant.year_of_graduation ? parseInt(String(applicant.year_of_graduation), 10) : undefined,
            doc_status: applicant.doc_status === null ? undefined : applicant.doc_status,
        }));
        setApplicants(transformedApplicants);
        setPage(result.page!); setTotalPages(result.totalPages!); setTotal(result.total!); setHasFetched(true);
      } else { throw new Error(result.error || 'Failed to fetch applicants'); }
    } catch (err: any) {
      console.error('Error fetching applicants:', err);
      setError(err.message || 'Failed to load applicants');
      setApplicants([]); setTotalPages(1); setTotal(0);
    } finally { setIsLoading(false); }
  }, [page, sortConfig, currentFilters, viewCategory, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') { redirect(PATHS.SIGNIN + `?callbackUrl=${encodeURIComponent(window.location.pathname)}`); return; }
    if (session && (session.user as any).role !== 'admin') { redirect('/unauthorized'); return; }
    fetchApplicants();
  }, [sessionStatus, page, sortConfig, currentFilters, refreshTrigger, viewCategory, fetchApplicants, session]);

  const handleFilterChange = (newFilterValues: Partial<AdminDocumentsFiltersType>) => { setCurrentFilters((prev) => ({ ...prev, ...newFilterValues, })); setPage(1); };
  const handleCategoryChange = (category: ViewCategory) => { setViewCategory(category); setPage(1); };
  const handleSortChange = (key: SortableAdminApplicantKeys) => { setSortConfig((prev) => ({ key, direction: (prev?.key === key && prev.direction === 'asc') ? 'desc' : 'asc' })); setPage(1); };
  const handlePageChange = (newPage: number) => { setPage(newPage); };
  const handleActionClick = (applicant: AdminApplicantData) => { if (!applicant.application_id) { console.error('Missing application_id:', applicant); alert('Error: Missing Application ID.'); return; } setSelectedApplicationId(applicant.application_id); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedApplicationId(null); };
  const handleReviewComplete = () => { setRefreshTrigger((prev) => prev + 1); };
  
  if (sessionStatus === 'loading' || (isLoading && !hasFetched)) { return ( <div className="flex justify-center items-center min-h-screen"><FaSpinner className="animate-spin text-blue-600 text-4xl" /><span className="ml-3 text-lg text-gray-700">Loading...</span></div> ); }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6"><h1 className="text-3xl font-bold text-gray-900">Verify Bio-Data and Uploaded Documents</h1><p className="mt-2 text-sm text-gray-600">Check all Applicants Data for Admission Approval.</p></div>
      {error && ( <div className="bg-red-50 border-red-500 text-red-700 border-l-4 p-4 mb-6 rounded-md shadow-sm">{/* Error display */}</div> )}
      <AdminDocumentsFilters filters={currentFilters} onFilterChange={handleFilterChange} viewCategory={viewCategory} onCategoryChange={handleCategoryChange} />
      <div className="bg-white shadow rounded-lg mt-6">
        <ApplicantsForReviewTable applicants={applicants} page={page} totalPages={totalPages} total={total} isLoading={isLoading} error={error} sortConfig={sortConfig} onSortChange={handleSortChange} onPageChange={handlePageChange} actionButtonLabel="Review Application" onActionClick={handleActionClick} viewCategory={viewCategory} />
      </div>
      {selectedApplicationId && (
        <ApplicantDocumentReviewModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          applicationId={selectedApplicationId}
          onReviewComplete={handleReviewComplete}
          faculties={faculties}
          courses={courses}
        />
      )}
    </div>
  );
}