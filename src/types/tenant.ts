
import * as z from 'zod';

// Zod schema for form validation. This can be used on both client and server.
export const tenantSchema = z.object({
  id: z.string().optional(), // ID is present when editing, but not creating
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  address: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  telephone: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  subscription_start: z.date().optional().nullable(),
  subscription_end: z.date().optional().nullable(),
  paid: z.boolean().default(false),
});

// Type for form data, inferred from the Zod schema
export type TenantFormData = z.infer<typeof tenantSchema>;

// Type for data coming from the Supabase database
export interface Tenant {
  id: string;
  created_at: string;
  name: string;
  email: string;
  address: string | null;
  contact: string | null;
  telephone: string | null;
  state: string | null;
  city: string | null;
  subscription_start: string | null; // Database sends dates as strings
  subscription_end: string | null;
  paid: boolean;
}