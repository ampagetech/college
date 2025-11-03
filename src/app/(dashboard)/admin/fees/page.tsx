// src/app/(dashboard)/admin/fees/page.tsx
"use client";

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  FaPlus,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';
import { PATHS } from '@/lib/constants';
import AdminFeesTable from '@/components/admin/fees/AdminFeesTable';
import ManageFeeModal from '@/components/admin/fees/ManageFeeModal';
// --- MODIFIED: Import actions and Fee type directly from actions.ts ---
import { getFees, deleteFee, Fee } from './actions';

export default function AdminFeesPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [fees, setFees] = useState<Fee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const [isManageFeeModalOpen, setIsManageFeeModalOpen] = useState(false);
  const [feeToEdit, setFeeToEdit] = useState<Fee | null>(null);

  // --- MODIFIED: fetchFees now uses the getFees server action ---
  const fetchFees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // Directly call the server action
    const { data, error: fetchError } = await getFees({ includeInactive });
    
    if (fetchError) {
      console.error('Error fetching fees:', fetchError);
      setError(fetchError);
      setFees([]);
    } else {
      setFees(data || []);
    }
    
    setIsLoading(false);
  }, [includeInactive]);

  // Initial load and session check
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session?.user) {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      redirect(PATHS.SIGNIN + `?callbackUrl=${callbackUrl}`);
      return;
    }

    if (sessionStatus === 'authenticated') {
      fetchFees();
    }
  }, [sessionStatus, session, fetchFees]);

  // Refetch when the 'includeInactive' checkbox changes
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchFees();
    }
  }, [includeInactive, sessionStatus, fetchFees]);

  const handleOpenAddFeeModal = useCallback(() => {
    setFeeToEdit(null);
    setIsManageFeeModalOpen(true);
    setSuccessMessage(null);
    setError(null);
  }, []);

  const handleOpenEditFeeModal = useCallback((fee: Fee) => {
    setFeeToEdit(fee);
    setIsManageFeeModalOpen(true);
    setSuccessMessage(null);
    setError(null);
  }, []);

  const handleCloseManageFeeModal = useCallback(() => {
    setIsManageFeeModalOpen(false);
    setFeeToEdit(null);
  }, []);

  const handleFeeSubmitSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    fetchFees(); // Re-fetch data to show the latest changes
    setIsManageFeeModalOpen(false);
    setFeeToEdit(null);
    const timer = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [fetchFees]);

  // --- MODIFIED: handleDeleteFee now uses the deleteFee server action ---
  const handleDeleteFee = useCallback(async (feeId: string) => {
    if (!confirm('Are you sure you want to delete this fee? This action cannot be undone.')) {
      return;
    }
    setError(null);
    setSuccessMessage(null);

    // Directly call the server action
    const result = await deleteFee(feeId);

    if (result.success) {
      setSuccessMessage(result.message);
      // Re-fetch fees to update the table
      await fetchFees();
    } else {
      setError(result.message);
    }
    
    const timer = setTimeout(() => { setSuccessMessage(null); setError(null); }, 5000);
    return () => clearTimeout(timer);
  }, [fetchFees]);

  const handleRetryFetch = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    fetchFees();
  }, [fetchFees]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
        <p className="ml-3 text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
            Manage Fees
          </h1>
          <p className="text-gray-600 mt-1">Configure payment types and amounts</p>
        </div>
        <button
          onClick={handleOpenAddFeeModal}
          className="px-4 sm:px-6 py-2.5 sm:py-3 text-white font-semibold rounded-md focus:outline-none flex items-center justify-center text-sm sm:text-base shadow-sm hover:shadow-md transition-shadow bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          <FaPlus className="mr-1.5 sm:mr-2" /> New Fee
        </button>
      </header>

      {successMessage && (
        <div className="bg-green-50 border-green-500 text-green-700 border-l-4 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 text-xl mr-3" />
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-red-500 text-red-700 border-l-4 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 text-xl mr-3" />
            <div>
              <p>{error}</p>
              <button
                onClick={handleRetryFetch}
                disabled={isLoading}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50"
              >
                {isLoading ? 'Retrying...' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show inactive fees</span>
        </label>
      </div>

      <AdminFeesTable
        data={fees}
        onEditFee={handleOpenEditFeeModal}
        onDeleteFee={handleDeleteFee}
        isLoading={isLoading}
      />

      {isManageFeeModalOpen && (
        <ManageFeeModal
          isOpen={isManageFeeModalOpen}
          onClose={handleCloseManageFeeModal}
          onSubmitSuccess={handleFeeSubmitSuccess}
          feeData={feeToEdit}
        />
      )}
    </div>
  );
}