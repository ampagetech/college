// src/components/admin/fees/AdminFeesTable.tsx
"use client";

import { FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
// --- MODIFIED: Import Fee type from the central actions file ---
import { Fee } from '@/app/(dashboard)/admin/fees/actions';

interface AdminFeesTableProps {
  data: Fee[];
  onEditFee: (fee: Fee) => void;
  onDeleteFee: (feeId: string) => void;
  isLoading: boolean;
}

export default function AdminFeesTable({
  data,
  onEditFee,
  onDeleteFee,
  isLoading
}: AdminFeesTableProps): JSX.Element {

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatFrequency = (frequency: Fee['frequency']): string => {
    const map: Record<string, string> = {
      'per_semester': 'Per Semester',
      'once_on_registration': 'One-time',
      'annual': 'Annual',
    };
    return map[frequency] || frequency;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <FaSpinner className="animate-spin text-blue-600 text-2xl mr-3" />
          <p className="text-gray-600">Loading fees...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No fees found</p>
          <p className="text-gray-400 text-sm mt-1">Click "New Fee" to add the first one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
          
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((fee) => (
              <tr key={fee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fee.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(fee.amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatFrequency(fee.frequency)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${fee.is_optional ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {fee.is_optional ? 'Optional' : 'Mandatory'}
                  </span>
                </td>
               
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${fee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {fee.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => onEditFee(fee)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors" title="Edit fee">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteFee(fee.id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors" title="Delete fee">
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}