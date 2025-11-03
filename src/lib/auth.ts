// src/lib/auth.ts - MODIFIED TO INCLUDE SUPABASE ACCESS TOKEN

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PATHS } from '@/lib/constants';
import { UserRole } from '@/types/next-auth'; // Import the specific role type

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const supabase = createRouteHandlerClient({ cookies });
        try {
          // Destructure `session` from the response as well
          const { data: { user: authUser, session: authSession }, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email.toLowerCase(),
            password: credentials.password,
          });

          // The session contains the access_token
          if (authError || !authUser || !authSession) return null;

          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, role, tenant_id')
            .eq('id', authUser.id)
            .single();

          if (userError || !userData) return null;

          // 1. CAPTURE: Add the Supabase access token to the user object
          return {
            id: userData.id,
            email: userData.email,
            name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
            role: userData.role,
            tenant_id: userData.tenant_id,
            accessToken: authSession.access_token, // <-- ADD THIS
          };
        } catch (error) {
          console.error('Exception during authorization:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      const supabase = createRouteHandlerClient({ cookies });

      // Initial login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenant_id = user.tenant_id;
        
        // 2. PASS: Move the access token from the user object to the JWT
        token.accessToken = user.accessToken; // <-- ADD THIS

        // Fetch tenant name (your existing logic is perfect)
        const { data: tenant } = await supabase
          .from('tenants')
          .select('name')
          .eq('id', user.tenant_id)
          .single();
        token.tenantName = tenant?.name || 'Unknown School';
      }

      // Session update logic (your existing logic is perfect)
      if (trigger === 'update') {
        const { data: userData } = await supabase
          .from('users')
          .select('role, tenant_id')
          .eq('id', token.id)
          .single();

        if (userData) {
          token.role = userData.role;
          token.tenant_id = userData.tenant_id;

          const { data: tenant } = await supabase
            .from('tenants')
            .select('name')
            .eq('id', userData.tenant_id)
            .single();
          token.tenantName = tenant?.name || 'Unknown School';
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.tenant_id = token.tenant_id;
      session.user.role = token.role;
      session.user.tenantName = token.tenantName;

      // 3. EXPOSE: Make the access token available on the session object
      session.accessToken = token.accessToken; // <-- ADD THIS
      
      return session;
    },
  },

  pages: {
    signIn: PATHS.SIGNIN,
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};