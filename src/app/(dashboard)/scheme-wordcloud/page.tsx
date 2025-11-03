"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import SchemeWordCloudFilters from '@/components/scheme/SchemeWordCloudFilters';
import SchemeWordCloud from '@/components/scheme/SchemeWordCloud';

interface SchemeFilters {
  level?: string;
  term?: string;
  subjectId?: string;
  subjectName?: string;
  subject?: string;
}

const SchemeWordCloudPage = () => {
  const [filters, setFilters] = useState({
    level: '',
    term: '',
    subjectId: '',
    subjectName: '',
    subject: '',
  });
  const [missingFilters, setMissingFilters] = useState<string[]>([]);
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const [searchQuery] = useState('');  // Removed unused setSearchQuery

  const handleFilterChange = (newFilters: SchemeFilters) => {  // Added proper type
    console.log('handleFilterChange called with:', newFilters);
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  };
  
  const handleShowButtonClick = () => {
    console.log('Show button clicked. Current filter state:', filters);
    const missing = [];
    if (!filters.level) missing.push('Level');
    if (!filters.subjectId && !filters.subjectName && !filters.subject) {
      missing.push('Subject');
    }
    if (!filters.term) missing.push('Term');
    console.log('Missing filters:', missing);
    setMissingFilters(missing);
    if (missing.length === 0) {
      setShowInitialMessage(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardContent className="p-6">
          {/* Updated header section */}
          <div className="flex items-center mb-4 gap-6">
            
            <div className="flex-1">
              <SchemeWordCloudFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onShowClick={handleShowButtonClick}
              />
            </div>
          </div>
          
          {/* Warning message */}
          {missingFilters.length > 0 && (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md mb-4">
              <h3 className="font-bold">Missing required filters</h3>
              <p>Please select: {missingFilters.join(', ')}</p>
            </div>
          )}
          
          {/* Word cloud or initial message */}
          {showInitialMessage ? (
            <div className="h-[500px] flex items-center justify-center">
              <div className="text-xl text-gray-500 text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                Select Level, Subject and Term, then Click Show to Display
              </div>
            </div>
          ) : (
            <SchemeWordCloud 
              searchQuery={searchQuery}
              filters={{
                level: filters.level,
                term: filters.term,
                subject: filters.subject || filters.subjectName || filters.subjectId
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchemeWordCloudPage;