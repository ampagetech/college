// src/app/admin/faculties/page.tsx
import { Suspense } from 'react';
import { getFacultiesWithCourses } from './actions';
import FacultyClient from '@/components/admin/faculties/FacultyClient';
import LoadingSkeleton from './loading'; // We'll create this next

export default async function ManageFacultiesPage() {
  const { data: faculties, error } = await getFacultiesWithCourses();

  if (error) {
    return <div className="p-8 text-red-600 bg-red-50 rounded-lg">Error: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Faculties & Courses</h1>
        <p className="text-gray-600 mt-1">Add, edit, or delete academic faculties and the courses they offer.</p>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <FacultyClient initialFaculties={faculties} />
      </Suspense>
    </div>
  );
}