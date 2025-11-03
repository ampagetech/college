'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import DashboardTimeline, { Transaction } from '@/components/dashboard/DashboardTimeline';
import { 
  FaClipboardList, 
  FaChartLine, 
  FaBook, 
  FaRobot 
} from 'react-icons/fa';

// --- DATA FETCHING ---
async function getStudentTransactions(userId: string): Promise<Transaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_transactions_summary')
    .select('transaction_type, transaction_date, description')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error("Error fetching student transactions:", error);
    return [];
  }
  return data;
}

async function getStudentStats(userId: string) {
  const supabase = createClient();
  
  // For now, returning dummy data - replace with actual queries based on userId
  return {
    quizTaken: 24,
    averageScore: 85,
    noSubjects: 8,
    aiExplanations: 1250
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

interface StudentDashboardProps {
  user: { id: string; name?: string; email?: string; role?: string };
}

export default async function StudentDashboard({ user }: StudentDashboardProps) {
  const transactions = await getStudentTransactions(user.id);
  const stats = await getStudentStats(user.id);
  
  const session = await getServerSession(authOptions);
  const tenantName = session?.user?.tenantName ?? 'Our School';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Quiz Taken"
          value={stats.quizTaken}
          icon={<FaClipboardList />}
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
          textColor="text-blue-900"
          iconBgColor="bg-blue-500"
        />
        <StatsCard
          title="Average Score"
          value={stats.averageScore}
          icon={<FaChartLine />}
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
          textColor="text-green-900"
          iconBgColor="bg-green-500"
          isPercentage={true}
        />
        <StatsCard
          title="No. Subjects"
          value={stats.noSubjects}
          icon={<FaBook />}
          bgColor="bg-gradient-to-br from-indigo-50 to-indigo-100"
          textColor="text-indigo-900"
          iconBgColor="bg-indigo-500"
        />
        <StatsCard
          title="AI Explanations"
          value={stats.aiExplanations}
          icon={<FaRobot />}
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
          textColor="text-purple-900"
          iconBgColor="bg-purple-500"
          isLarge={true}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="mt-1 text-lg text-gray-600">
          Welcome, {user.name || user.email}! Access your academic resources at {tenantName}.
        </p>
      </div>

      {/* Alerts/Notifications Timeline */}
      <div className="mb-8">
        <DashboardTimeline initialTransactions={transactions} />
      </div>
    </div>
  );
}