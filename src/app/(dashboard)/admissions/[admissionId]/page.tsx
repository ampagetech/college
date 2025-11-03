// C:\DevWeb\jewel-univ-apply\src\app\(dashboard)\admissions\[admissionId]\page.tsx
import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust if your authOptions path is different
import AdmissionDetailsDisplay from '@/components/admissions/AdmissionDetailsDisplay'; // We'll create this component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming ShadCN UI
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { fetchAdmissionDetailsForStudent } from '@/lib/data/admissions'; // We'll need a data fetching function

interface StudentAdmissionDetailsPageProps {
  params: {
    admissionId: string;
  };
}

export default async function StudentAdmissionDetailsPage({ params }: StudentAdmissionDetailsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin'); // Or your sign-in path
  }

  const { admissionId } = params;

  if (!admissionId) {
    notFound(); // Or redirect to admissions list
  }

  // Fetch admission details server-side for initial render
  // This function should also handle authorization (is this admission for this user?)
  const admissionDetails = await fetchAdmissionDetailsForStudent(admissionId, session.user.id);

  if (!admissionDetails) {
    notFound(); // Or show an error message/redirect
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Admission Details</CardTitle>
              <CardDescription>
                Detailed information for admission reference: {admissionDetails.admission_ref}
              </CardDescription>
            </div>
            <Link href={`/admissions/${admissionId}/letter`}>
              <Button>View Admission Letter</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<AdmissionDetailsLoading />}>
            <AdmissionDetailsDisplay admission={admissionDetails} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

const AdmissionDetailsLoading = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-6 bg-gray-300 rounded w-2/3 animate-pulse"></div>
          </div>
        ))}
      </div>
      <div className="h-10 bg-gray-300 rounded w-1/4 animate-pulse mt-4"></div>
    </div>
  );
};