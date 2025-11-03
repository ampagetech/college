// src/components/admin/faculties/CourseModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Course, Faculty } from '@/types/university';

interface CourseModalProps {
  course: Course | null;
  faculties: Faculty[];
  onClose: () => void;
  onSave: (payload: {
    name: string;
    code: string;
    faculty_id: string;
    degree_type: string;
    duration_years: number;
  }) => void;
  isSaving: boolean;
}

export default function CourseModal({
  course,
  faculties,
  onClose,
  onSave,
  isSaving,
}: CourseModalProps): JSX.Element {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [degreeType, setDegreeType] = useState('B.Sc.');
  const [duration, setDuration] = useState(4);
  const [error, setError] = useState('');

  useEffect((): void => {
    if (course) {
      setName(course.name);
      setCode(course.code);
      setFacultyId(course.faculty_id);
      setDegreeType(course.degree_type);
      setDuration(course.duration_years);
    } else if (faculties.length > 0) {
      setFacultyId(faculties[0].id);
    }
  }, [course, faculties]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!name || !code || !facultyId || !degreeType || !duration) {
      setError('All fields are required.');
      return;
    }
    onSave({
      name,
      code,
      faculty_id: facultyId,
      degree_type: degreeType,
      duration_years: Number(duration),
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">{course ? 'Edit' : 'Add'} Course</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="faculty" className="block text-sm font-medium text-gray-700">
                Faculty
              </label>
              <select
                id="faculty"
                value={facultyId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFacultyId(e.target.value);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">
                Course Name
              </label>
              <input
                type="text"
                id="courseName"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setName(e.target.value);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>

            <div>
              <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">
                Course Code (e.g., CSC)
              </label>
              <input
                type="text"
                id="courseCode"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setCode(e.target.value);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="degreeType" className="block text-sm font-medium text-gray-700">
                  Degree Type
                </label>
                <input
                  type="text"
                  id="degreeType"
                  value={degreeType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDegreeType(e.target.value);
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., B.Sc."
                  required
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duration (Years)
                </label>
                <input
                  type="number"
                  id="duration"
                  value={duration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDuration(Number(e.target.value));
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                  min={1}
                  max={10}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
