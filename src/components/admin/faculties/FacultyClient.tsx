// src/components/admin/faculties/FacultyClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { Faculty, Course } from '@/types/university';

import {
  createFaculty,
  updateFaculty,
  deleteFaculty,
  createCourse,
  updateCourse,
  deleteCourse,
} from '@/app/(dashboard)/admin/faculties/actions';

import FacultyTable from './FacultyTable';
import CourseTable from './CourseTable';
import FacultyModal from './FacultyModal';
import CourseModal from './CourseModal';

interface FacultyClientProps {
  initialFaculties: Faculty[];
}

// A simple toast-like alert for feedback. Replace with a real toast library later.
const showFeedback = (message: string, isError = false): void => {
  alert(`${isError ? 'Error: ' : 'Success: '}${message}`);
};

export default function FacultyClient({ initialFaculties }: FacultyClientProps): JSX.Element {
  const [isPending, startTransition] = useTransition();

  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleAddFaculty = (): void => {
    setEditingFaculty(null);
    setIsFacultyModalOpen(true);
  };

  const handleEditFaculty = (faculty: Faculty): void => {
    setEditingFaculty(faculty);
    setIsFacultyModalOpen(true);
  };

  const handleAddCourse = (): void => {
    setEditingCourse(null);
    setIsCourseModalOpen(true);
  };

  const handleEditCourse = (course: Course): void => {
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleSaveFaculty = (payload: {
    name: string;
    code: string;
    dean_name: string | null;
  }): void => {
    startTransition(async (): Promise<void> => {
      const action = editingFaculty
        ? updateFaculty(editingFaculty.id, payload)
        : createFaculty(payload);
      const { error } = await action;
      if (error) {
        showFeedback(error, true);
      } else {
        showFeedback(`Faculty ${editingFaculty ? 'updated' : 'created'} successfully.`);
        setIsFacultyModalOpen(false);
      }
    });
  };

  const handleDeleteFaculty = (id: string): void => {
    if (
      window.confirm('Are you sure you want to delete this faculty? This action cannot be undone.')
    ) {
      startTransition(async (): Promise<void> => {
        const { error } = await deleteFaculty(id);
        if (error) showFeedback(error, true);
        else showFeedback('Faculty deleted.');
      });
    }
  };

  const handleSaveCourse = (payload: {
    name: string;
    code: string;
    faculty_id: string;
    degree_type: string;
    duration_years: number;
  }): void => {
    startTransition(async (): Promise<void> => {
      const action = editingCourse
        ? updateCourse(editingCourse.id, payload)
        : createCourse(payload);
      const { error } = await action;
      if (error) {
        showFeedback(error, true);
      } else {
        showFeedback(`Course ${editingCourse ? 'updated' : 'created'} successfully.`);
        setIsCourseModalOpen(false);
      }
    });
  };

  const handleDeleteCourse = (id: string): void => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      startTransition(async (): Promise<void> => {
        const { error } = await deleteCourse(id);
        if (error) showFeedback(error, true);
        else showFeedback('Course deleted.');
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Faculties Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Faculties</h2>
          <button
            onClick={handleAddFaculty}
            disabled={isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Add Faculty
          </button>
        </div>
        <FacultyTable
          faculties={initialFaculties}
          onEdit={handleEditFaculty}
          onDelete={handleDeleteFaculty}
          disabled={isPending}
        />
      </div>

      {/* Courses Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Courses</h2>
          <button
            onClick={handleAddCourse}
            disabled={isPending || initialFaculties.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            title={initialFaculties.length === 0 ? 'You must add a faculty first' : 'Add a new course'}
          >
            Add Course
          </button>
        </div>
        <CourseTable
          faculties={initialFaculties}
          onEdit={handleEditCourse}
          onDelete={handleDeleteCourse}
          disabled={isPending}
        />
      </div>

      {/* Modals */}
      {isFacultyModalOpen && (
        <FacultyModal
          faculty={editingFaculty}
          onClose={(): void => {
            setIsFacultyModalOpen(false);
          }}
          onSave={handleSaveFaculty}
          isSaving={isPending}
        />
      )}
      {isCourseModalOpen && (
        <CourseModal
          course={editingCourse}
          faculties={initialFaculties}
          onClose={(): void => {
            setIsCourseModalOpen(false);
          }}
          onSave={handleSaveCourse}
          isSaving={isPending}
        />
      )}
    </div>
  );
}
