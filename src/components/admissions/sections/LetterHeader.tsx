// C:\DevWeb\jewel-univ-apply\src\components\admissions\sections\LetterHeader.tsx
'use client';

import Image from 'next/image';

interface LetterHeaderProps {
  universityName: string;
  universityMotto?: string;
  registrarOfficeTitle?: string;
  academicDirectorateTitle?: string;
  currentYear: string;
  admissionRef: string;
  admissionDateFormatted: string;
  logoDataUri?: string;
}

const LetterHeader: React.FC<LetterHeaderProps> = ({
  universityName,
  universityMotto,
  registrarOfficeTitle,
  academicDirectorateTitle,
  admissionRef,
  admissionDateFormatted,
  logoDataUri,
}) => {
  return (
    <header className="mb-8 md:mb-10 text-center">
      {/* University Logo */}
      <div className="mb-2 md:mb-4">
        {logoDataUri ? (
          <div className="relative mx-auto h-20 w-20 md:h-24 md:w-24" style={{ maxHeight: '96px' }}>
            <Image
              src={logoDataUri}
              alt={`${universityName} Logo`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 80px, 96px"
            />
          </div>
        ) : (
          <div className="h-16 w-16 md:h-20 md:w-20 bg-gray-300 mx-auto rounded-full flex items-center justify-center text-sm text-gray-600">
            Logo
          </div>
        )}
      </div>

      <h1 className="text-xl md:text-2xl font-bold uppercase text-gray-800 tracking-wide">
        {universityName}
      </h1>
      {universityMotto && (
        <p className="text-xs md:text-sm italic text-gray-600">{universityMotto}</p>
      )}
      {registrarOfficeTitle && (
        <p className="text-sm md:text-md font-semibold text-gray-700 mt-1">{registrarOfficeTitle}</p>
      )}
      {academicDirectorateTitle && (
        <p className="text-md md:text-lg font-bold uppercase text-gray-800 mt-2 md:mt-4 tracking-wider">
          {academicDirectorateTitle}
        </p>
      )}

      {/* Reference Number and Date Section */}
      <div className="mt-6 md:mt-8 text-xs md:text-sm text-gray-700 flex justify-between items-center">
        <p className="text-left">
          <span className="font-semibold">Our Ref:</span> {admissionRef}
        </p>
        <p className="text-right">
          <span className="font-semibold">Date:</span> {admissionDateFormatted}
        </p>
      </div>
      <hr className="mt-2 border-gray-300" />
    </header>
  );
};

export default LetterHeader;
