'use client';

interface AdminPaymentActionsProps {
  selectedCount: number;
  onRefresh: () => void;
}

export default function AdminPaymentActions({ selectedCount, onRefresh }: AdminPaymentActionsProps): JSX.Element {
  return (
    <div className="my-4 p-3 bg-gray-100 rounded-md shadow flex items-center justify-between">
      <div className="text-sm text-gray-700">
        {selectedCount > 0 ? `${selectedCount.toString()} payments selected` : "No payments selected"}
      </div>
      <div className="space-x-3">
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
        >
          Refresh List
        </button>
        {/* 
        <button
          disabled={selectedCount === 0}
          className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 disabled:bg-gray-300"
        >
          Confirm Selected (Not Implemented)
        </button> 
        */}
      </div>
    </div>
  );
}
