'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Component that uses useSearchParams
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: { [key: string]: string } = {
    CredentialsSignin: 'Invalid email or password. Please try again.',
    SessionRequired: 'You must be signed in to access this page.',
    AccessDenied: 'You do not have permission to access this page.',
    default: 'An unexpected error occurred during authentication.',
  };

  const message = errorMessages[error || 'default'];

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h1>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <Link 
            href="/auth/signin" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md"
          >
            Back to Sign In
          </Link>
          <Link 
            href="/" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-md"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function ErrorLoading() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-600">Loading...</h1>
        <p className="text-gray-500">Please wait...</p>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function ErrorPage() {
  return (
    <Suspense fallback={<ErrorLoading />}>
      <ErrorContent />
    </Suspense>
  );
}