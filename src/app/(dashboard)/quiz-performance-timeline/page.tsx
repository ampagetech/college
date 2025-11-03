// src/app/(dashboard)/performance/page.tsx - (Assuming path)
"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react'; // 1. ADDED: Auth.js session hook
import { Card, CardContent } from "@/components/ui/card";
import ResultsFilter from '@/components/common/ResultsFilter';
import PerformanceLineGraph from '@/components/common/PerformanceLineGraph';
import PerformanceBarGraph from '@/components/common/PerformanceBarGraph';
import { Button } from '@/components/ui/button';

import { usePerformanceStore } from '@/stores/quiz/performanceStore';

export default function QuizPerformancePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    exam: "all",
    subject: "all",
    startDate: "",
    endDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showInitialMessage, setShowInitialMessage] = useState(true);

  const { data, graphType, setData, setGraphType, clearData } = usePerformanceStore();
  // 3. CONVERTED: Use the Auth.js session hook
  const { data: session } = useSession();

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // 4. CONVERTED: Check for session and access token
      if (!session?.accessToken) {
        throw new Error("User not authenticated or token is missing.");
      }
      const idToken = session.accessToken;

      const params = new URLSearchParams();
      if (filters.exam !== "all") params.append("exam", filters.exam);
      if (filters.subject !== "all") params.append("subject", filters.subject);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/quiz-performance-timeline?${params.toString()}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      const result = await response.json();
      setData(result.data); // Store data in Zustand
      setShowInitialMessage(false);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setData([]); // Clear data in store on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setShowInitialMessage(false);
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
    clearData(); // Clear store when filters change
  };

  const handleShowButtonClick = () => {
    fetchPerformanceData();
  };

  const toggleGraphType = () => {
    setGraphType(graphType === 'line' ? 'bar' : 'line');
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <ResultsFilter
              filters={filters}
              searchQuery={searchQuery}
              onFilterChange={handleFilterChange}
              onSearchChange={setSearchQuery}
              onSearchClear={() => setSearchQuery("")}
              onShowClick={handleShowButtonClick}
            />
            <div className="flex justify-end">
              <Button
                onClick={toggleGraphType}
                variant="outline"
                className="mb-4"
              >
                Switch to {graphType === 'line' ? 'Bar' : 'Line'} Graph
              </Button>
            </div>
            {showInitialMessage ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-xl text-gray-500 text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  Select Exam, Subject, and Date Range, then Click Show to Display Performance
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
            ) : data.length === 0 ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-xl text-gray-500">No performance data found</div>
              </div>
            ) : (
              <div className="mt-4">
                {graphType === 'line' ? (
                  <PerformanceLineGraph 
                    data={data} 
                    startDate={filters.startDate} 
                    endDate={filters.endDate}
                  />
                ) : (
                  <PerformanceBarGraph 
                    data={data} 
                    startDate={filters.startDate} 
                    endDate={filters.endDate}
                  />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}