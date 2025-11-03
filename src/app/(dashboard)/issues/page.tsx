// src/app/(dashboard)/issues/page.tsx
'use client';

import { useState } from 'react';
import IssuesFilters from '@/components/issues/IssuesFilters';
import IssuesTable from '@/components/issues/IssuesTable';
import CreateIssueModal from '@/components/issues/CreateIssueModal';
import { IssueFiltersType } from '@/types/issue';

export default function IssuesPage() {
  const [filters, setFilters] = useState<IssueFiltersType>({
    status: '',
    priority: '',
    type: '',
    userSearch: '',
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- MODIFIED: State for the CreateIssueModal is managed here ---
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const handleFilterChange = (newFilters: Partial<IssueFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleIssueUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNewIssueCreated = () => {
    setIsNewModalOpen(false); // Close modal
    handleIssueUpdated();      // Refresh table
  };

  // This function will be passed down to both IssuesFilters and IssuesTable
  const openNewIssueModal = () => setIsNewModalOpen(true);

  return (
    // --- MODIFIED: Wrapper to constrain page width ---
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Application Issues</h1>
        <p className="text-sm text-gray-600">Track bugs, feature requests, and other issues.</p>
      </header>

      <IssuesFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onNewIssueClick={openNewIssueModal} // Pass function to new button
      />

      <div className="mt-6">
        <IssuesTable
          filters={filters}
          refreshTrigger={refreshTrigger}
          onIssueUpdated={handleIssueUpdated}
          onNewIssueClick={openNewIssueModal} // Pass same function to table
        />
      </div>

      <CreateIssueModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onIssueCreated={handleNewIssueCreated}
      />
    </div>
  );
}