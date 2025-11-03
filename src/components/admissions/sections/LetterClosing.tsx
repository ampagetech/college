// C:\DevWeb\jewel-univ-apply\src\components\admissions\sections\LetterClosing.tsx
'use client';

import Image from 'next/image';

interface LetterClosingProps {
  acceptanceDeadlineFormatted: string;
  contactPhone1?: string;
  contactPhone2?: string;
  registrarName?: string;
  universityName?: string;
  signatureDataUri?: string;
}

const LetterClosing: React.FC<LetterClosingProps> = ({
  acceptanceDeadlineFormatted,
  contactPhone1,
  contactPhone2,
  registrarName,
  universityName = "Jewel University Gombe",
  signatureDataUri,
}) => {
  const signatureSrc = signatureDataUri || "/official-sign.svg";

  return (
    <section className="mt-8 text-gray-700 leading-relaxed">
      <p className="mb-3">
        6. This offer of admission, once accepted, bounds you to the rules and regulations of{' '}
        <strong className="font-semibold">{universityName}</strong>.
        Kindly note that admission will lapse on failure to accept the offer of admission (by paying the acceptance fee)
        within two weeks from the date of issuance (by <strong className="font-semibold">{acceptanceDeadlineFormatted}</strong>).
      </p>
      {(contactPhone1 || contactPhone2) && (
        <p className="mb-3">
          7. For further enquiries please contact us on{' '}
          {contactPhone1 && <strong className="font-semibold">{contactPhone1}</strong>}
          {contactPhone1 && contactPhone2 && ' or '}
          {contactPhone2 && <strong className="font-semibold">{contactPhone2}</strong>}.
        </p>
      )}
      <p className="mb-6">8. Congratulations.</p>

      <div className="mt-12">
        <p className="mb-1">Sincerely,</p>

        <div className="mb-1">
          <Image
            // FIX 4: Use the new dynamic source variable
            src={signatureSrc}
            alt="Official Registrar Signature"
            width={200}
            height={71}
            className="max-w-[200px] h-auto"
          />
        </div>

        <p className="font-bold uppercase tracking-wide">
          {registrarName || 'UNIVERSITY REGISTRAR'}
        </p>
        <p className="text-sm font-semibold">REGISTRAR</p>
      </div>
    </section>
  );
};

export default LetterClosing;