// src/app/(dashboard)/documents/page.tsx

import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { FaInfoCircle } from 'react-icons/fa';
import { Suspense } from 'react';

import DocumentUploadForm from '@/components/documents/DocumentUploadForm';
import ScrollToTop from '@/components/common/ScrollToTop';
import { PATHS } from '@/lib/constants';

// --- CORRECTED IMPORTS ---
import PaymentRequiredMessage from '@/components/common/PaymentRequiredMessage';
import PaymentVerificationLoading from '@/components/common/PaymentVerificationLoading';
import { getCurrentUserPaymentStatus } from '@/app/(dashboard)/applications/bio-data/actions';

// --- ASYNC COMPONENT FOR THE ACTUAL PAGE CONTENT ---
async function DocumentsContent({ userId }: { userId: string }) {
  const supabase = createClient();

  const { data: documentData, error } = await supabase
    .from('application_documents')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Database fetch error:", error);
    return (
        <div className="text-red-500 p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Documents</h2>
          <p>There was an error loading your document data. Please try again later.</p>
        </div>
    );
  }
  
  const isEditMode = documentData !== null;

  return (
    <>
      {isEditMode && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Status</h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">Status:</span>{' '}
              <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                documentData.status === 'approved' ? 'bg-green-100 text-green-800' :
                documentData.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {documentData.status ? documentData.status.charAt(0).toUpperCase() + documentData.status.slice(1) : 'Pending'}
              </span>
            </p>
            {documentData.admin_comment && (
              <p className="text-gray-700">
                <span className="font-medium">Admin Comment:</span> {documentData.admin_comment}
              </p>
            )}
          </div>
        </div>
      )}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Update Your Documents' : 'Upload Your Documents'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode
            ? 'Update your required documents below. You can view existing documents and upload new ones to replace them.'
            : 'Upload your required documents below. All documents will be saved to your application.'
          }
        </p>
      </header>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start">
          <FaInfoCircle className="text-blue-500 text-xl mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-1">Guidelines</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
              <li>Ensure all documents are clear and up-to-date.</li>
              <li>Uploading a new file will replace the previous one.</li>
              <li>Maximum file size for each document is 5MB.</li>
              <li>Supported formats: PDF, JPG, JPEG, PNG.</li>
              {isEditMode && <li>Click "View" to see your current documents.</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <DocumentUploadForm initialData={documentData} isEditMode={isEditMode} />
      </div>
    </>
  );
}

// --- MAIN PAGE COMPONENT WITH CORRECTED CONDITIONAL LOGIC ---
export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    redirect(PATHS.SIGNIN + `?callbackUrl=${encodeURIComponent(PATHS.DOCUMENTS)}`);
  }

  // Check if we can skip payment verification because the user just came from the bio-data page.
  const paymentVerifiedFromBioData = searchParams?.payment_verified === 'true';

  // If the user navigated here directly, we must perform the payment check.
  if (!paymentVerifiedFromBioData) {
    const paymentStatus = await getCurrentUserPaymentStatus();

    // Handle payment verification errors using the new component
    if (paymentStatus.error) {
      return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <PaymentRequiredMessage
            variant="error" // FIX: Corrected the typo here
            title="Payment Verification Error"
            description="An error occurred while checking your payment status. Please try again."
            buttonText="Try Again"
            actionType="refresh"
          />
        </div>
      );
    }
    
    // Handle case where payment is not completed using the new component
    if (!paymentStatus.hasPaid) {
      return (
       <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
           <PaymentRequiredMessage
             variant="error"
             title="Payment Required"
             description="You Must Pay Application Fee and be Confirmed by Admin  before you can Upload Documents."
             buttonText="Pay Application Fee"
             actionType="payment"
             redirectPath={PATHS.PAYMENTS}
           />
       </div>
      );
   }
  }

  // If we reach here, payment is confirmed (either by skipping the check or by passing it). Show the content.
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <ScrollToTop />
      <Suspense fallback={<PaymentVerificationLoading />}>
        <DocumentsContent userId={session.user.id} />
      </Suspense>
    </div>
  );
}