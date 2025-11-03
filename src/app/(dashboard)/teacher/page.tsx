import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { FaBook, FaClipboardList, FaUsers } from 'react-icons/fa';
import { ROLES, PATHS } from '@/lib/constants';

export default async function TeacherPage() {
  const session = await getServerSession(authOptions);
  
  console.log("TeacherPage - Session user role:", session?.user.role);

  // Check if user is either Teacher or Admin with proper capitalization
  if (!session || (session.user.role !== ROLES.TEACHER && session.user.role !== ROLES.ADMIN)) {
    console.log("TeacherPage - Access denied, redirecting to unauthorized");
    redirect(PATHS.UNAUTHORIZED);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Teacher Area</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-start gap-4">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
            <FaBook size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Course Management</h2>
            <p className="text-gray-600">Create and manage your courses</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md flex items-start gap-4">
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
            <FaClipboardList size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Assignments</h2>
            <p className="text-gray-600">Create and grade student assignments</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md flex items-start gap-4">
          <div className="bg-teal-100 p-3 rounded-full text-teal-600">
            <FaUsers size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Student Management</h2>
            <p className="text-gray-600">View and manage your students</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">My Classes</h2>
        <p className="text-gray-500 italic">No classes created yet.</p>
      </div>
    </div>
  );
}