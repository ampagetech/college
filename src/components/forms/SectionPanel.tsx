// src/components/forms/SectionPanel.tsx
import React from 'react';

interface SectionPanelProps {
  title: string;
  description?: string; // <-- 1. Add description as an optional prop
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const SectionPanel: React.FC<SectionPanelProps> = ({ title, description, icon, children }) => {
  return (
    <div className="mb-8 bg-white shadow-lg rounded-lg border border-gray-200">
      {/* Changed to items-start for better alignment when description is present */}
      <div className="flex items-start p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        {icon && <span className="mr-3 text-blue-600 text-xl pt-1">{icon}</span>}
        <div className="flex-grow"> {/* Wrapper for title and description */}
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          {/* 2. Conditionally render the description if it exists */}
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default SectionPanel;