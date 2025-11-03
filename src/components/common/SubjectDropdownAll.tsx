// src/components/SubjectDropdownAll.tsx
"use client";

import subjects from '@/lib/subject.json';

interface SubjectDropdownAllProps {
  value: string;
  onSubjectChange: (id: string, name: string) => void;
}

export default function SubjectDropdownAll({ value, onSubjectChange }: SubjectDropdownAllProps) {
  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === "all") {
          // Handle "All Subjects" selection
          onSubjectChange("all", "All Subjects");
        } else {
          const subject = subjects.find(s => s.value === e.target.value);
          if (subject) {
            onSubjectChange(subject.value, subject.label);
          }
        }
      }}
      className="p-2 border rounded w-full bg-white dark:bg-gray-800"
    >
      <option value="all">All Subjects</option>
      {subjects.map(subject => (
        <option key={subject.value} value={subject.value}>
          {subject.label}
        </option>
      ))}
    </select>
  );
}