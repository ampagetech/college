'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import DashboardTimeline, { Transaction } from '@/components/dashboard/DashboardTimeline';
import { 
  FaUsers, 
  FaGraduationCap, 
  FaMoneyBillWave, 
  FaExclamationTriangle 
} from 'react-icons/fa';

// --- DATA FETCHING ---
async function getAdminTransactions(userId: string): Promise<Transaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_transactions_summary')
    .select('transaction_type, transaction_date, description')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error("Error fetching admin transactions:", error);
    return [];
  }
  return data;
}

async function getAdminStats() {
  const supabase = createClient();
  
  // For now, returning dummy data - replace with actual queries
  return {
    totalApplicants: 245,
    totalStudents: 1,
    totalPayments: 125000000, // 125 million
    unpaidFees: 45000000 // 45 million
  };
}

// --- HELPER COMPONENTS ---
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(0)}M`;
  } else if (amount >= 1000) {
    return `₦${(amount / 1000).toFixed(0)}K`;
  } else {
    return `₦${amount.toLocaleString()}`;
  }
};

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  bgColor, 
  textColor, 
  iconBgColor,
  isMonetary = false
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  bgColor: string;
  textColor: string;
  iconBgColor: string;
  isMonetary?: boolean;
}) => {
  const displayValue = isMonetary && typeof value === 'number' 
    ? formatCurrency(value) 
    : (typeof value === 'number' ? value.toLocaleString() : value);
    
  const valueTextSize = isMonetary ? 'text-2xl' : 'text-3xl';

  return (
    <div className={`${bgColor} rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${textColor} opacity-80`}>{title}</p>
          <p className={`${valueTextSize} font-bold ${textColor} mt-2`}>
            {displayValue}
          </p>
        </div>
        <div className={`${iconBgColor} p-4 rounded-xl`}>
          <div className="text-2xl text-white">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

interface AdminDashboardProps {
  user: { id: string; name?: string; email?: string; role?: string };
}

export default async function AdminDashboard({ user }: AdminDashboardProps) {
  const transactions = await getAdminTransactions(user.id);
  const stats = await getAdminStats();
  
  const session = await getServerSession(authOptions);
  const tenantName = session?.user?.tenantName ?? 'Our School';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Applicants"
          value={stats.totalApplicants}
          icon={<FaUsers />}
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
          textColor="text-blue-900"
          iconBgColor="bg-blue-500"
        />
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<FaGraduationCap />}
          bgColor="bg-gradient-to-br from-indigo-50 to-indigo-100"
          textColor="text-indigo-900"
          iconBgColor="bg-indigo-500"
        />
        <StatsCard
          title="Total Payments"
          value={stats.totalPayments}
          icon={<FaMoneyBillWave />}
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
          textColor="text-green-900"
          iconBgColor="bg-green-500"
          isMonetary={true}
        />
        <StatsCard
          title="Unpaid Fees"
          value={stats.unpaidFees}
          icon={<FaExclamationTriangle />}
          bgColor="bg-gradient-to-br from-red-50 to-red-100"
          textColor="text-red-900"
          iconBgColor="bg-red-500"
          isMonetary={true}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-lg text-gray-600">
          Welcome, {user.name || user.email}! Manage {tenantName} operations from here.
        </p>
      </div>

      {/* Alerts/Notifications Timeline */}
      <div className="mb-8">
        <DashboardTimeline initialTransactions={transactions} />
      </div>
    </div>
  );
}