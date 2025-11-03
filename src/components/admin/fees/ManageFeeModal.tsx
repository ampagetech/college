// src/components/admin/fees/ManageFeeModal.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { FaTimes, FaSpinner } from "react-icons/fa";
// --- MODIFIED: Import actions and Fee type from the central actions file ---
import { createFee, updateFee, Fee } from "@/app/(dashboard)/admin/fees/actions";

interface ManageFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (message: string) => void;
  feeData?: Fee | null;
}

export default function ManageFeeModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  feeData,
}: ManageFeeModalProps): JSX.Element | null {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [frequency, setFrequency] = useState('');
  const [isOptional, setIsOptional] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isEditMode = Boolean(feeData);

  useEffect(() => {
    if (isOpen) {
      if (feeData) {
        setName(feeData.name);
        setDescription(feeData.description || "");
        setAmount(feeData.amount.toString());
        setIsActive(feeData.is_active);
        setFrequency(feeData.frequency || "");
        setIsOptional(feeData.is_optional);
      } else {
        // Reset form for "Add New"
        setName('');
        setDescription('');
        setAmount('');
        setIsActive(true);
        setFrequency('');
        setIsOptional(false);
      }
      setError(null);
    }
  }, [isOpen, feeData]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim() || !amount.trim() || !frequency) {
        setError("Please fill in all required fields: Name, Amount, and Frequency.");
        return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('amount', amount);
    formData.append('is_active', String(isActive));
    formData.append('frequency', frequency);
    formData.append('is_optional', String(isOptional));
    
    if (isEditMode && feeData) {
      formData.append('id', feeData.id);
    }

    const result = isEditMode
      ? await updateFee(formData)
      : await createFee(formData);

    setIsSubmitting(false);

    if (result.success) {
      onSubmitSuccess(result.message);
    } else {
      setError(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? "Edit Fee" : "Add New Fee"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
            <FaTimes size={20} />
          </button>
        </div>

        {/* Form Fields... */}
        <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Fee Name <span className="text-red-500">*</span></label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={isSubmitting} />
        </div>
        <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (NGN) <span className="text-red-500">*</span></label>
            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={isSubmitting} />
        </div>
        <div className="mb-4">
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">Frequency <span className="text-red-500">*</span></label>
            <select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={isSubmitting}>
              <option value="" disabled>Select a frequency</option>
              <option value="per_semester">Per Semester</option>
              <option value="once_on_registration">Once on Registration</option>
              <option value="annual">Annual</option>
            </select>
        </div>
        <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isSubmitting} />
        </div>
        <div className="mb-6 flex space-x-8">
            <label htmlFor="is_optional" className="flex items-center cursor-pointer">
              <input type="checkbox" id="is_optional" checked={isOptional} onChange={(e) => setIsOptional(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" disabled={isSubmitting} />
              <span className="ml-2 text-sm text-gray-700">Optional Fee</span>
            </label>
            <label htmlFor="is_active" className="flex items-center cursor-pointer">
              <input type="checkbox" id="is_active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" disabled={isSubmitting} />
              <span className="ml-2 text-sm text-gray-700">Active Fee</span>
            </label>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm">
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50" disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center" disabled={isSubmitting}>
            {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : null}
            {isSubmitting ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Fee" : "Save Fee")}
          </button>
        </div>
      </form>
    </div>
  );
}