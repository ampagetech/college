// C:\DevWeb\jewel-univ-apply\src\app\(dashboard)\applications\bio-data\page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import SectionPanel from '@/components/forms/SectionPanel';
import BiodataFormWrapper from '@/components/forms/BiodataFormWrapper';
import { getCurrentUserPaymentStatus, getFaculties, getCourses } from './actions';
import { createClient } from '@/lib/supabase/server';

// --- UPDATED IMPORTS ---
// Using the new, shared components from the common directory.
import PaymentRequiredMessage from '@/components/common/PaymentRequiredMessage';
import PaymentVerificationLoading from '@/components/common/PaymentVerificationLoading';
import { PATHS } from '@/lib/constants';

async function BiodataContent() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/signin');
  }

  // Fetch all required data in parallel for efficiency
  const [paymentStatus, applicationResult, faculties, courses] = await Promise.all([
    getCurrentUserPaymentStatus(),
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching application data:', error);
        return { data: null, error };
      }
      return { data, error: null };
    })(),
    getFaculties(),
    getCourses()
  ]);

  if (applicationResult.error) {
    return <div>Error loading application data. Please refresh the page.</div>;
  }

  const applicationData = applicationResult.data;

  // --- ERROR HANDLING FOR PAYMENT STATUS ---
  if (paymentStatus.error) {
    if (paymentStatus.error === 'DATABASE_ERROR') {
      return (
        <PaymentRequiredMessage
          variant="error"
          title="Database Connection Error"
          description="Unable to connect to the payment database. Please try again in a moment."
          buttonText="Try Again"
          actionType="refresh"
        />
      );
    }
    if (paymentStatus.error === 'SYSTEM_ERROR') {
      return (
        <PaymentRequiredMessage
          variant="error"
          title="System Error"
          description="A technical error occurred. Please contact support if this persists."
          buttonText="Try Again"
          actionType="refresh"
        />
      );
    }
    // Generic verification error
    return (
      <PaymentRequiredMessage
        variant="warning"
        title="Payment Verification Error"
        description="Unable to verify payment status. Please try refreshing the page."
        buttonText="Refresh Page"
        actionType="refresh"
      />
    );
  }

  // --- PAYMENT REQUIRED MESSAGE ---
  if (!paymentStatus.hasPaid) {
    return (
      <PaymentRequiredMessage
        variant="error"
        title="Payment Required"
        description="You Must Pay Application Fee and be Confirmed by Admin  before you can Fill your BioData."
        actionType="payment"
        redirectPath={PATHS.PAYMENTS}
        buttonText="Proceed to Payment" // FIX: Added the missing buttonText prop
      />
    );
  }

  // --- RENDER FORM: Payment completed ---
  return (
    <BiodataFormWrapper 
      initialData={applicationData} 
      hasPayment={paymentStatus.hasPaid}
      paymentId={paymentStatus.paymentId}
      faculties={faculties}
      courses={courses}
    />
  );
}

export default async function BioDataPage() {
  return (
    <SectionPanel
      title="Step 1: Complete Your Bio-Data"
      description="Please fill out all sections. Fields marked with * are required. You can save and return later."
    >
      <Suspense fallback={<PaymentVerificationLoading />}>
        <BiodataContent />
      </Suspense>
    </SectionPanel>
  );
}