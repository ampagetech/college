// src/types/next-auth.d.ts

import 'next-auth';
import { JWT } from 'next-auth/jwt';

// Define your custom user role type to match ROLES constants
export type UserRole = 'admin' | 'teacher' | 'student' | 'applicant' | 'public';

declare module 'next-auth' {
  interface User {
    id: string;
    role?: UserRole;
    tenant_id?: string;
    accessToken?: string; // For passing token from authorize to jwt callback
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      tenant_id?: string;
      tenantName?: string;
    };
    accessToken?: string; // To be available in client-side components
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: UserRole;
    tenant_id?: string;
    tenantName?: string;
    accessToken?: string; // To be available in session callback
  }
}