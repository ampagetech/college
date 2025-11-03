// C:\DevWeb\jewel-univ-apply\src\app\(auth)\signin\page.tsx
'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { PATHS } from '@/lib/constants';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      const targetPath = PATHS.HOME; // Redirect all roles to homepage
      console.log('[SignIn Page] Redirecting to:', targetPath);
      if (window.location.pathname !== targetPath) {
        router.push(targetPath);
      }
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SignIn Page] handleSubmit initiated.');

    if (!email || !password) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);
    setError('');
    console.log('[SignIn Page] Calling signIn("credentials")...');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.toLowerCase(),
        password,
      });

      console.log('[SignIn Page] signIn call completed. Result:', result);

      if (result?.error) {
        console.error('[SignIn Page] Sign in error:', result.error);
        setError('Invalid email or password');
        setIsLoading(false);
      } else if (result?.ok) {
        console.log('[SignIn Page] signIn successful. Waiting for session update...');
        // Redirect handled by useEffect
      } else {
        console.warn('[SignIn Page] Unexpected signIn result:', result);
        setError('Sign in process returned an unexpected status.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[SignIn Page] Exception during signIn:', error);
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading session...</div>;
  }

  if (status === 'authenticated') {
    return <div className="flex justify-center items-center min-h-screen">Redirecting...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don’t have an account?{' '}
            <Link href={PATHS.REGISTER} className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}