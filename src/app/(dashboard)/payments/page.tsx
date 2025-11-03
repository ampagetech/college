// src/app/(dashboard)/payments/page.tsx
"use client";

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { FaPlus, FaSpinner, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { PATHS } from '@/lib/constants';
import { Payment } from '@/types/payment';
import PaymentsTable from '@/components/payments/PaymentsTable';
import AddPaymentModal from '@/components/payments/AddPaymentModal';
import EditPaymentModal from '@/components/payments/EditPaymentModal';
import { useAppStore } from '@/stores/app-store';

// Helper function to format the currency
const formatAsNaira = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0, // No decimals
    maximumFractionDigits: 0, // No decimals
  }).format(amount);
};

export default function PaymentsPage() {
  const { status: sessionStatus } = useSession();
  
  // Get global data and the new calculation function from the store
  const { 
    bankDetails, 
    activeFees, 
    isLoading: isAppLoading, 
    isInitialized,
    calculateTotalCompulsoryDues 
  } = useAppStore();

  // Call the function to get the total amount
  const totalAmountDue = calculateTotalCompulsoryDues();

  // --- Local State for this page ---
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);

  const showAlert = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setSuccessMessage(null); setError(null); setInfoMessage(null);
    if (type === 'success') { setSuccessMessage(message); setTimeout(() => setSuccessMessage(null), 5000); }
    else if (type === 'error') { setError(message); }
    else if (type === 'info') { setInfoMessage(message); setTimeout(() => setInfoMessage(null), 5000); }
  }, []);

  const fetchPayments = useCallback(async () => {
    setIsLoadingPayments(true);
    setError(null);
    try {
      const response = await fetch('/api/payments');
      if (!response.ok) throw new Error(`Failed to fetch payments: ${response.statusText}`);
      const data = await response.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load your payment history.');
    } finally {
      setIsLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") redirect(PATHS.SIGNIN);
    if (sessionStatus === "authenticated") fetchPayments();
  }, [sessionStatus, fetchPayments]);

  const handleNewPaymentClick = useCallback(() => {
    setError(null); setSuccessMessage(null); setInfoMessage(null);
    if (isAppLoading && !isInitialized) {
      showAlert("Application data is still loading. Please wait a moment.", 'info'); return;
    }
    if (activeFees.length === 0) {
      showAlert("No payment types are currently available. Please contact support.", 'error'); return;
    }
    setIsAddPaymentModalOpen(true);
  }, [isAppLoading, isInitialized, activeFees, showAlert]);

  const handleCloseAddPaymentModal = useCallback(() => setIsAddPaymentModalOpen(false), []);
  const handlePaymentSubmitSuccess = useCallback(() => { showAlert("Payment submitted successfully!", "success"); fetchPayments(); setIsAddPaymentModalOpen(false); }, [fetchPayments, showAlert]);
  const handleOpenEditPaymentModal = useCallback((payment: Payment) => { setPaymentToEdit(payment); setIsEditPaymentModalOpen(true); }, []);
  const handleCloseEditPaymentModal = useCallback(() => { setIsEditPaymentModalOpen(false); setPaymentToEdit(null); }, []);
  const handlePaymentUpdateSuccess = useCallback(() => { showAlert("Payment updated successfully!", "success"); fetchPayments(); setIsEditPaymentModalOpen(false); setPaymentToEdit(null); }, [fetchPayments, showAlert]);
  const handleOpenViewPaymentDetails = useCallback((payment: Payment) => { if (!payment.receipt_url) { showAlert("This payment does not have a receipt URL.", 'info'); } else { window.open(payment.receipt_url, '_blank'); } }, [showAlert]);
  const handleRetryFetchPayments = useCallback(() => { fetchPayments(); }, [fetchPayments]);

  if (!isInitialized && isAppLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
        <p className="ml-3 text-lg text-gray-700">Loading essential data...</p>
      </div>
    );
  }

  const isNewPaymentButtonDisabled = (isAppLoading && !isInitialized) || activeFees.length === 0;

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
      {/* Header with prominent New Payment button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-800">My Payments</h1>
        <button 
          onClick={handleNewPaymentClick} 
          disabled={isNewPaymentButtonDisabled} 
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <FaPlus className="text-lg" />
          New Payment
        </button>
      </div>

      {/* Compact Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
        {/* Payment Instructions */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">
            Pay Your Fees into any of these Jewel University Accounts and then come to this page and upload your payment proofs from the table below by clicking New Payment Button
          </p>
          
          {/* Bank Details - Single Line */}
          {isAppLoading && !isInitialized ? (
            <div className="flex items-center text-gray-600">
              <FaSpinner className="animate-spin mr-2 text-xs" />
              <span className="text-xs">Loading banks...</span>
            </div>
          ) : bankDetails.length > 0 ? (
            <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-700 flex flex-wrap items-center gap-2">
                {bankDetails.map((bank, index) => (
                  <span key={bank['Account No']}>
                    <span className="font-semibold">{bank["Bank Name"]}</span>
                    <span className="text-gray-600"> Account No {bank["Account No"]}</span>
                    {index < bankDetails.length - 1 && <span className="text-gray-400 mx-2">or</span>}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-red-600 text-sm">Bank details unavailable</p>
          )}
        </div>

        {/* Individual Fees Breakdown - Separated by Mandatory/Optional */}
        {(!isInitialized && isAppLoading) ? (
          <div className="flex items-center text-gray-600 mb-3">
            <FaSpinner className="animate-spin mr-2 text-xs" />
            <span className="text-xs">Loading fee breakdown...</span>
          </div>
        ) : activeFees.length > 0 ? (
          <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm mb-3">
            {(() => {
              const mandatoryFees = activeFees.filter(fee => !fee.is_optional).sort((a, b) => a.name.localeCompare(b.name));
              const optionalFees = activeFees.filter(fee => fee.is_optional).sort((a, b) => a.name.localeCompare(b.name));
              
              return (
                <>
                  {mandatoryFees.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Mandatory:</p>
                      <div className="flex flex-wrap gap-2">
                        {mandatoryFees.map((fee, index) => (
                          <div key={fee.id} className="flex items-center gap-1 text-xs">
                            <span className="text-gray-700">{fee.name}</span>
                            <span className="font-semibold text-magenta-600">
                              {/* FIX: Check fee.frequency instead of fee.per_semester */}
                              {formatAsNaira(fee.amount * (fee.frequency === 'per_semester' ? 2 : 1))}
                            </span>
                            {index < mandatoryFees.length - 1 && <span className="text-gray-400">•</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {optionalFees.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">Optional:</p>
                      <div className="flex flex-wrap gap-2">
                        {optionalFees.map((fee, index) => (
                          <div key={fee.id} className="flex items-center gap-1 text-xs">
                            <span className="text-gray-700">{fee.name}</span>
                            <span className="font-semibold text-blue-600">
                              {/* FIX: Check fee.frequency instead of fee.per_semester */}
                              {formatAsNaira(fee.amount * (fee.frequency === 'per_semester' ? 2 : 1))}
                            </span>
                            {index < optionalFees.length - 1 && <span className="text-gray-400">•</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : null}
        
        {/* Total Amount - Bottom Line */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Total Fees Excluding Accommodation:</span>
          {(!isInitialized && isAppLoading) ? (
            <FaSpinner className="animate-spin text-blue-600" />
          ) : (
            <span className="text-xl font-bold text-blue-800">
              {formatAsNaira(totalAmountDue)}
            </span>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="bg-green-50 border-green-500 text-green-700 border-l-4 p-3 mb-4 rounded-md shadow-sm flex items-center">
          <FaCheckCircle className="text-green-500 text-lg mr-2 flex-shrink-0" />
          <p className="text-sm">{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-red-500 text-red-700 border-l-4 p-3 mb-4 rounded-md shadow-sm flex items-start">
          <FaExclamationTriangle className="text-red-500 text-lg mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm">{error}</p>
            <button 
              onClick={handleRetryFetchPayments} 
              disabled={isLoadingPayments} 
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50"
            >
              {isLoadingPayments ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      )}
      {infoMessage && (
        <div className="bg-blue-50 border-blue-500 text-blue-700 border-l-4 p-3 mb-4 rounded-md shadow-sm flex items-center">
          <FaExclamationTriangle className="text-blue-500 text-lg mr-2 flex-shrink-0" />
          <p className="text-sm">{infoMessage}</p>
        </div>
      )}

      {/* Main Table Section */}
      <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <PaymentsTable 
            data={payments} 
            onViewPayment={handleOpenViewPaymentDetails} 
            onEditPayment={handleOpenEditPaymentModal} 
            isLoading={isLoadingPayments} 
            showAlert={showAlert} 
          />
        </div>
      </div>

      {/* Modals */}
      {isAddPaymentModalOpen && (
        <AddPaymentModal 
          isOpen={isAddPaymentModalOpen} 
          onClose={handleCloseAddPaymentModal} 
          onSubmitSuccess={handlePaymentSubmitSuccess} 
        />
      )}
      {isEditPaymentModalOpen && paymentToEdit && (
        <EditPaymentModal 
          isOpen={isEditPaymentModalOpen} 
          onClose={handleCloseEditPaymentModal} 
          onSubmitSuccess={handlePaymentUpdateSuccess} 
          paymentData={paymentToEdit} 
        />
      )}
    </div>
  );
}