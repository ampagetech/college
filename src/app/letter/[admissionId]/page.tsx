// src/app/letter/[admissionId]/page.tsx

import { getMyAdmissionLetter, getHtmlLetterDataForAdmin } from '@/lib/actions/admission-actions';
import AdmissionLetterView from '@/components/admissions/AdmissionLetterView';
import DownloadLetterButton from '@/components/admissions/DownloadLetterButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

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

interface PageProps {
  params: {
    admissionId: string;
  };
}

export default async function LetterPage({ params }: PageProps) {
  const { admissionId } = params;

  let letterData;

  // If admissionId is 'me' or 'my-letter', get current user's letter
  if (admissionId === 'me' || admissionId === 'my-letter') {
    letterData = await getMyAdmissionLetter();
  } else {
    // For admin viewing specific applicant, use the same data format as applicant
    letterData = await getHtmlLetterDataForAdmin(admissionId);
  }

  // If no letter is found, show a friendly message
  if (!letterData) {
    return (
      <div className="container mx-auto py-10">
        <ErrorDisplayCard
          title="Admission Letter Not Available"
          description="The admission letter could not be found. This usually means the admission has not been confirmed by an administrator, or you don't have permission to view this letter."
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
              <CardTitle className="text-2xl font-bold">Admission Letter</CardTitle>
              <CardDescription>
                Provisional Offer of Admission (Ref: {letterData.admissionRef})
              </CardDescription>
            </div>
            {/* Always show download button for admin and use same component as applicant */}
            <DownloadLetterButton 
              admissionId={admissionId}
              isStudentView={false}  // This is admin view, so false
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