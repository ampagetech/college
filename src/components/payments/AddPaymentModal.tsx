// src/components/payments/AddPaymentModal.tsx
"use client";

import { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import Image from 'next/image';
import { FaTimes, FaSpinner,  FaFilePdf } from 'react-icons/fa';

// Local interface for fee data received from /api/fees
interface ModalFee {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  is_active: boolean;
}

interface NewPaymentFormData {
  fee_id: string;
  receiptFile: File | null;
  transaction_reference: string;
}

// Renamed Props Interface
interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

const initialFormState: NewPaymentFormData = {
  fee_id: '',
  receiptFile: null,
  transaction_reference: '',
};

// Interface for the new validation function's response
interface ValidationResult {
  isValid: boolean;
  message: string;
  requiredFees?: string[];
  duplicatePayment?: {
    id: string;
    fee_name: string;
    status: string;
    payment_date: string;
  };
}

// Renamed Component Function
export default function AddPaymentModal({
  isOpen,
  onClose,
  onSubmitSuccess,
}: AddPaymentModalProps) { // Using renamed props interface
  const [formData, setFormData] = useState<NewPaymentFormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [fees, setFees] = useState<ModalFee[]>([]);
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);
  const [selectedFee, setSelectedFee] = useState<ModalFee | null>(null);

  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(false);

  useEffect(() => {
    // Cleanup for blob URL
    const currentLocalUrl = previewUrl;
    return () => {
      if (currentLocalUrl && currentLocalUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentLocalUrl);
      }
    };
  }, [previewUrl]);


  const fetchFees = useCallback(async () => {
    setFeesLoading(true);
    setFeesError(null);
    try {
      const response = await fetch('/api/fees', { cache: 'no-store' });
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to get error details');
        throw new Error(`Failed to fetch fees: ${response.status} - ${errorText}`);
      }
      const feesData: ModalFee[] = await response.json();
      setFees(feesData);
    } catch (err: any) {
      console.error('Error fetching fees:', err);
      setFeesError(err.message || 'Failed to load payment types');
    } finally {
      setFeesLoading(false);
    }
  }, []);

  const validatePayment = useCallback(async (feeId: string): Promise<ValidationResult> => {
    try {
      console.log('Validating payment for fee_id:', feeId);
      const response = await fetch('/api/payments/check-validity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fee_id: feeId }),
      });
      console.log('Validation response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse validation error response' }));
        console.log('Validation error response data:', errorData);
        throw new Error(errorData?.error || 'Failed to validate payment');
      }
      const result: ValidationResult = await response.json();
      console.log('Validation result from API:', result);
      return result;
    } catch (err: any) {
      console.error('Error in validatePayment function:', err);
      return {
        isValid: false,
        message: err.message || 'Could not validate payment due to a client-side error. Please try again.',
      };
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
        if (!prevIsOpen) { // Modal just opened
            setError(null);
            setFileError(null);
            setFeesError(null);
            setFormData(initialFormState);
            if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setSelectedFee(null);
            setIsSubmitting(false);
            fetchFees();
        }
    } else { // Modal is closed
        if (prevIsOpen) { // Modal just closed
            setFormData(initialFormState);
            if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setError(null);
            setFileError(null);
            setFeesError(null);
            setSelectedFee(null);
            setIsSubmitting(false);
        }
    }

    if (prevIsOpen !== isOpen) {
        setPrevIsOpen(isOpen);
    }
  }, [isOpen, prevIsOpen, fetchFees, previewUrl]); // Added previewUrl to dependencies for cleanup logic


  const handleFeeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const feeId = e.target.value;
    setError(null); // Clear general error on fee change
    // Do not clear fileError or receiptFile here, user might select fee after selecting file
    setFormData(prev => ({ ...prev, fee_id: feeId }));

    const fee = fees.find(f => f.id === feeId);
    setSelectedFee(fee || null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError(null); // Clear general error
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null); // Reset file error on new file selection attempt
    setError(null); // Clear general errors too

    // Revoke previous blob URL if it exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setFileError('File size must not exceed 5MB.');
        e.target.value = ''; // Clear the input
        setFormData(prev => ({ ...prev, receiptFile: null }));
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setFileError('Invalid file type. Only JPG, PNG, or PDF are allowed.');
        e.target.value = ''; // Clear the input
        setFormData(prev => ({ ...prev, receiptFile: null }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        receiptFile: file
      }));

      if (file.type.startsWith('image/')) {
        const newPreviewUrl = URL.createObjectURL(file);
        setPreviewUrl(newPreviewUrl);
      }
      // For PDF, no visual preview here, but file is stored
    } else { // No file selected or selection cancelled
      setFormData(prev => ({ ...prev, receiptFile: null }));
      // previewUrl would have been cleared at the start of this function or if it was never set
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous general submission errors first

    // 1. Check for Payment Type
    if (!formData.fee_id) {
      setError('Please select a payment type.');
      return;
    }
    
    // Ensure selectedFee is up-to-date if not already set
    let currentSelectedFee = selectedFee;
    if (!currentSelectedFee || currentSelectedFee.id !== formData.fee_id) {
        currentSelectedFee = fees.find(f => f.id === formData.fee_id) || null;
        if (!currentSelectedFee) {
            setError('Invalid payment type selected. Please refresh and try again.');
            return;
        }
        setSelectedFee(currentSelectedFee); // Update state if it was out of sync
    }

    // 2. Check for existing file errors (from handleFileChange - size/type)
    if (fileError) {
      // No need to set general error here if fileError is already specific.
      // The fileError message will be displayed.
      return;
    }

    // 3. Check for Receipt File (Mandatory)
    if (!formData.receiptFile) {
      setError('Please upload a payment receipt.'); // This error will be shown if fileError is not already set
      return;
    }

    setIsSubmitting(true);

    // 4. API Validation (check-validity)
    const validationResult = await validatePayment(formData.fee_id);
    
    if (!validationResult.isValid) {
      setError(validationResult.message); // Display message from validation API
      setIsSubmitting(false);
      return;
    }

    // 5. Proceed with submission if all checks passed
    const apiFormData = new FormData();
    apiFormData.append('fee_id', formData.fee_id);
    
    if (formData.transaction_reference.trim()) {
      apiFormData.append('transaction_reference', formData.transaction_reference.trim());
    }
    // formData.receiptFile is guaranteed to be non-null here
    apiFormData.append('receiptFile', formData.receiptFile);


    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        body: apiFormData,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Network error or non-JSON response from payment submission' }));
        throw new Error(result.error || `HTTP ${response.status}: Failed to submit payment.`);
      }
      onSubmitSuccess();
      onClose(); 
    } catch (err: any) {
      console.error('Payment submission error:', err);
      setError(err.message || 'An unexpected error occurred while submitting payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; 
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Add a New Payment
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Display general error first if it exists */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm rounded">
            <p>{error}</p>
          </div>
        )}
        {/* Display file-specific error if no general error and fileError exists */}
        {fileError && !error && ( 
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-3 mb-4 text-sm rounded">
            <p>{fileError}</p>
          </div>
        )}
        {feesError && !error && !fileError && ( // Only show if other errors aren't present
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm rounded">
            <p>Error loading payment types: {feesError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fee_id" className="block text-sm font-medium text-gray-700">
              Payment Type <span className="text-red-500">*</span>
            </label>
            {feesLoading ? (
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">
                <div className="flex items-center">
                  <FaSpinner className="animate-spin mr-2" />
                  <span className="text-gray-500">Loading payment types...</span>
                </div>
              </div>
            ) : (
              <select
                id="fee_id"
                name="fee_id"
                value={formData.fee_id}
                onChange={handleFeeChange}
                disabled={isSubmitting || feesLoading || !!feesError}
                required // HTML5 validation for selection
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="" disabled>Select payment type</option>
                {fees.map((fee) => (
                  <option key={fee.id} value={fee.id}>
                    {fee.name} 
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedFee && selectedFee.description && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 text-sm">
              <p className="text-blue-700">{selectedFee.description}</p>
            </div>
          )}

          {selectedFee && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount (NGN)
              </label>
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700">
                ₦{(selectedFee.amount || 0).toLocaleString()}
              </div>
            </div>
          )}

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
              disabled={isSubmitting}
              placeholder="Enter transaction reference"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="receiptFile" className="block text-sm font-medium text-gray-700">
              Payment Receipt (JPG, PNG, PDF - Max 5MB) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="receiptFile"
              name="receiptFile"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              disabled={isSubmitting}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />

            {previewUrl && formData.receiptFile?.type.startsWith('image/') && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <Image
                  src={previewUrl}
                  alt="Receipt Preview"
                  width={280}
                  height={160}
                  style={{ objectFit: 'contain' }}
                  className="max-h-40 w-auto rounded border shadow-sm"
                />
              </div>
            )}

            {formData.receiptFile && formData.receiptFile.type === 'application/pdf' && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600 p-2 bg-gray-50 rounded">
                <FaFilePdf className="text-red-500 text-xl" />
                <span>{formData.receiptFile.name} selected</span>
              </div>
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
              disabled={
                isSubmitting || 
                !!fileError || // Disabled if there's a file-specific error (size/type)
                feesLoading || 
                !selectedFee || // Disabled if no fee type is selected
                !!feesError || // Disabled if there's an error loading fees
                !formData.receiptFile // NEW: Disabled if no receipt file is uploaded
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex items-center"
            >
              {isSubmitting && <FaSpinner className="animate-spin mr-2" />}
              {isSubmitting ? 'Validating & Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}