// src/components/admin/faculties/CourseTable.tsx
import { Faculty, Course } from '@/types/university';

interface CourseTableProps {
  faculties: Faculty[];
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}

export default function CourseTable({
  faculties,
  onEdit,
  onDelete,
  disabled,
}: CourseTableProps): JSX.Element {
  const allCourses = faculties.flatMap(f => f.courses.map(c => ({ ...c, facultyName: f.name })));

  return (
    <div className="shadow border-b border-gray-200 sm:rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Degree</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {allCourses.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No courses found.</td></tr>
          ) : (
            allCourses.map((course) => (
              <tr key={course.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.name} ({course.code})</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.facultyName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.degree_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.duration_years} years</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <button onClick={() => { onEdit(course); }} disabled={disabled} className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400">Edit</button>
                  <button onClick={() => { onDelete(course.id); }} disabled={disabled} className="text-red-600 hover:text-red-900 disabled:text-gray-400">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}