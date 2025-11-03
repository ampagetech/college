// C:\DevWeb\jewel-univ-apply\src\components\common\StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  status: string | null | undefined; // Allow for null or undefined status
  type?: 'user' | 'payment' | 'document' | 'application' | 'admission' | 'general'; // Optional type prop for context
  className?: string; // Allow passing additional class names
}

export default function StatusBadge({ status, type = 'general', className = '' }: StatusBadgeProps) {
  // Normalize the status for consistent handling and display
  // Handles potential mixed casing from DB and replaces underscores for display
  const normalizedStatus = status ? status.toLowerCase().replace(/_/g, ' ') : 'unknown';
  
  // Determine display text (capitalize first letter of each word for better readability)
  const displayText = normalizedStatus
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const getStatusStyles = (s: string): string => {
    const baseClasses = 'px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full';
    let statusSpecificClasses = '';

    switch (s) {
      // User Statuses (type 'user')
      case 'active':
        statusSpecificClasses = `bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100`;
        break;
      case 'inactive':
        statusSpecificClasses = `bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100`;
        break;
      case 'suspended':
        statusSpecificClasses = `bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-orange-100`;
        break;
      case 'terminated':
        statusSpecificClasses = `bg-pink-100 text-pink-800 dark:bg-pink-700 dark:text-pink-100`;
        break;

      // Payment Statuses (type 'payment')
      case 'pending': // Catches payment 'PENDING' or any other 'pending'
        statusSpecificClasses = `bg-yellow-100 text-yellow-800 dark:bg-yellow-500 dark:text-yellow-100`;
        break;
      case 'confirmed': // Could be payment or admission confirmed
      case 'paid':
      case 'succeeded':
        // If type is admission, use a specific color, otherwise default to sky for payment
        if (type === 'admission' && s === 'confirmed') {
            statusSpecificClasses = `bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100`; // Use green for confirmed admission
        } else {
            statusSpecificClasses = `bg-sky-100 text-sky-800 dark:bg-sky-600 dark:text-sky-100`;
        }
        break;
      case 'failed':
        statusSpecificClasses = `bg-red-100 text-red-800 dark:bg-red-600 dark:text-red-100`;
        break;
      case 'rejected': // Can be payment, document, or admission rejected
        statusSpecificClasses = `bg-red-200 text-red-900 dark:bg-red-700 dark:text-red-200`;
        break;

      // Document Statuses (type 'document')
      case 'pending review':
        statusSpecificClasses = `bg-yellow-100 text-yellow-800 dark:bg-yellow-500 dark:text-yellow-100`;
        break;
      case 'approved':
        statusSpecificClasses = `bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100`;
        break;
      case 'needs revision':
        statusSpecificClasses = `bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-blue-100`;
        break;
      
      // Application Statuses (type 'application')
      case 'submitted':
        statusSpecificClasses = `bg-indigo-100 text-indigo-800 dark:bg-indigo-600 dark:text-indigo-100`;
        break;
      case 'under review': // Could also be 'pending review'
        statusSpecificClasses = `bg-purple-100 text-purple-800 dark:bg-purple-600 dark:text-purple-100`;
        break;
      case 'draft':
         statusSpecificClasses = `bg-gray-100 text-gray-700 dark:bg-gray-500 dark:text-gray-200`;
         break;

      // Admission Statuses (type 'admission') - NEW
      case 'provisional':
        statusSpecificClasses = `bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-blue-100`; // Example: Blue for provisional
        break;
      // 'confirmed' and 'rejected' for admissions will use the styles defined above.
      case 'expired':
        statusSpecificClasses = `bg-neutral-200 text-neutral-700 dark:bg-neutral-600 dark:text-neutral-100`; // Example: Neutral gray/brown for expired
        break;

      // Default for unknown or unhandled statuses
      case 'unknown':
      default:
        if (process.env.NODE_ENV === 'development' && s !== 'unknown') {
          console.warn(`StatusBadge: Unhandled status type "${status}" (normalized to "${s}") of type "${type}"`);
        }
        statusSpecificClasses = `bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300`;
    }
    return `${baseClasses} ${statusSpecificClasses} ${className}`;
  };

  return (
    <span className={getStatusStyles(normalizedStatus)}>
      {displayText}
    </span>
  );
}