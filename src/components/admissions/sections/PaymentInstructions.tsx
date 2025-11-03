// C:\DevWeb\jewel-univ-apply\src\components\admissions\sections\PaymentInstructions.tsx
'use client';

interface PaymentInstructionsProps {
  bankAccountHolderName?: string;
  bank1Name?: string;
  bank1AccountNumber?: string;
  bank2Name?: string;
  bank2AccountNumber?: string;
  universityWebsite?: string;
}

const PaymentInstructions: React.FC<PaymentInstructionsProps> = ({
  bankAccountHolderName,
  bank1Name,
  bank1AccountNumber,
  bank2Name,
  bank2AccountNumber,
  universityWebsite,
}) => {
  return (
    <section className="mt-6 text-gray-700 leading-relaxed">
      <p className="mb-3">
        3. Payments are to be made to any of the following bank accounts:
      </p>
      <ul className="list-none pl-0 mb-3 space-y-1 text-sm">
        {bank1Name && bank1AccountNumber && (
          <li>
            i. Account Name:{' '}
            <strong className="font-semibold">{bankAccountHolderName || 'Jewel University Gombe'}</strong>, Bank:{' '}
            <strong className="font-semibold">{bank1Name}</strong>, Account Number:{' '}
            <strong className="font-semibold">{bank1AccountNumber}</strong>
          </li>
        )}
        {bank2Name && bank2AccountNumber && (
          <li>
            ii. Account Name:{' '}
            <strong className="font-semibold">{bankAccountHolderName || 'Jewel University Gombe'}</strong>, Bank:{' '}
            <strong className="font-semibold">{bank2Name}</strong>, Account Number:{' '}
            <strong className="font-semibold">{bank2AccountNumber}</strong>
          </li>
        )}
      </ul>
      <p className="mb-3">
        4. Copy of evidence of payment should be uploaded on the school portal and also
        submitted to the registry office.
      </p>
      {universityWebsite && (
        <p className="mb-3">
          5. Kindly visit our website <a href={`https://${universityWebsite}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">{universityWebsite}</a> for more information, guidance and
          regular updates.
        </p>
      )}
    </section>
  );
};

export default PaymentInstructions;