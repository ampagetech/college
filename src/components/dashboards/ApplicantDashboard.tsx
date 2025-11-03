'use server';

import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FaFileAlt, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';
import { createClient } from '@/lib/supabase/server';
import { PATHS } from '@/lib/constants';
import DashboardTimeline, { Transaction } from '@/components/dashboard/DashboardTimeline';
// import ApplicantHomePageContent from '@/components/home/ApplicantHomePageContent';

// --- DATA FETCHING ---
async function getUserTransactions(userId: string): Promise<Transaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_transactions_summary')
    .select('transaction_type, transaction_date, description')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error("Error fetching user transactions:", error);
    return [];
  }
  return data;
}

// --- HELPER COMPONENT ---
const ActionCard = ({ title, description, href, icon }: { title: string; description: string; href: string; icon: React.ReactNode }) => {
  if (!href) {
    console.error('ActionCard: href prop is undefined', { title, description });
    return null;
  }
  return (
    <Link href={href} className="block p-6 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
        <div className="text-2xl text-indigo-500 bg-indigo-100 p-3 rounded-full">
          {icon}
        </div>
      </div>
    </Link>
  );
};

interface ApplicantDashboardProps {
  user: { id: string; name?: string; email?: string; role?: string };
}

export default async function ApplicantDashboard({ user }: ApplicantDashboardProps) {
  const transactions = await getUserTransactions(user.id);

  const session = await getServerSession(authOptions);
  const tenantName = session?.user?.tenantName ?? 'Our School';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Applicant Dashboard</h1>
        <p className="mt-1 text-lg text-gray-600">
          Welcome, {user.name || user.email}! Thank you for your interest in {tenantName}.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ActionCard
          title="Payments"
          description="Start your Admission Process by First Paying your Application Fee."
          href={PATHS.PAYMENTS}
          icon={<FaMoneyBillWave />}
        />
        <ActionCard
          title="Application Form"
          description="Enter the Required Bio-Data."
          href={PATHS.BIO_DATA}
          icon={<FaFileAlt />}
        />
        <ActionCard
          title="Upload Documents"
          description="Upload the Required Documents."
          href={PATHS.DOCUMENTS}
          icon={<FaCheckCircle />}
        />
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <DashboardTimeline initialTransactions={transactions} />
      </div>

      {/* Applicant Home Content (optional) */}
      {/* <ApplicantHomePageContent user={user} /> */}
    </div>
  );
}
