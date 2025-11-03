// src/components/admissions/AdmissionLetterView.tsx
'use client';

import React from 'react';
import { AdmissionLetterData } from '@/types/admission';

import LetterHeader from './sections/LetterHeader';
import LetterBodyIntro from './sections/LetterBodyIntro';
import FeesBreakdown from './sections/FeesBreakdown'; // Import the new parent component
import LetterClosing from './sections/LetterClosing';

interface AdmissionLetterViewProps {
  letterData: AdmissionLetterData; // Use the specific, strong type for safety
}

const AdmissionLetterView: React.FC<AdmissionLetterViewProps> = ({ letterData }) => {
  // Graceful handling if for some reason the data object is null or undefined
  if (!letterData) {
    return (
      <div className="p-6 border rounded-md text-center text-red-500">
        Admission letter data is not available. Please try again later.
      </div>
    );
  }

  return (
    <div
      className="bg-white p-8 md:p-12 shadow-lg rounded-md border border-gray-200 text-gray-800 print:shadow-none print:border-none print:p-0"
      style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
    >
      <LetterHeader
        universityName={letterData.universityName}
        universityMotto={letterData.universityMotto}
        registrarOfficeTitle={letterData.registrarOfficeTitle}
        academicDirectorateTitle={letterData.academicDirectorateTitle}
        currentYear={letterData.currentYear}
        admissionRef={letterData.admissionRef}
        admissionDateFormatted={letterData.admissionDateFormatted}
        logoDataUri={letterData.logoDataUri}
      />

      <main className="mt-8 space-y-6">
        <LetterBodyIntro
          studentFullName={letterData.studentFullName}
          courseName={letterData.courseName}
          degreeType={letterData.degreeType}
          facultyName={letterData.facultyName}
          academicSessionName={letterData.academicSessionName}
          acceptanceFeeAmountFormatted={letterData.acceptanceFeeAmountFormatted}
        />

        {/* This single component now renders all the fee tables and payment info */}
        <FeesBreakdown
          compulsoryPerSemesterFees={letterData.compulsoryPerSemesterFees}
          totalCompulsoryPerSemester={letterData.totalCompulsoryPerSemester}
          compulsoryOnceOnRegistrationFees={letterData.compulsoryOnceOnRegistrationFees}
          totalCompulsoryOnceOnRegistration={letterData.totalCompulsoryOnceOnRegistration}
          optionalFees={letterData.optionalFees}
          bankAccountHolderName={letterData.bankAccountHolderName}
          bank1Name={letterData.bank1Name}
          bank1AccountNumber={letterData.bank1AccountNumber}
          bank2Name={letterData.bank2Name}
          bank2AccountNumber={letterData.bank2AccountNumber}
        />

        <LetterClosing
          acceptanceDeadlineFormatted={letterData.acceptanceDeadlineFormatted}
          contactPhone1={letterData.contactPhone1}
          contactPhone2={letterData.contactPhone2}
          registrarName={letterData.registrarName}
          signatureDataUri={letterData.signatureDataUri}
        />
      </main>
    </div>
  );
};

export default AdmissionLetterView;