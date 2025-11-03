// C:\DevWeb\jewel-univ-apply\src\app\(dashboard)\admin\admissions\loading.tsx

// This is a dedicated loading UI for the entire /admin/admissions route and its children if needed.
// However, the main page (page.tsx) already implements its own Suspense boundaries for finer-grained loading.
// This file would act as a fallback if page.tsx itself is slow to load or if you want a more general loading screen.

// You can create a more elaborate loading skeleton here that matches the overall layout of the admin admissions page.

export default function AdminAdmissionsLoading() {
    return (
      <div className="container mx-auto py-10 space-y-6 animate-pulse">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          {/* Header Section Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-80"></div>
            </div>
            <div className="h-10 bg-blue-200 dark:bg-blue-700 rounded w-48"></div>
          </div>
  
          {/* Filters Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
  
          {/* Table Skeleton */}
          <div className="space-y-3">
            {/* Table Header */}
            <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            {/* Table Rows - 5 example rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
            ))}
          </div>
  
          {/* Pagination Skeleton */}
          <div className="flex justify-between items-center mt-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
            <div className="flex space-x-2">
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }