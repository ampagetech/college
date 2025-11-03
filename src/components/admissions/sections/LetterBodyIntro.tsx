// C:\DevWeb\jewel-univ-apply\src\components\admissions\sections\LetterBodyIntro.tsx
'use client';

interface LetterBodyIntroProps {
  studentFullName: string;
  courseName: string;
  degreeType: string;
  facultyName: string;
  academicSessionName: string;
  acceptanceFeeAmountFormatted?: string;
}

const LetterBodyIntro: React.FC<LetterBodyIntroProps> = ({
  studentFullName,
  courseName,
  degreeType,
  facultyName,
  academicSessionName,
  acceptanceFeeAmountFormatted,
}) => {
  return (
    <section className="text-gray-700 text-justify leading-relaxed">
      <p className="mb-4">
        Dear <strong className="font-semibold">{studentFullName}</strong>,
      </p>

      <h2 className="text-xl font-bold text-center uppercase mb-4 tracking-wide">
        OFFER OF PROVISIONAL ADMISSION
      </h2>

      <p className="mb-3">
        I am pleased to inform you that you have been offered provisional admission into the{' '}
        <strong className="font-semibold">{degreeType} {courseName}</strong> degree course
        in the <strong className="font-semibold">{facultyName}</strong> for the{' '}
        <strong className="font-semibold">{academicSessionName}</strong> academic session.
      </p>
      <p className="mb-3">
        This provisional admission is subject to the verification and confirmation of the credentials
        submitted in support of your application.
      </p>
      <p className="mb-3">
        1. The commencement of the <strong className="font-semibold">{academicSessionName}</strong> academic session shall be communicated to
        you with subsequent registration and orientation thereafter.
      </p>
      <p className="mb-3">
        2. You are to pay a non-refundable acceptance fee of{' '}
        <strong className="font-semibold">{acceptanceFeeAmountFormatted || 'the specified amount'}</strong> to confirm your
        admission. In order to register as a student, you are also expected to pay the
        following fees per semester on or before orientation:
      </p>
    </section>
  );
};

export default LetterBodyIntro;