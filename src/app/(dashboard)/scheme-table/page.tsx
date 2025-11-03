"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import SchemeFilterControls from '@/components/scheme/SchemeFilterControls';
import SchemeModal from '@/components/scheme/SchemeModal';
import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  HeaderContext, // Added import for proper typing
} from "@tanstack/react-table";

interface SchemeData {
  id: string;
  nigerian_level: string;
  subject: string;
  term: string;
  week: string;
  topic_long: string;
}

// Define the type for the header function context
type SchemeHeaderContext = HeaderContext<SchemeData, unknown>;

export default function SchemeTablePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    level: '',
    term: '',
    subjectId: '',
    subjectName: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'id', desc: false }
  ]);
  const [missingFilters, setMissingFilters] = useState<string[]>([]);
  const [data, setData] = useState<SchemeData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);

  const fetchSchemes = async () => {
    // Construct query parameters
    const params = new URLSearchParams({
      level: filters.level,
      term: filters.term,
      subject: filters.subjectName,
      searchQuery: searchQuery
    });

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/scheme-table?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid data format received from API');
      }
      
      setData(result.data);
      setShowInitialMessage(false);
    } catch (error) {
      console.error('Error fetching schemes:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFilterChange = (newFilters: typeof filters) => {
    // Hide initial message when any filter is changed
    setShowInitialMessage(false);
    setFilters(newFilters);
  };
  
  const handleShowButtonClick = () => {
    // Validate filters before fetching
    const missing = [];
    if (!filters.level) missing.push('Level');
    if (!filters.subjectId) missing.push('Subject');
    
    setMissingFilters(missing);
    
    // Only fetch if all required filters are selected
    if (missing.length === 0) {
      fetchSchemes();
    }
  };

  // Handle opening modal on double-click
  const handleRowDoubleClick = (rowId: string) => {
    setSelectedSchemeId(rowId);
    setIsModalOpen(true);
  };

  // Handle modal navigation
  const handleModalNavigation = (direction: 'next' | 'prev') => {
    if (!selectedSchemeId) return;

    const currentIndex = data.findIndex(item => item.id === selectedSchemeId);
    let newIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % data.length;
    } else {
      newIndex = (currentIndex - 1 + data.length) % data.length;
    }

    setSelectedSchemeId(data[newIndex].id);
  };
  
  const columnHelper = createColumnHelper<SchemeData>();
  const columns = [
    columnHelper.accessor("id", { 
      header: "ID", 
      cell: (info) => info.getValue(),
      size: 70 
    }),
    columnHelper.accessor("nigerian_level", { 
      header: "Level", 
      cell: (info) => info.getValue(),
      size: 100 
    }),
    columnHelper.accessor("subject", { 
      header: "Subject", 
      cell: (info) => info.getValue(),
      size: 150 
    }),
    columnHelper.accessor("term", { 
      header: "Term", 
      cell: (info) => info.getValue(),
      size: 80 
    }),
    columnHelper.accessor("week", { 
      header: "Week", 
      cell: (info) => info.getValue(),
      size: 80 
    }),
    columnHelper.accessor("topic_long", { 
      header: "Topic", 
      cell: (info) => info.getValue(),
      size: 300 
    }),
  ];
  
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardContent className="p-6">
         
          
          <div className="flex flex-col gap-4">
            <SchemeFilterControls
              filters={filters}
              searchQuery={searchQuery}
              onFilterChange={handleFilterChange}
              onSearchChange={setSearchQuery}
              onSearchClear={() => setSearchQuery('')}
              onShowClick={handleShowButtonClick}
            />
            
            {showInitialMessage ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-xl text-gray-500 text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  Select Level, Subject and Term, then Click Show to Display
                </div>
              </div>
            ) : isLoading ? (
              <div className="h-60 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-md">
                <h3 className="font-bold">Error loading data</h3>
                <p>{error}</p>
              </div>
            ) : (
              <div className="overflow-auto border border-gray-200 rounded-md" style={{ maxHeight: '600px' }}>
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer border-b border-gray-200"
                            onClick={header.column.getToggleSortingHandler()}
                            style={{ minWidth: `${header.column.getSize()}px` }}
                          >
                            <div className="flex items-center gap-1">
                              {typeof header.column.columnDef.header === 'function'
                                ? header.column.columnDef.header({
                                    column: header.column,
                                    header: header,
                                    table: table,
                                  } as SchemeHeaderContext) // Replaced 'as any' with 'as SchemeHeaderContext'
                                : header.column.columnDef.header}
                              {header.column.getIsSorted() && (
                                <span className="ml-1">
                                  {header.column.getIsSorted() === 'desc' ? '↓' : '↑'}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="text-center py-6 text-gray-500">
                          {missingFilters.length > 0 
                            ? `Please select: ${missingFilters.join(', ')}` 
                            : 'No matching records found'}
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row, index) => (
                        <tr 
                          key={row.id} 
                          className={`hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          onDoubleClick={() => handleRowDoubleClick(row.original.id)}
                        >
                          {row.getVisibleCells().map(cell => (
                            <td 
                              key={cell.id} 
                              className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200"
                            >
                              {cell.renderValue() as React.ReactNode}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedSchemeId && (
        <SchemeModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialId={selectedSchemeId}
          onNavigate={handleModalNavigation}
        />
      )}
    </div>
  );
}