// src/components/issues/IssueStatusBadge.tsx
import React from 'react';
import { IssueStatus } from '@/types/issue';

interface IssueStatusBadgeProps {
  status: IssueStatus;
}

// Update the color map
const statusColorMap: Record<IssueStatus, string> = {
  'New': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Resolved': 'bg-purple-100 text-purple-800',
  'Accepted': 'bg-green-100 text-green-800',
  'Reopened': 'bg-orange-100 text-orange-800',
  'Next Upgrade': 'bg-slate-100 text-slate-800', // Replaced 'Won\'t Fix'
};

const IssueStatusBadge: React.FC<IssueStatusBadgeProps> = ({ status }) => {
  const badgeClass = statusColorMap[status] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${badgeClass}`}>
      {status}
    </span>
  );
};

export default IssueStatusBadge;