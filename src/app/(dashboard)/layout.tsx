// C:\DevWeb\jewel-univ-apply\src\app\(dashboard)\layout.tsx
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import React from 'react';
import AppInitializer from '@/components/utils/AppInitializer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppInitializer /> {/* Initializes app state, invisible to users */}
      <div className="min-h-screen flex flex-col">
        <Header /> {/* Displays logo, title, and user info with logout */}
        <div className="flex flex-1">
          <Sidebar /> {/* Main navigation menu for all roles */}
          <main className="flex-1 p-6 bg-gray-100">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}