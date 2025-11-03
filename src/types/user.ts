// src/types/user.ts

// Centralized User interface (as established in previous discussions)
export interface User {
  id: string;
  application_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string; // Combined name, can be derived or from API
  role: string;
  status: string;
  class: string; // Or string | null if it can be unset
  tenant_id: string | null;
  tenant_name?: string; // Optional, often added client-side or via specific API joins
  created_at?: string;
  updated_at?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  admin_comment_docs_biodata?: string | null;
}

// Corrected and potentially more comprehensive AdminUsersFiltersType
export interface AdminUsersFiltersType {
  userSearch?: string;        // For general text search (e.g., name, email).
                              // Consider renaming to 'search' for brevity if used broadly.
  role?: string;              // Filter by user role
  status?: string;            // Filter by user status (added for more common filtering needs)
  class?: string;             // Filter by user class (added for more common filtering needs, if applicable)
  dateRegisteredFrom?: string;  // Filter by registration date (start)
  dateRegisteredTo?: string;    // Filter by registration date (end)
  // ... any other user filter fields you might need, for example:
  // tenantId?: string;
  // applicationId?: string;
}

// If UserTable.tsx uses a more specific, non-optional filter set for its props,
// it might look like this (this was previously defined locally in UserTable.tsx):
export interface UserTableSpecificFilters {
  role: string;    // Assumed to always be present, even if an empty string representing "all"
  status: string;  // Assumed to always be present
  class: string;   // Assumed to always be present
  search: string;  // Assumed to always be present
}
// UserTable.tsx could then either:
// 1. Expect its 'filters' prop to be of type UserTableSpecificFilters.
// 2. Expect its 'filters' prop to be of type AdminUsersFiltersType (or a generic UserFilters)
//    and handle the optional nature of fields internally (which it already does for query params).

// ... any other user-related types ...