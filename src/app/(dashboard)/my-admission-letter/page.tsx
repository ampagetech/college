// src/app/(dashboard)/my-admission-letter/page.tsx

import { getMyAdmissionLetter } from '@/lib/actions/admission-actions';
import AdmissionLetterView from '@/components/admissions/AdmissionLetterView';
import DownloadLetterButton from '@/components/admissions/DownloadLetterButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, FileText } from 'lucide-react';

const ErrorDisplayCard = ({ title, description }: { title: string; description: string }) => (
  <Card className="border-amber-500">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-amber-600">
        <AlertCircle /> {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  </Card>
);

export default async function MyAdmissionLetterPage() {
  // Get the current user's admission letter
  const letterData = await getMyAdmissionLetter();

  // If no letter is found, show a friendly message
  if (!letterData) {
    return (
      <div className="container mx-auto py-10">
        <ErrorDisplayCard
          title="Admission Letter Not Available"
          description="Your admission letter is not yet ready. This usually means your admission has not been confirmed by an administrator. Please check back later or contact the admissions office."
        />
      </div>
    );
  }

  // If we have data, render the letter
  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                <FileText className="h-6 w-6" />
                My Admission Letter
              </CardTitle>
              <CardDescription>
                Provisional Offer of Admission (Ref: {letterData.admissionRef})
              </CardDescription>
            </div>
           

            <DownloadLetterButton 
              admissionId="me"
              isStudentView={true}  // Add this prop
            />

          </div>
        </CardHeader>
        <CardContent>
          <AdmissionLetterView letterData={letterData} />
        </CardContent>
      </Card>
    </div>
  );
}