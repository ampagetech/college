// --- START OF FILE page.tsx ---
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaEnvelope, FaMobileAlt, FaUser, FaChevronRight } from 'react-icons/fa';
import { ROLES } from '@/lib/constants';
import { PATHS } from '@/lib/constants';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobilePassword, setMobilePassword] = useState('');
  const [confirmMobilePassword, setConfirmMobilePassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Fixed role for applicants
  const applicantRole = ROLES.APPLICANT; // Ensure ROLES.APPLICANT is 'applicant' in constants.ts

  // --- Updated Validation Function ---
  // Validates Nigerian-style mobile number: 11 digits, starting with 0
  const isValidMobileNumber = (mobile: string): boolean => {
    const cleanedMobile = mobile.replace(/\s+/g, ''); // Remove spaces
    const mobileRegex = /^0[0-9]{10}$/; // Must start with 0, followed by 10 digits
    return mobileRegex.test(cleanedMobile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedMobile = mobilePassword.replace(/\s+/g, '');
    const cleanedConfirmMobile = confirmMobilePassword.replace(/\s+/g, '');

    if (!name || !email || !cleanedMobile || !cleanedConfirmMobile) {
      setError('All fields are required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // --- Updated Mobile Number Validation Check ---
    if (!isValidMobileNumber(cleanedMobile)) {
      setError(
        'Mobile number (password) must be exactly 11 digits and start with 0 (e.g., 08012345678).'
      );
      return;
    }

    if (cleanedMobile !== cleanedConfirmMobile) {
      setError('Mobile numbers entered as temporary passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: cleanedMobile, // Send the cleaned mobile number
          role: applicantRole, // Send the fixed applicant role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      router.push(`${PATHS.SIGNIN}?registered=true`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during registration.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-200 to-sky-200 p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* University Header Band */}
        <div className="bg-sky-100 p-6 text-center">
          <div className="flex justify-center items-center mb-3 space-x-4">
            <Image
              src="/logo.png"
              alt="Jewel University Logo"
              width={40}
              height={40}
              className="rounded-sm"
              priority // Add priority if logo is Above The Fold (improves LCP)
            />
            <h2 className="text-xl sm:text-2xl font-semibold text-sky-800">
              School Portal
            </h2>
          </div>
          <p className="text-lg font-medium text-gray-700">New Student Admission</p>
        </div>

        <div className="p-8 sm:p-10">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-3">
            Create Your Account
          </h1>

          <p className="text-center text-sm text-gray-600 mb-2 leading-relaxed">
            Use your valid email as username and your working mobile number as
            your password.
            <br />
            <span className="font-medium">
              (This is temporary and once admitted you will change to a real
              password)
            </span>
          </p>

          <div className="text-center text-sm text-gray-600 mb-6">
            Already have an account?{' '}
            <Link
              href={PATHS.SIGNIN}
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Sign In Here
            </Link>
          </div>

          {error && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-6"
              role="alert"
            >
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1.5"
                htmlFor="name"
              >
                Full Name
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); }}
                  className="pl-11 w-full p-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1.5"
                htmlFor="email"
              >
                Email Address (Your Username)
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); }}
                  className="pl-11 w-full p-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1.5"
                htmlFor="mobilePassword"
              >
                Mobile Number (Your Temporary Password)
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <FaMobileAlt className="text-gray-400" />
                </div>
                <input
                  id="mobilePassword"
                  type="tel" // Use tel for better mobile keyboard, or password to mask
                  inputMode="numeric" // Hint for numeric keyboard
                  value={mobilePassword}
                  onChange={(e) => { setMobilePassword(e.target.value); }}
                  className="pl-11 w-full p-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="e.g., 08012345678"
                  required
                  minLength={11} // Enforce min length
                  maxLength={11} // Enforce max length
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1.5"
                htmlFor="confirmMobilePassword"
              >
                Confirm Mobile Number (Temporary Password)
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <FaMobileAlt className="text-gray-400" />
                </div>
                <input
                  id="confirmMobilePassword"
                  type="tel" // Or type="password" to mask
                  inputMode="numeric"
                  value={confirmMobilePassword}
                  onChange={(e) => { setConfirmMobilePassword(e.target.value); }}
                  className="pl-11 w-full p-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Re-enter 11-digit mobile number"
                  required
                  minLength={11}
                  maxLength={11}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-3.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-150 ease-in-out group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  {/* SVG Spinner */}
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  Register
                  <FaChevronRight className="ml-2 h-4 w-4 transition-transform duration-150 ease-in-out group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
// --- END OF FILE page.tsx ---