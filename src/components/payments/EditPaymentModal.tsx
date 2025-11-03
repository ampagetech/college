// src/components/payments/EditPaymentModal.tsx
"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { FaTimes, FaSpinner, FaFilePdf, FaInfoCircle, FaLock } from 'react-icons/fa';
// Ensure PaymentStatus and paymentStatusLabels are imported
import { Payment, PaymentStatus, paymentStatusLabels } from '@/types/payment'; 

interface EditPaymentFormData {
  transaction_reference: string;
  receiptFile: File | null;
}

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  paymentData: Payment | null;
}

export default function EditPaymentModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  paymentData,
}: EditPaymentModalProps) {
  const [formData, setFormData] = useState<EditPaymentFormData>({
    transaction_reference: '',
    receiptFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentReceiptUrl, setCurrentReceiptUrl] = useState<string | null>(null);
  
  const isPaymentEditable = paymentData?.status === PaymentStatus.PENDING;
  const currentStatusLabel = paymentData ? (paymentStatusLabels[paymentData.status] || paymentData.status) : 'N/A';

  // Cleanup blob URLs
  useEffect(() => {
    const currentLocalUrl = previewUrl; // Capture for cleanup
    return () => {
      if (currentLocalUrl && currentLocalUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentLocalUrl);
      }
    };
  }, [previewUrl]); // Correct: only depends on previewUrl

  // Reset form state when modal opens/closes or the main paymentData prop changes
  useEffect(() => {
    if (isOpen && paymentData) {
      setFormData({
        transaction_reference: paymentData.transaction_reference || '',
        receiptFile: null, // Intentionally set to null when modal opens or paymentData changes
      });
      setCurrentReceiptUrl(paymentData.receipt_url || null);
      
      // If a previewUrl exists (e.g., from a previous interaction before paymentData changed, or before modal re-opened)
      // it should be cleared. The actual blob revocation is handled by the effect above.
      setPreviewUrl(null); 
      
      setError(null);
      setFileError(null);
      setIsSubmitting(false);
    } else if (!isOpen) { // Modal is closing, full reset
      setFormData({ transaction_reference: '', receiptFile: null });
      setCurrentReceiptUrl(null);
      // previewUrl will be nullified here too, its blob revocation is handled by the other effect
      setPreviewUrl(null); 
      setError(null);
      setFileError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, paymentData]); // CORRECTED DEPENDENCY ARRAY: Removed previewUrl

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError(null); // Clear general errors on input change
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null); // Reset file error on new file selection attempt
    setError(null); // Clear general errors too

    // Revoke previous blob URL if it exists (this is for immediate UI update if user changes selection multiple times)
    // The main cleanup is in the useEffect hook.
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
      // No need to setPreviewUrl(null) here immediately if a new file is being set,
      // as it will be overwritten. If no file is selected, it's handled below.
    }

    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setFileError('File size must not exceed 5MB.');
        e.target.value = ''; // Clear the input
        setFormData(prev => ({ ...prev, receiptFile: null }));
        setPreviewUrl(null); // Ensure no stale preview
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setFileError('Invalid file type. Only JPG, PNG, or PDF are allowed.');
        e.target.value = ''; // Clear the input
        setFormData(prev => ({ ...prev, receiptFile: null }));
        setPreviewUrl(null); // Ensure no stale preview
        return;
      }

      setFormData(prev => ({
        ...prev,
        receiptFile: file
      }));

      if (file.type.startsWith('image/')) {
        const newPreviewUrl = URL.createObjectURL(file);
        setPreviewUrl(newPreviewUrl);
      } else {
        setPreviewUrl(null); // No preview for non-image types like PDF here
      }
    } else { // No file selected or selection cancelled
      setFormData(prev => ({ ...prev, receiptFile: null }));
      setPreviewUrl(null); // Clear preview if file selection is cancelled
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); 

    if (!paymentData) {
      setError("Payment data is missing.");
      return;
    }

    if (!isPaymentEditable) {
      setError(`This payment is in ${currentStatusLabel.toLowerCase()} status and cannot be edited.`);
      return;
    }

    if (fileError) { 
      return; 
    }
    
    const transactionReferenceChanged = formData.transaction_reference.trim() !== (paymentData.transaction_reference || '').trim();
    const newFileSelected = !!formData.receiptFile;

    if (!newFileSelected && !transactionReferenceChanged) {
        setError("No changes were made to the transaction reference or receipt file.");
        // setIsSubmitting(false); // No need to set isSubmitting false here as it's not set true yet
        return;
    }

    setIsSubmitting(true);
    const apiFormData = new FormData();
    
    if (transactionReferenceChanged) {
        apiFormData.append('transaction_reference', formData.transaction_reference.trim());
    }

    if (newFileSelected) { // formData.receiptFile is guaranteed to be non-null here due to the check
      apiFormData.append('receiptFile', formData.receiptFile as File);
    }
    
    try {
      console.log('Submitting edit payment with FormData:', {
        transaction_reference: formData.transaction_reference.trim(), // Log trimmed value
        hasReceiptFile: newFileSelected,
        receiptFileName: formData.receiptFile?.name,
      });

      const response = await fetch(`/api/payments/${paymentData.id}`, {
        method: 'PUT',
        body: apiFormData,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Network error or non-JSON response' }));
        throw new Error(result.error || `HTTP ${response.status}: Failed to update payment.`);
      }

      const responseData = await response.json();
      console.log('Payment updated successfully', responseData);
      onSubmitSuccess(); // Call this before onClose to allow parent to react
      onClose();
    } catch (err: any) {
      console.error('Payment update error:', err);
      setError(err.message || 'An unexpected error occurred while updating payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  if (!isOpen || !paymentData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Edit Payment Details
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {!isPaymentEditable && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-3 mb-4 text-sm rounded flex items-center">
            <FaLock className="mr-2"/>
            <p>This payment is in <strong>{currentStatusLabel.toUpperCase()}</strong> status and cannot be edited.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm rounded">
            <p>{error}</p>
          </div>
        )}
        {fileError && !error && (
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-3 mb-4 text-sm rounded">
            <p>{fileError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Type
            </label>
            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700">
              {paymentData.fees?.name || 'N/A'} (ID: {paymentData.fees?.id.substring(0,8) || 'N/A'}...)
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount (NGN)
            </label>
            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700">
              ₦{paymentData.amount.toLocaleString()}
            </div>
          </div>

          <div>
            <label htmlFor="transaction_reference" className="block text-sm font-medium text-gray-700">
              Transaction Reference (Optional)
            </label>
            <input
              type="text"
              id="transaction_reference"
              name="transaction_reference"
              value={formData.transaction_reference}
              onChange={handleInputChange}
              disabled={isSubmitting || !isPaymentEditable}
              placeholder="Enter transaction reference"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="receiptFile" className="block text-sm font-medium text-gray-700">
              Update Payment Receipt (JPG, PNG, PDF - Max 5MB)
            </label>
            <input
              type="file"
              id="receiptFile"
              name="receiptFile"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              disabled={isSubmitting || !isPaymentEditable}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {isPaymentEditable && (
              <p className="mt-1 text-xs text-gray-500">
                <FaInfoCircle className="inline mr-1 mb-0.5" />
                Selecting a new file will replace the existing receipt. If no new file is selected, the current receipt remains.
              </p>
            )}
          </div>

          <div className="mt-3">
            {previewUrl && formData.receiptFile?.type.startsWith('image/') ? (
              <div>
                <p className="text-sm text-green-600 mb-2 font-medium">🆕 New Receipt Preview:</p>
                <Image
                  src={previewUrl}
                  alt="New Receipt Preview"
                  width={280}
                  height={160}
                  style={{ objectFit: 'contain' }}
                  className="max-h-40 w-auto rounded border shadow-sm"
                />
              </div>
            ) : formData.receiptFile && formData.receiptFile.type === 'application/pdf' ? (
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600 p-2 bg-green-50 border border-green-200 rounded">
                <FaFilePdf className="text-red-500 text-xl" />
                <span className="text-green-700 font-medium">{formData.receiptFile.name} selected (New)</span>
              </div>
            ) : currentReceiptUrl ? ( 
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Receipt:</p>
                {currentReceiptUrl.toLowerCase().endsWith('.pdf') ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 p-2 bg-gray-50 rounded">
                    <FaFilePdf className="text-red-500 text-xl" />
                    <a href={currentReceiptUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {paymentData.receipt_filename || 'View Current PDF Receipt'}
                    </a>
                  </div>
                ) : (
                  <Image
                    src={currentReceiptUrl}
                    alt="Current Receipt"
                    width={280}
                    height={160}
                    style={{ objectFit: 'contain' }}
                    className="max-h-40 w-auto rounded border shadow-sm"
                    onError={() => {
                      console.warn("Failed to load current receipt image from URL:", currentReceiptUrl);
                      setCurrentReceiptUrl(null); 
                    }}
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No current receipt available or new receipt selected.</p>
            )}
          </div>


          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isPaymentEditable || !!fileError} 
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting && <FaSpinner className="animate-spin mr-2" />}
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}