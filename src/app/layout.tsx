import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './print.css';
import AuthProvider from '@/components/providers/AuthProvider';
import { Toaster } from 'react-hot-toast'; // ✅ Import toast component

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Role-Based Auth App',
  description: 'Next.js app with role-based authentication',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Toaster position="top-right" /> {/* ✅ Add this line */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
