'use client';

import { FaUsers, FaUserGraduate, FaUserClock, FaSchool } from 'react-icons/fa';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}

const StatCard = ({ title, value, icon, description }: StatCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className="text-blue-500 text-2xl">{icon}</div>
    </div>
    <p className="text-gray-600 text-sm mt-2">{description}</p>
  </div>
);

export default function AdminDashboard() {
  // Remove unused session variable
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link 
            href="/admin/users" 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Manage Users
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={150}
            icon={<FaUsers />}
            description="All registered users"
          />
          <StatCard
            title="Active Students"
            value={120}
            icon={<FaUserGraduate />}
            description="Currently enrolled students"
          />
          <StatCard
            title="Payment Approvals"
            value={5}
            icon={<FaUserClock />}
            description="Users awaiting activation"
          />
          <StatCard
            title="Documents Approvals"
            value={3}
            icon={<FaSchool />}
            description="Uploaded Applicant Documents"
          />
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {/* Activity list will be implemented later */}
            <p className="text-gray-600">Loading recent activities...</p>
          </div>
        </div>
      </div>
    </div>
  );
}