// src/app/manage-tenants/page.tsx
import React from 'react';
import TenantTable from '@/components/tenants/TenantTable';
import { getTenants } from './actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default async function TenantsPage() {
  // Fetch data directly using the server action during server rendering
  const { data: tenants, error } = await getTenants();

  // Handle potential errors from the data fetch
  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Tenants</AlertTitle>
          <AlertDescription>
            There was a problem fetching the tenant list. Please try refreshing the page.
            <p className="mt-2 text-xs text-red-800">Details: {error}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Pass the server-fetched data directly as a prop */}
      <TenantTable initialData={tenants || []} />
    </div>
  );
}