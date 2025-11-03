'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import DashboardTimeline, { Transaction } from '@/components/dashboard/DashboardTimeline';
import { 
  FaUsers, 
  FaRobot, 
  FaCheckCircle, 
  FaUserCheck 
} from 'react-icons/fa';

// --- DATA FETCHING ---
async function getLecturerTransactions(userId: string): Promise<Transaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_transactions_summary')
    .select('transaction_type, transaction_date, description')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error("Error fetching lecturer transactions:", error);
    return [];
  }
  return data;
}

async function getLecturerStats(userId: string) {
  const supabase = createClient();
  
  // For now, returning dummy data - replace with actual queries based on userId
  return {
    noStudents: 156,
    aiLessonsUsage: 2340,
    percentPassQuiz: 87,
    attendance: 92
  };
}

// --- HELPER COMPONENTS ---
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
};

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  bgColor, 
  textColor, 
  iconBgColor,
  isPercentage = false,
  isLarge = false
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  bgColor: string;
  textColor: string;
  iconBgColor: string;
  isPercentage?: boolean;
  isLarge?: boolean;
}) => {
  let displayValue: string;
  
  if (typeof value === 'number') {
    if (isPercentage) {
      displayValue = `${value}%`;
    } else if (isLarge && value >= 1000) {
      displayValue = formatNumber(value);
    } else {
      displayValue = value.toLocaleString();
    }
  } else {
    displayValue = value;
  }
    
  const valueTextSize = isLarge && typeof value === 'number' && value >= 1000 ? 'text-2xl' : 'text-3xl';

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

interface LecturerDashboardProps {
  user: { id: string; name?: string; email?: string; role?: string };
}

export default async function LecturerDashboard({ user }: LecturerDashboardProps) {
  const transactions = await getLecturerTransactions(user.id);
  const stats = await getLecturerStats(user.id);
  
  const session = await getServerSession(authOptions);
  const tenantName = session?.user?.tenantName ?? 'Our School';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="No. Students"
          value={stats.noStudents}
          icon={<FaUsers />}
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
          textColor="text-blue-900"
          iconBgColor="bg-blue-500"
        />
        <StatsCard
          title="AI Lessons Usage"
          value={stats.aiLessonsUsage}
          icon={<FaRobot />}
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
          textColor="text-purple-900"
          iconBgColor="bg-purple-500"
          isLarge={true}
        />
        <StatsCard
          title="Percent Pass Quiz"
          value={stats.percentPassQuiz}
          icon={<FaCheckCircle />}
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
          textColor="text-green-900"
          iconBgColor="bg-green-500"
          isPercentage={true}
        />
        <StatsCard
          title="Attendance"
          value={stats.attendance}
          icon={<FaUserCheck />}
          bgColor="bg-gradient-to-br from-indigo-50 to-indigo-100"
          textColor="text-indigo-900"
          iconBgColor="bg-indigo-500"
          isPercentage={true}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="mt-1 text-lg text-gray-600">
          Welcome, {user.name || user.email}! Manage your classes and students at {tenantName}.
        </p>
      </div>

      {/* Alerts/Notifications Timeline */}
      <div className="mb-8">
        <DashboardTimeline initialTransactions={transactions} />
      </div>
    </div>
  );
}