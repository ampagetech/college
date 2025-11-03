// @/components/dashboard/DashboardTimeline.tsx
"use client";

import { useState, useMemo, FC } from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

// Define the shape of a single transaction
export type Transaction = {
  transaction_type: string;
  transaction_date: string; // Comes as an ISO string
  description: string | null;
};

// Define the component's props
interface DashboardTimelineProps {
  initialTransactions: Transaction[];
}

// Helper component for sortable table headers
const SortableHeader: FC<{
  label: string;
  sortKey: keyof Transaction;
  sortConfig: { key: keyof Transaction; direction: 'ascending' | 'descending' } | null;
  requestSort: (key: keyof Transaction) => void;
  className?: string;
}> = ({ label, sortKey, sortConfig, requestSort, className }) => {
  const isSorted = sortConfig?.key === sortKey;
  const directionIcon = isSorted ? (
    sortConfig.direction === 'ascending' ? <FaArrowUp className="ml-1" /> : <FaArrowDown className="ml-1" />
  ) : null;

  return (
    <th
      className={`px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none ${className}`}
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {directionIcon}
      </div>
    </th>
  );
};

export default function DashboardTimeline({ initialTransactions }: DashboardTimelineProps) {
  const [transactions] = useState(initialTransactions);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'ascending' | 'descending' }>({
    key: 'transaction_date',
    direction: 'descending',
  });

  const requestSort = (key: keyof Transaction) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // AFTER (The safe version)
const sortedTransactions = useMemo(() => {
  const sortableItems = [...transactions];
  sortableItems.sort((a, b) => {
    // Get the values to compare
    const valA = a[sortConfig.key];
    const valB = b[sortConfig.key];

    // Handle nulls: treat null as the "smallest" value
    if (valA === null && valB === null) return 0; // both are null, equal
    if (valA === null) return -1; // a is null, so it comes first
    if (valB === null) return 1;  // b is null, so it comes first

    // Now that we know they aren't null, we can compare them
    if (valA < valB) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (valA > valB) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });
  return sortableItems;
}, [transactions, sortConfig]);

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Helper function to check if a date is today
  const isToday = (dateString: string) => {
    const transactionDate = new Date(dateString);
    const today = new Date();
    
    return transactionDate.getFullYear() === today.getFullYear() &&
           transactionDate.getMonth() === today.getMonth() &&
           transactionDate.getDate() === today.getDate();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Alerts / Notifications</h3>
      </div>
      
      <div className="overflow-y-auto max-h-[60vh]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <SortableHeader label="#" sortKey="transaction_date" sortConfig={sortConfig} requestSort={requestSort} className="w-12 text-center" />
              <SortableHeader label="Event Type" sortKey="transaction_type" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Description" sortKey="description" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Date & Time" sortKey="transaction_date" sortConfig={sortConfig} requestSort={requestSort} />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map((tx, index) => {
                const isTodayTransaction = isToday(tx.transaction_date);
                
                return (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors ${
                      isTodayTransaction ? '!text-fuchsia-600 font-medium' : ''
                    }`}
                  >
                    <td className={`px-4 py-2 whitespace-nowrap text-sm text-center ${
                      isTodayTransaction ? 'text-fuchsia-600' : 'text-gray-500'
                    }`}>
                      {index + 1}
                    </td>
                    <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${
                      isTodayTransaction ? 'text-fuchsia-600' : 'text-gray-800'
                    }`}>
                      {capitalizeFirstLetter(tx.transaction_type)}
                    </td>
                    <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                      isTodayTransaction ? 'text-fuchsia-600' : 'text-gray-600'
                    }`}>
                      {tx.description}
                    </td>
                    <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                      isTodayTransaction ? 'text-fuchsia-600' : 'text-gray-500'
                    }`}>
                      <div className="flex flex-col">
                        <span>{formatDate(tx.transaction_date)}</span>
                        <span className="text-xs">{formatTime(tx.transaction_date)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-6 px-4 text-sm text-gray-500">
                  You have no activity to display yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}