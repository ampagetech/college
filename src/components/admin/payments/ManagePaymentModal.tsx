'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { FaTimes, FaSpinner, FaExternalLinkAlt, FaPaperclip } from 'react-icons/fa';
import { AdminPaymentView, PaymentStatus, paymentStatusLabels, AdminUpdatePaymentPayload } from '@/types/payment';
import StatusBadge from '@/components/common/StatusBadge';
import Image from 'next/image';

interface ManagePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: AdminPaymentView | null;
  onSave: (paymentId: string, data: AdminUpdatePaymentPayload) => Promise<void>;
}

export default function ManagePaymentModal({
  isOpen,
  onClose,
  payment,
  onSave,
}: ManagePaymentModalProps): JSX.Element | null {
  const [currentStatus, setCurrentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [adminComment, setAdminComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    if (payment) {
      setCurrentStatus(payment.status);
      setAdminComment(payment.admin_comment || '');
      setError(null);
      setIsSubmitting(false);
    }
  }, [payment, isOpen]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSave(payment.id, {
        status: currentStatus,
        admin_comment: adminComment.trim() === '' ? undefined : adminComment.trim(),
      });
    } catch (err: unknown) {
      console.error('Payment update failed:', err);
      const errorMessage =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'An error occurred while saving.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = currentStatus !== payment.status || adminComment !== (payment.admin_comment || '');
  const paymentFee = payment.fees;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
      <div className="relative border w-full max-w-2xl shadow-xl rounded-lg bg-white max-h-[90vh] flex flex-col">
        <form onSubmit={(e): void => void handleSubmit(e)} className="flex flex-col flex-grow">
          <div className="p-6 pb-0">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Manage Payment</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
                disabled={isSubmitting}
              >
                <FaTimes size={22} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="overflow-y-auto flex-grow px-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <strong>Name:</strong>{' '}
                <span className="text-gray-600">{payment.user.first_name || ''} {payment.user.last_name || ''}</span>
              </div>
              <div>
                <strong>Email:</strong>{' '}
                <span className="text-gray-600">{payment.user.email || 'N/A'}</span>
              </div>
              <div>
                <strong>Fee Type:</strong>{' '}
                <span className="text-gray-600">{paymentFee?.name || 'N/A'}</span>
              </div>
              {paymentFee?.description && (
                <div className="md:col-span-2">
                  <strong>Fee Description:</strong>{' '}
                  <span className="text-gray-600">{paymentFee.description}</span>
                </div>
              )}
              <div>
                <strong>Amount:</strong>{' '}
                <span className="text-gray-600 font-medium">
                  {payment.amount.toLocaleString('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div>
                <strong>Payment Date:</strong>{' '}
                <span className="text-gray-600">{new Date(payment.payment_date).toLocaleString()}</span>
              </div>
              <div>
                <strong>Submitted At:</strong>{' '}
                <span className="text-gray-600">{new Date(payment.created_at).toLocaleString()}</span>
              </div>
              {payment.transaction_reference && (
                <div>
                  <strong>Tx Reference:</strong>{' '}
                  <span className="text-gray-600">{payment.transaction_reference}</span>
                </div>
              )}
              <div>
                <strong>Current Status:</strong>
                <StatusBadge status={payment.status} />
              </div>
              {payment.processed_by_admin_id && (
                <div>
                  <strong>Processed By Admin ID:</strong>{' '}
                  <span className="text-gray-600">{payment.processed_by_admin_id}</span>
                </div>
              )}
              {payment.processed_at && (
                <div>
                  <strong>Processed At:</strong>{' '}
                  <span className="text-gray-600">{new Date(payment.processed_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-4 mt-4 border-t pt-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Update Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={currentStatus}
                  onChange={(e): void => { setCurrentStatus(e.target.value as PaymentStatus); }}
                  required
                  disabled={isSubmitting}
                  className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                >
                  {Object.entries(paymentStatusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="adminComment" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Comment (Optional)
                </label>
                <textarea
                  id="adminComment"
                  name="adminComment"
                  rows={3}
                  value={adminComment}
                  onChange={(e): void => { setAdminComment(e.target.value); }}
                  disabled={isSubmitting}
                  placeholder="Add internal notes about this payment..."
                  className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          <div className="px-6 pt-4">
            {payment.receipt_url ? (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Payment Receipt</h3>
                <div className="max-h-80 overflow-auto p-2 border border-gray-200 rounded-md bg-gray-50 flex justify-center items-center">
                  {payment.receipt_filename?.match(/\.(pdf)$/i) ? (
                    <div className="text-center">
                      <FaPaperclip className="text-5xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">{payment.receipt_filename}</p>
                      <a
                        href={payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600"
                      >
                        View PDF <FaExternalLinkAlt className="ml-2" size={12} />
                      </a>
                    </div>
                  ) : (
                    <Image
                      src={payment.receipt_url}
                      alt={`Receipt for ${payment.id}`}
                      className="max-w-full max-h-72 object-contain rounded shadow"
                      width={500}
                      height={500}
                      priority
                    />
                  )}
                </div>
                {payment.receipt_filename && !payment.receipt_filename.match(/\.(pdf)$/i) && (
                  <a
                    href={payment.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-sm text-blue-600 hover:underline inline-flex items-center"
                  >
                    Open image in new tab <FaExternalLinkAlt className="ml-1.5" size={10} />
                  </a>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 mt-2 border-t border-gray-200 pt-4">
                No receipt was uploaded for this payment.
              </div>
            )}
          </div>

          <div className="mt-auto p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasChanges}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting && <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
