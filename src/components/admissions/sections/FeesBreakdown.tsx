// src/components/admissions/sections/FeesBreakdown.tsx
'use client';

import React from 'react';
import { Fee } from '@/types/admission';
import FeesBreakdownTable from './FeesBreakdownTable'; // Import your reusable component

// Define the props this new parent component will accept
interface FeesBreakdownProps {
  compulsoryPerSemesterFees: Fee[];
  totalCompulsoryPerSemester: number;
  compulsoryOnceOnRegistrationFees: Fee[];
  totalCompulsoryOnceOnRegistration: number;
  optionalFees: Fee[];
  bankAccountHolderName?: string;
  bank1Name?: string;
  bank1AccountNumber?: string;
  bank2Name?: string;
  bank2AccountNumber?: string;
}

const FeesBreakdown: React.FC<FeesBreakdownProps> = ({
  compulsoryPerSemesterFees,
  totalCompulsoryPerSemester,
  compulsoryOnceOnRegistrationFees,
  totalCompulsoryOnceOnRegistration,
  optionalFees,
  bankAccountHolderName,
  bank1Name,
  bank1AccountNumber,
  bank2Name,
  bank2AccountNumber,
}) => {
  return (
    <div className="space-y-6 text-sm">
      {/* SECTION 1: COMPULSORY - ONCE ON REGISTRATION */}
      <FeesBreakdownTable
        title="A) COMPULSORY FEES (Once on Registration)"
        fees={compulsoryOnceOnRegistrationFees}
        totalAmount={totalCompulsoryOnceOnRegistration}
      />

      {/* SECTION 2: COMPULSORY - EVERY SEMESTER */}
      <FeesBreakdownTable
        title="B) COMPULSORY FEES (Every Semester)"
        fees={compulsoryPerSemesterFees}
        totalAmount={totalCompulsoryPerSemester}
      />
      
      {/* SECTION 3: OPTIONAL FEES */}
      <FeesBreakdownTable
        title="C) OPTIONAL FEES"
        fees={optionalFees}
        // No totalAmount prop is passed, so the total row won't render
      />

      {/* Payment Instructions Section */}
      <div className="pt-4 border-t border-gray-200">
        <p className="font-semibold text-gray-700">Payments are to be made to any of the following bank accounts:</p>
       
        <p className="mt-1">Account Name: {bankAccountHolderName || 'N/A'}, Bank: {bank1Name || 'N/A'}, Account Number: {bank1AccountNumber || 'N/A'}</p>
        <p className="mt-1">Account Name: {bankAccountHolderName || 'N/A'}, Bank: {bank2Name || 'N/A'}, Account Number: {bank2AccountNumber || 'N/A'}</p>

      </div>
    </div>
  );
};

export default FeesBreakdown;