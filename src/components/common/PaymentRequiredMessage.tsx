// src/components/common/PaymentRequiredMessage.tsx
'use client';

import { useRouter } from 'next/navigation';

interface PaymentRequiredMessageProps {
  /** The color scheme and icon to use. 'error' is red, 'warning' is yellow. */
  variant: 'error' | 'warning';
  /** The main heading of the message box. */
  title: string;
  /** The detailed paragraph of text. */
  description: string;
  /** The text to display on the button. */
  buttonText: string;
  /** The action the button will perform. */
  actionType: 'payment' | 'refresh';
  /** The path to redirect to if actionType is 'payment'. */
  redirectPath?: string;
}

export default function PaymentRequiredMessage({
  variant,
  title,
  description,
  buttonText,
  actionType,
  redirectPath,
}: PaymentRequiredMessageProps) {
  const router = useRouter();

  const handleClick = () => {
    if (actionType === 'refresh') {
      window.location.reload();
    } else if (actionType === 'payment' && redirectPath) {
      // Use Next.js router for client-side navigation
      router.push(redirectPath);
    }
  };

  const isError = variant === 'error';

  // Dynamic classes for colors
  const containerClasses = isError
    ? 'bg-red-50 border-red-400'
    : 'bg-yellow-50 border-yellow-400';
  const iconContainerClasses = isError ? 'bg-red-100' : 'bg-yellow-100';
  const iconClasses = isError ? 'text-red-600' : 'text-yellow-600';
  const titleClasses = isError ? 'text-red-800' : 'text-yellow-800';
  const descriptionClasses = isError ? 'text-red-700' : 'text-yellow-700';
  const buttonClasses = isError
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div className={`border-l-4 p-6 rounded-r-lg text-center ${containerClasses}`}>
      <div className={`flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full ${iconContainerClasses}`}>
        <svg className={`w-6 h-6 ${iconClasses}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className={`text-lg font-semibold mb-2 ${titleClasses}`}>
        {title}
      </h3>
      <p className={`mb-4 ${descriptionClasses}`}>
        {description}
      </p>
      <button
        onClick={handleClick}
        className={`inline-flex items-center px-6 py-2 font-semibold rounded-md transition-colors ${buttonClasses}`}
      >
        {buttonText}
      </button>
    </div>
  );
}