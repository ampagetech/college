// src/types/issue.ts

// These types should exactly match the ENUMs we created in the database DDL.
export type IssueStatus = 'New' | 'In Progress' | 'Resolved' | 'Accepted' | 'Reopened' | 'Next Upgrade';
export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueType = 'Bug' | 'Feature Request' | 'Change Request' | 'Question';

/**
 * Type definition for the filters state object used in the issues page.
 */
export interface IssueFiltersType {
  status: string;      // We use string to allow for a "All" or empty value
  priority: string;
  type: string;
  userSearch: string;  // For searching by title or description
}

/**
* Represents a single issue record fetched from the database.
* This is a more detailed type that includes joined data, like user names.
*/
export interface Issue {
  id: string; // uuid
  title: string;
  description: string; // <<< THIS LINE IS THE FIX
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  created_at: string; // ISO date string (timestamptz)
  updated_at: string; // ISO date string (timestamptz)

  // We'll join the users table to get names and emails directly
  reporter: {
    id: string; // uuid
    name: string | null;
    email: string | null;
  } | null;

  assignee: {
    id: string; // uuid
    name: string | null;
    email: string | null;
  } | null;
}