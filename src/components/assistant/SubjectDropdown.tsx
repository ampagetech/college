// src/components/SubjectDropdown.tsx
"use client";

import subjects from '@/lib/subject.json';

interface SubjectDropdownProps {
  value: string;
  onSubjectChange: (id: string, name: string) => void;
}

export default function SubjectDropdown({ value, onSubjectChange }: SubjectDropdownProps) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const subject = subjects.find(s => s.value === e.target.value);
        if (subject) {
          onSubjectChange(subject.value, subject.label);
        }
      }}
      className="p-2 border rounded w-full bg-white dark:bg-gray-800"
    >
      <option value="">Subject</option>
      {subjects.map(subject => (
        <option key={subject.value} value={subject.value}>
          {subject.label}
        </option>
      ))}
    </select>
  );
}