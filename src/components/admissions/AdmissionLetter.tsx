// src/components/admissions/AdmissionLetter.tsx
'use client';

import Image from 'next/image';
import { AdmissionLetterData, Fee } from '@/types/admission';

const FeeTable = ({ title, fees, total }: { title: string; fees: Fee[]; total: number }) => {
  if (!fees || fees.length === 0) {
    return null;
  }
  const formatCurrency = (amount: number) => amount.toLocaleString('en-NG', { minimumFractionDigits: 2 });

  return (
    <div className="mb-6">
      <h3 className="font-bold text-md mb-2">{title}</h3>
      <table className="w-full border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">Description</th>
            <th className="border border-gray-300 p-2 text-right">Amount (NGN)</th>
          </tr>
        </thead>
        <tbody>
          {fees.map((fee) => (
            <tr key={fee.name}>
              <td className="border border-gray-300 p-2">{fee.name}</td>
              <td className="border border-gray-300 p-2 text-right">{formatCurrency(fee.amount)}</td>
            </tr>
          ))}
          <tr className="font-bold bg-gray-50">
            <td className="border border-gray-300 p-2 text-left">Total</td>
            <td className="border border-gray-300 p-2 text-right">{formatCurrency(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const AdmissionLetter = ({ data }: { data: AdmissionLetterData }) => {
  // THE FIX: Add a fallback `|| []` to prevent crashing if the array is undefined.
  const totalOptionalFees = (data.optionalFees || []).reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <div id="admission-letter-content" className="bg-white p-8 md:p-12 font-serif text-gray-800 max-w-4xl mx-auto shadow-lg">
      {/* Page 1 */}
      <div className="page-break-after">
        <header className="text-center mb-8">
          <Image src="/logo.png" alt="University Logo" width={120} height={120} className="mx-auto" />
          <h1 className="text-2xl font-bold text-blue-800 mt-2">{data.universityName}</h1>
          <p className="text-md italic">{data.universityMotto}</p>
        </header>
        <div className="text-center font-bold mb-8">
            <p>({data.registrarOfficeTitle})</p>
            <p>{data.academicDirectorateTitle}</p>
        </div>
        <div className="mb-8">
            <p>Ref: {data.admissionRef}</p>
            <p>Date: {data.admissionDateFormatted}</p>
        </div>
        <h2 className="text-xl font-bold text-center mb-6">OFFER OF PROVISIONAL ADMISSION</h2>
        <div className="mb-6"><p>Dear {data.studentFullName},</p></div>
        <div className="space-y-4 text-justify">
          <p>I am pleased to inform you that you have been offered provisional admission into the <span className="font-bold">{data.courseName}</span> degree course in the <span className="font-bold">{data.facultyName}</span> for the <span className="font-bold">{data.academicSessionName}</span> academic session.</p>
          <p>This provisional admission is subject to the verification and confirmation of the credentials submitted in support of your application.</p>
          <p>The commencement of the {data.academicSessionName} academic session shall be communicated to you with subsequent registration and orientation thereafter.</p>
        </div>
      </div>

      {/* Page 2 */}
      <div className="page-break-after">
        <p className="mb-4">You are to pay a non-refundable acceptance fee of <span className="font-bold">{data.acceptanceFeeAmountFormatted}</span> to confirm your admission. In order to register as a student, you are also expected to pay the following fees on or before orientation:</p>
        
        {/* Use the defensive check here too, just in case */}
        <FeeTable title="A) COMPULSORY FEES (Once on Registration)" fees={data.compulsoryOnceOnRegistrationFees || []} total={data.totalCompulsoryOnceOnRegistration} />
        <FeeTable title="B) COMPULSORY FEES (Every Semester)" fees={data.compulsoryPerSemesterFees || []} total={data.totalCompulsoryPerSemester} />
        <FeeTable title="C) OPTIONAL FEES" fees={data.optionalFees || []} total={totalOptionalFees} />
        
        <div className="mt-8">
          <h3 className="font-bold text-md mb-2">Payments are to be made to any of the following bank accounts:</h3>
          <p>Account Name: {data.bankAccountHolderName}, Bank: {data.bank1Name}, Account Number: {data.bank1AccountNumber}</p>
          {data.bank2Name && data.bank2AccountNumber && (
            <p>Account Name: {data.bankAccountHolderName}, Bank: {data.bank2Name}, Account Number: {data.bank2AccountNumber}</p>
          )}
        </div>
      </div>
      
      {/* Page 3 */}
      <div>
        <p className="mb-8">This offer will lapse on failure to accept it (by paying the acceptance fee) by <span className="font-bold">{data.acceptanceDeadlineFormatted}</span>.</p>
        <p className="mb-8">Congratulations.</p>
        <p>Sincerely,</p>
        <div className="h-24"><Image src="/signature.png" alt="Signature" width={150} height={60} className="mt-2" /></div>
        <p className="font-bold">{data.registrarName}</p>
        <p>REGISTRAR</p>
      </div>
    </div>
  );
};