// C:\DevWeb\jewel-univ-apply\src\components\home\ApplicantHomePageContent.tsx
'use client';

interface User {
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface ApplicantHomePageProps {
  user?: User | null;
}

export default function ApplicantHomePageContent({ user }: ApplicantHomePageProps) {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, Applicant {user?.name || user?.email || ''}!
      </h1>
      <p className="mb-4 text-lg">
        Thank you for your interest in Jewel University.
      </p>
      <div className="bg-sky-100 border-l-4 border-sky-500 text-sky-700 p-4 mb-6 rounded-md shadow" role="alert">
        <p className="font-bold">Your Application Portal</p>
        <p>
          Use the sidebar menu to manage your application, check its status, upload required documents,
          and complete any pending tasks.
        </p>
      </div>
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="text-xl font-semibold mb-2">Next Steps:</h3>
        <ul className="list-disc list-inside text-gray-700">
          <li>Ensure your profile information is complete and up-to-date.</li>
          <li>Check for any outstanding document requests.</li>
          <li>Monitor your application status regularly.</li>
        </ul>
      </div>
    </main>
  );
}