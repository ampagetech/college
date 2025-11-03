// src/components/admin/payments/AdminPaymentsFilters.tsx
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { AdminPaymentsFiltersType as CentralAdminPaymentsFiltersType, Fee, PaymentStatus } from '@/types/payment';

const paymentStatusLabels: Record<PaymentStatus, string> = Object.fromEntries(
  Object.values(PaymentStatus)
    .filter((value): value is PaymentStatus => typeof value === 'string')
    .map((value) => [
      value,
      String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase().replace(/_/g, ' ')
    ])
) as Record<PaymentStatus, string>;

interface AdminPaymentsFiltersProps {
  filters: CentralAdminPaymentsFiltersType;
  onFilterChange: (newFilters: Partial<CentralAdminPaymentsFiltersType>) => void;
}

export default function AdminPaymentsFilters({
  filters,
  onFilterChange
}: AdminPaymentsFiltersProps): JSX.Element {
  const [fees, setFees] = useState<Fee[]>([]);
  const [isLoadingFees, setIsLoadingFees] = useState<boolean>(true);

  useEffect((): void => {
    const fetchFees = async (): Promise<void> => {
      setIsLoadingFees(true);
      try {
        const response = await fetch('/api/fees');
        if (!response.ok) {
          throw new Error('Failed to fetch fees');
        }
        const data: unknown = await response.json();
        if (Array.isArray(data)) {
          const typedFees = data as Fee[];
          setFees(typedFees.filter((fee) => fee.is_active));
        } else {
          throw new Error('Invalid data structure');
        }
      } catch (error) {
        console.error('Error fetching fees for filter:', error);
        setFees([]);
      } finally {
        setIsLoadingFees(false);
      }
    };

    void fetchFees(); // fix no-floating-promises
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;

    if (name === 'fee_id' && value) {
      onFilterChange({ [name]: value, feeNameSearch: '' });
    } else if (name === 'feeNameSearch' && value) {
      onFilterChange({ [name]: value, fee_id: '' });
    } else {
      onFilterChange({ [name]: value });
    }
  };

  const handleClearFilters = (): void => {
    onFilterChange({
      userSearch: '',
      status: '',
      fee_id: '',
      feeNameSearch: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const inputClass =
    'w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm';

  return (
    <div className="p-4 bg-white shadow rounded-lg mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-3 items-end">
        <div className="lg:col-span-1">
          <label htmlFor="userSearch" className="block text-xs font-medium text-gray-700 mb-1">
            Search User/Ref
          </label>
          <input
            type="text"
            id="userSearch"
            name="userSearch"
            placeholder="Email, Name, Tx Ref"
            className={inputClass}
            value={filters.userSearch}
            onChange={handleInputChange}
          />
        </div>

        <div className="lg:col-span-1">
          <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            className={inputClass}
            value={filters.status}
            onChange={handleInputChange}
          >
            <option value="">All Statuses</option>
            {Object.entries(paymentStatusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1">
          <label htmlFor="fee_id" className="block text-xs font-medium text-gray-700 mb-1">
            Fee Type
          </label>
          <select
            id="fee_id"
            name="fee_id"
            className={inputClass}
            value={filters.fee_id || ''}
            onChange={handleInputChange}
            disabled={isLoadingFees}
          >
            <option value="">All Fee Types</option>
            {isLoadingFees ? (
              <option disabled>Loading fees...</option>
            ) : (
              fees.map((fee) => (
                <option key={fee.id} value={fee.id}>
                  {fee.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="lg:col-span-1">
          <label htmlFor="feeNameSearch" className="block text-xs font-medium text-gray-700 mb-1">
            Search Fee Name
          </label>
          <input
            type="text"
            id="feeNameSearch"
            name="feeNameSearch"
            placeholder="e.g. Application Fee"
            className={inputClass}
            value={filters.feeNameSearch || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="lg:col-span-1">
          <label htmlFor="dateFrom" className="block text-xs font-medium text-gray-700 mb-1">
            Date From
          </label>
          <input
            type="date"
            id="dateFrom"
            name="dateFrom"
            className={inputClass}
            value={filters.dateFrom}
            onChange={handleInputChange}
            max={filters.dateTo || undefined}
          />
        </div>

        <div className="lg:col-span-1">
          <label htmlFor="dateTo" className="block text-xs font-medium text-gray-700 mb-1">
            Date To
          </label>
          <input
            type="date"
            id="dateTo"
            name="dateTo"
            className={inputClass}
            value={filters.dateTo}
            onChange={handleInputChange}
            min={filters.dateFrom || undefined}
          />
        </div>
      </div>

      <div className="mt-4 text-right">
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
