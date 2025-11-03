// src/components/payments/PaymentsTable.tsx
"use client";

import { Payment, PaymentStatus, paymentStatusLabels } from '@/types/payment';
import { FaEye, FaEdit, FaSpinner, FaBan } from 'react-icons/fa';
import { useState } from 'react'; 

interface PaymentsTableProps {
  data: Payment[];
  onViewPayment: (payment: Payment) => void;
  onEditPayment?: (payment: Payment) => void;
  isLoading: boolean;
  showAlert?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function PaymentsTable({ 
  data, 
  onViewPayment, 
  onEditPayment, 
  isLoading,
  showAlert
}: PaymentsTableProps) {
  const [isCheckingStatus, setIsCheckingStatus] = useState<string | null>(null); 

  if (isLoading && data.length === 0) {
    return (
      <div className="flex justify-center items-center py-10">
        <FaSpinner className="animate-spin text-blue-600 text-3xl" />
        <p className="ml-3 text-gray-600">Loading payments...</p>
      </div>
    );
  }

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <p className="text-center text-gray-500 py-10 font-bold">
        You have not made any payment yet click Payment button.
      </p>
    );
  }

  const thClass = "px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider";
  const tdClass = "px-4 py-4 whitespace-nowrap text-sm";

  const handleEditClick = async (payment: Payment) => {
    if (!onEditPayment) return;

    // 1. Initial client-side check (for immediate UI feedback)
    const currentStatusLabel = paymentStatusLabels[payment.status] || payment.status;
    if (payment.status !== PaymentStatus.PENDING) {
      const message = `This payment is already ${currentStatusLabel.toLowerCase()} and cannot be edited.`;
      if (showAlert) showAlert(message, 'info');
      else alert(message);
      return;
    }

    // 2. Server-side check for latest status
    setIsCheckingStatus(payment.id);
    try {
      // CORRECTED FETCH URL: remove '/status' from the end
      const response = await fetch(`/api/payments/${payment.id}`); 
      
      if (!response.ok) {
        let errorDetail = "Failed to check payment status."; // Default error
        try {
          const errData = await response.json();
          // Use error from API if available, otherwise more generic message
          errorDetail = errData.error || `Server responded with ${response.status}.`; 
        } catch (e) {
          // Response was not JSON or other parsing error, stick with a status-based message
          errorDetail = `Failed to check payment status. Server responded with ${response.status}.`;
        }
        throw new Error(errorDetail);
      }

      // Assuming the API route GET /api/payments/[paymentId] returns { status: "STATUS_VALUE", ...otherPaymentData }
      // If it returns the full payment object, then: const latestStatus = (await response.json()).status;
      // If it just returns { status: "STATUS_VALUE" }, then this is fine:
      const result = await response.json(); 
      const latestStatus = result.status as PaymentStatus; // Ensure your API returns an object with a 'status' key

      if (latestStatus === PaymentStatus.PENDING) {
        onEditPayment(payment); // Proceed to open modal
      } else {
        // Update local data if different and show alert
        const paymentInTable = data.find(p => p.id === payment.id);
        if (paymentInTable) paymentInTable.status = latestStatus; 

        const latestStatusLabel = paymentStatusLabels[latestStatus] || latestStatus;
        const message = `This payment is now ${latestStatusLabel.toLowerCase()} and cannot be edited.`;
        if (showAlert) showAlert(message, 'info');
        else alert(message);
      }
    } catch (error: any) {
      console.error("Error checking payment status:", error);
      const message = error.message || "Could not verify payment status. Please try again.";
      if (showAlert) showAlert(message, 'error');
      else alert(message);
    } finally {
      setIsCheckingStatus(null);
    }
  };
  
  const isPaymentEditable = (status: PaymentStatus): boolean => {
    return status === PaymentStatus.PENDING;
  };


  return (
    <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
      {isLoading && data.length > 0 && ( 
        <div className="absolute inset-0 bg-white bg-opacity-50 flex justify-center items-center z-10">
            <FaSpinner className="animate-spin text-blue-600 text-2xl" />
            <p className="ml-2 text-gray-600">Refreshing...</p>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th scope="col" className={thClass}>Fee Type</th>
            <th scope="col" className={thClass}>Date</th>
            <th scope="col" className={`${thClass} text-right`}>Amount (NGN)</th>
            <th scope="col" className={thClass}>Status</th>
            {onEditPayment && (
              <th scope="col" className={`${thClass} text-center`}>Edit</th>
            )}
            <th scope="col" className={`${thClass} text-center`}>View</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((payment) => {
            const editable = isPaymentEditable(payment.status);
            return (
              <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className={`${tdClass} text-gray-800`}>
                  {payment.fees?.name || 'Unknown Fee Type'}
                </td>
                <td className={`${tdClass} text-gray-600`}>
                  {new Date(payment.payment_date).toLocaleDateString()}
                </td>
                <td className={`${tdClass} text-gray-800 text-right`}>
                  {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={tdClass}>
                  <span
                    className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === PaymentStatus.CONFIRMED 
                        ? 'bg-green-100 text-green-800'
                        : payment.status === PaymentStatus.PENDING
                        ? 'bg-yellow-100 text-yellow-800'
                        : payment.status === PaymentStatus.FAILED 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {paymentStatusLabels[payment.status] || String(payment.status).charAt(0).toUpperCase() + String(payment.status).slice(1)}
                  </span>
                </td>
                {onEditPayment && ( 
                  <td className={`${tdClass} text-center`}>
                    {editable ? ( 
                      <button
                        onClick={() => handleEditClick(payment)}
                        disabled={isCheckingStatus === payment.id} 
                        className="text-blue-600 hover:text-blue-800 focus:outline-none flex items-center justify-center w-full group disabled:opacity-50 disabled:cursor-wait"
                        title="Edit Payment"
                      >
                        {isCheckingStatus === payment.id ? (
                          <FaSpinner className="animate-spin mr-1 h-4 w-4" />
                        ) : (
                          <FaEdit className="mr-1 h-4 w-4 group-hover:scale-110 transition-transform" />
                        )}
                        Edit
                      </button>
                    ) : (
                      <span 
                        className="text-gray-400 cursor-not-allowed flex items-center justify-center w-full" 
                        title={`${paymentStatusLabels[payment.status]} payments cannot be edited`}
                      >
                        <FaBan className="mr-1 h-4 w-4" /> Edit
                      </span>
                    )}
                  </td>
                )}
                <td className={`${tdClass} text-center`}>
                  <button
                    onClick={() => { onViewPayment(payment); }}
                    className="text-indigo-600 hover:text-indigo-800 focus:outline-none flex items-center justify-center w-full group"
                    title="View Payment Details"
                  >
                    <FaEye className="mr-1 h-4 w-4 group-hover:scale-110 transition-transform" /> View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}