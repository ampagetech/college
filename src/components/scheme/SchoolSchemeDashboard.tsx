import React from 'react';
import ClientImage from '@/components/common/ClientImage'; // Adjust the path based on your project structure
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define the dashboard data type
interface DashboardItem {
  name: string;
  users: number;
  subjects: number;
  schemeTopics: number;
  aiResponses: number;
  videos: number;
  questions: number;
}

const dashboardData: DashboardItem[] = [
  { name: 'Jan', users: 120, subjects: 15, schemeTopics: 45, aiResponses: 350, videos: 22, questions: 180 },
  { name: 'Feb', users: 145, subjects: 18, schemeTopics: 52, aiResponses: 425, videos: 28, questions: 210 },
  { name: 'Mar', users: 175, subjects: 20, schemeTopics: 60, aiResponses: 500, videos: 35, questions: 250 },
  { name: 'Apr', users: 200, subjects: 22, schemeTopics: 68, aiResponses: 580, videos: 42, questions: 300 },
  { name: 'May', users: 25700, subjects: 40, schemeTopics: 2575, aiResponses: 6250, videos: 550, questions: 35350 },
];

// StatBox props interface
interface StatBoxProps {
  label: string;
  value: number | string;
  color?: string;
}

const StatBox = ({ label, value, color }: StatBoxProps) => {
  return (
    <div
      className={`p-4 rounded-lg shadow-md transition-all hover:scale-105`}
      style={{
        backgroundColor: color,
        color: 'white',
        background: `linear-gradient(145deg, ${color}, ${color}DD)`,
      }}
    >
      <div className="text-sm font-semibold opacity-80">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

const SchoolSchemeDashboard = () => {
  const latestData = dashboardData[dashboardData.length - 1];

  return (
    <div className="p-6 space-y-6">
      {/* Stat Boxes */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        <StatBox label="Users" value={latestData.users} color="#8884d8" />
        <StatBox label="Subjects" value={latestData.subjects} color="#82ca9d" />
        <StatBox label="Scheme Topics" value={latestData.schemeTopics} color="#ffc658" />
        <StatBox label="AI Responses" value={latestData.aiResponses} color="#ff7300" />
        <StatBox label="Videos" value={latestData.videos} color="#387908" />
        <StatBox label="Questions" value={latestData.questions} color="#0088fe" />
      </div>

      {/* Updated Card with Centered Image */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Metrics Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px] border rounded-lg p-4 relative flex items-center justify-center">
            <ClientImage
              src="/images/Yobe.png"
              alt="Monthly Metrics Visualization"
              fill
              className="object-contain"
              priority
            />
            <div className="h-full w-full opacity-20 bg-gradient-to-br from-blue-100 to-purple-100 absolute top-0 left-0 -z-10"></div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                { metric: 'Users', growth: '16.7%' },
                { metric: 'Subjects', growth: '11.1%' },
                { metric: 'AI Responses', growth: '21.4%' },
                { metric: 'Videos', growth: '20%' },
                { metric: 'Questions', growth: '17.6%' },
              ].map((item, index) => (
                <li key={index} className="flex justify-between border-b pb-2">
                  <span>{item.metric}</span>
                  <span className="font-semibold text-green-600">+{item.growth}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                '25 New Users Joined',
                '5 New Subjects Added',
                '650 AI Responses Generated',
                '50 Educational Videos Uploaded',
                '350 Questions Answered',
              ].map((activity, index) => (
                <li key={index} className="flex items-center space-x-2 border-b pb-2">
                  <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                  <span>{activity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SchoolSchemeDashboard;