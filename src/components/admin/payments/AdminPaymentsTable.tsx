// src/components/admin/payments/AdminPaymentsTable.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaSpinner, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import ManagePaymentModal from '@/components/admin/payments/ManagePaymentModal';
import StatusBadge from '@/components/common/StatusBadge'; 
import {
  AdminPaymentView,
  AdminPaymentsFiltersType,
  AdminUpdatePaymentPayload,
} from '@/types/payment';

interface AdminPaymentsTableProps {
    filters: AdminPaymentsFiltersType;
    refreshTrigger: number; 
    onPaymentUpdated: () => void; 
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

interface ApiResponse {
  payments: AdminPaymentView[];
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

interface ApiError {
  error: string;
  message?: string;
}

type SortableKeys = keyof AdminPaymentView | 'user.email' | 'user.first_name' | 'user.last_name' | 'fees.name';

export default function AdminPaymentsTable({ filters, onPaymentUpdated, refreshTrigger }: AdminPaymentsTableProps): JSX.Element { 
  const [payments, setPayments] = useState<AdminPaymentView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>({ key: 'payment_date', direction: 'desc'});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentView | null>(null);

  const fetchPayments = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        status: filters.status || '',
        userSearch: filters.userSearch,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });

      if (filters.fee_id) {
        queryParams.append('fee_id', filters.fee_id);
      }
      if (filters.feeNameSearch) {
        queryParams.append('feeNameSearch', filters.feeNameSearch);
      }

      if (sortConfig) {
        queryParams.append('sortBy', sortConfig.key);
        queryParams.append('sortOrder', sortConfig.direction);
      }

      const response = await fetch(`/api/admin/payments?${queryParams.toString()}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Network error or invalid JSON response' })) as ApiError;
        throw new Error(errData.error || `Failed to fetch payments: ${response.statusText}`);
      }
      const data = await response.json() as ApiResponse;

      setPayments(data.payments);
      setPagination(prev => ({
        ...prev,
        currentPage: data.page,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
        limit: data.limit,
      }));
    } catch (err: unknown) {
      console.error('Error fetching payments:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, filters, sortConfig]);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments, refreshTrigger]); 
  
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filters, sortConfig]);

  const handlePageChange = (page: number): void => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const requestSort = (key: SortableKeys): void => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKeys): JSX.Element => {
    if (!sortConfig || sortConfig.key !== key) {
      return <FaSort className="inline ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1 text-blue-600" /> : <FaSortDown className="inline ml-1 text-blue-600" />;
  };

  const handleManageClick = (payment: AdminPaymentView): void => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleModalClose = (): void => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleModalSave = async (paymentId: string, updatedData: AdminUpdatePaymentPayload): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({error: "Update failed"})) as ApiError;
        throw new Error(errData.error || 'Failed to update payment');
      }
      onPaymentUpdated();
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error('Error updating payment:', err);
      throw err;
    }
  };
  
  if (isLoading && payments.length === 0) { 
    return (
      <div className="text-center py-10">
        <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto" />
        <p className="mt-2 text-gray-600">Loading payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-md">
        Error: {error} 
        <button 
          onClick={() => { void fetchPayments(); }} 
          className="ml-2 text-blue-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }
  
  const colSpanValue = 8; 

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => { requestSort('user.email'); }}>User Email {getSortIcon('user.email')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => { requestSort('user.first_name'); }}>User Name {getSortIcon('user.first_name')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => { requestSort('fees.name'); }}>Fee Type {getSortIcon('fees.name')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => { requestSort('amount'); }}>Amount {getSortIcon('amount')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => { requestSort('payment_date'); }}>Payment Date {getSortIcon('payment_date')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => { requestSort('status'); }}>Status {getSortIcon('status')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && payments.length > 0 && ( 
                <tr><td colSpan={colSpanValue} className="p-4 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2"/> Refreshing...</td></tr>
            )}
            {!isLoading && payments.length === 0 ? (
              <tr>
                <td colSpan={colSpanValue} className="px-6 py-10 text-center text-gray-500">
                  No payments found matching your criteria.
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const userName = `${payment.user.first_name || ''} ${payment.user.last_name || ''}`.trim();
                return (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{payment.user.email || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{userName || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{payment.fees?.name || 'N/A (No Fee Linked)'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                      {payment.amount.toLocaleString('en-NG', { 
                        style: 'currency', 
                        currency: 'NGN',
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {payment.receipt_url ? (
                        <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => { handleManageClick(payment); }}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-100 transition-colors"
                        title="Manage Payment"
                      >
                        <FaEdit size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && pagination.totalPages > 1 && (
         <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 bg-white">
          <span className="text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages} (Total: {pagination.totalItems} items)
          </span>
          <div>
            <button 
              onClick={() => { handlePageChange(pagination.currentPage - 1); }} 
              disabled={pagination.currentPage <= 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              onClick={() => { handlePageChange(pagination.currentPage + 1); }} 
              disabled={pagination.currentPage >= pagination.totalPages}
              className="relative -ml-px inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
         </div>
      )}

      {selectedPayment && (
        <ManagePaymentModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          payment={selectedPayment} 
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}