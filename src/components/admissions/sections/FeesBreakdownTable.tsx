// C:\DevWeb\jewel-univ-apply\src\components\admissions\sections\FeesBreakdownTable.tsx
'use client';

import { Fee } from '@/types/admission'; // Ensure Fee type is correctly defined and imported

interface FeesBreakdownTableProps {
  title: string;
  fees: Fee[];
  totalAmount?: number; // Optional, as some tables (like accommodation) might not show a sum
  showFeeCode?: boolean; // Optional: to show fee codes if needed
}

const FeesBreakdownTable: React.FC<FeesBreakdownTableProps> = ({
  title,
  fees,
  totalAmount,
  showFeeCode = false,
}) => {
  const formatCurrency = (amount?: number | string): string => {
    if (!amount) return 'N/A';
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return 'Invalid Amount';
    return `₦${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (fees.length === 0) {
    // Optionally render nothing or a placeholder if there are no fees for this section
    // return <p className="text-sm text-gray-500 my-2">No fees listed for {title}.</p>;
    return null; 
  }

  return (
    <div className="my-4">
      <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="overflow-x-auto border border-gray-300 rounded-md">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">
                Fee Description
              </th>
              {showFeeCode && (
                <th scope="col" className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">
                  Code
                </th>
              )}
              <th scope="col" className="px-4 py-2 text-right font-medium text-gray-600 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fees.map((fee, index) => (
              <tr key={fee.id || index}> {/* Use fee.id if available, otherwise index as fallback */}
                <td className="px-4 py-2 whitespace-nowrap text-gray-700">{fee.name}</td>
                {showFeeCode && <td className="px-4 py-2 whitespace-nowrap text-gray-500">{fee.fee_code || 'N/A'}</td>}
                <td className="px-4 py-2 whitespace-nowrap text-right text-gray-700">{formatCurrency(fee.amount)}</td>
              </tr>
            ))}
            {typeof totalAmount === 'number' && (
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={showFeeCode ? 2 : 1} className="px-4 py-2 text-left text-gray-800 uppercase">
                  Total
                </td>
                <td className="px-4 py-2 text-right text-gray-800">{formatCurrency(totalAmount)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeesBreakdownTable;