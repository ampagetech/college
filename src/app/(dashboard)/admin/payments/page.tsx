// src/app/(dashboard)/admin/payments/page.tsx
'use client';

import { useState } from 'react';
import AdminPaymentsTable from '@/components/admin/payments/AdminPaymentsTable';
import AdminPaymentsFilters from '@/components/admin/payments/AdminPaymentsFilters';
import { AdminPaymentsFiltersType } from '@/types/payment'; // Or your actual path

export default function AdminPaymentsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filters, setFilters] = useState<AdminPaymentsFiltersType>({
    status: '',
    
    userSearch: '',
    dateFrom: '',
    dateTo: '',
  });

  // selectedPayments might be useful for bulk actions in the future
  // const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  const handleFilterChange = (newFilters: Partial<AdminPaymentsFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePaymentUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Payments</h1>
        <p className="text-sm text-gray-600">View, verify, and manage all user payments.</p>
      </header>

      <AdminPaymentsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <div className="mt-6">
        <AdminPaymentsTable
          filters={filters}
          refreshTrigger={refreshTrigger}
          onPaymentUpdated={handlePaymentUpdated}
          // selectedPayments={selectedPayments}
          // onSelectPayments={setSelectedPayments}
        />
      </div>
    </div>
  );
}