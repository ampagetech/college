'use client';

import { useSession, signOut } from 'next-auth/react';
import { FaUserCircle } from 'react-icons/fa';
import { PATHS } from '@/lib/constants';
// import Image from 'next/image';

export default function Header() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({
      redirect: true,
      callbackUrl: PATHS.SIGNIN,
    });
  };

  return (
    // UPDATED: Replaced hardcoded colors with theme variables
    <header className="bg-card text-foreground p-4 flex items-center shadow-md relative border-b">
      {/* Logo - positioned on the extreme left */}
      <div className="mr-2 md:mr-4 flex-shrink-0 hidden md:block">
        {/* SVG Logo remains the same, as its colors are self-contained */}
        <svg viewBox="0 0 500 500" className="w-12 h-12">
          {/* ... SVG content ... */}
          <defs>
            <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#2B7A78", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#17252A", stopOpacity:1}} />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#3AAFA9", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#2B7A78", stopOpacity:1}} />
            </linearGradient>
          </defs>
          <path d="M250 80 L200 110 L200 240 L250 280 L300 240 L300 110 Z" fill="url(#tealGradient)" stroke="#fff" strokeWidth="2"/>
          <path d="M180 50 L180 65 L320 65 L320 50 L300 40 L200 40 Z" fill="url(#tealGradient)"/>
          <path d="M190 65 L310 65 L310 75 L280 85 L220 85 Z" fill="url(#tealGradient)"/>
          <circle cx="185" cy="72" r="3" fill="#fff"/>
          <line x1="185" y1="75" x2="175" y2="95" stroke="#fff" strokeWidth="2"/>
          <circle cx="175" cy="95" r="2" fill="#fff"/>
          <line x1="200" y1="50" x2="300" y2="50" stroke="#fff" strokeWidth="2"/>
          <line x1="190" y1="70" x2="310" y2="70" stroke="#fff" strokeWidth="2"/>
          <circle cx="250" cy="180" r="8" fill="#fff"/>
          <rect x="246" y="188" width="8" height="40" fill="#fff"/>
          <path d="M140 140 L140 180 L160 200 L180 220 L200 240 L220 260 L240 280 L250 285" fill="none" stroke="url(#greenGradient)" strokeWidth="8" strokeLinecap="round"/>
          <path d="M150 120 L150 160 L170 180 L190 200 L210 220 L230 240 L245 255" fill="none" stroke="url(#greenGradient)" strokeWidth="6" strokeLinecap="round"/>
          <path d="M160 100 L160 140 L180 160 L200 180 L220 200 L240 220 L250 230" fill="none" stroke="#3AAFA9" strokeWidth="4" strokeLinecap="round"/>
          <path d="M360 140 L360 180 L340 200 L320 220 L300 240 L280 260 L260 280 L250 285" fill="none" stroke="url(#greenGradient)" strokeWidth="8" strokeLinecap="round"/>
          <path d="M350 120 L350 160 L330 180 L310 200 L290 220 L270 240 L255 255" fill="none" stroke="url(#greenGradient)" strokeWidth="6" strokeLinecap="round"/>
          <path d="M340 100 L340 140 L320 160 L300 180 L280 200 L260 220 L250 230" fill="none" stroke="#3AAFA9" strokeWidth="4" strokeLinecap="round"/>
          <path d="M120 160 L120 200 L140 220 L160 240 L180 260 L200 280 L230 300" fill="none" stroke="url(#tealGradient)" strokeWidth="6" strokeLinecap="round"/>
          <path d="M380 160 L380 200 L360 220 L340 240 L320 260 L300 280 L270 300" fill="none" stroke="url(#tealGradient)" strokeWidth="6" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Mobile logo - smaller and positioned to avoid menu button */}
      <div className="md:hidden absolute left-14 flex-shrink-0">
        <svg viewBox="0 0 500 500" className="w-8 h-8">
           {/* ... SVG content ... */}
           <defs>
            <linearGradient id="tealGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#2B7A78", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#17252A", stopOpacity:1}} />
            </linearGradient>
            <linearGradient id="greenGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#3AAFA9", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#2B7A78", stopOpacity:1}} />
            </linearGradient>
          </defs>
          <path d="M250 80 L200 110 L200 240 L250 280 L300 240 L300 110 Z" fill="url(#tealGradientMobile)" stroke="#fff" strokeWidth="3"/>
          <path d="M180 50 L180 65 L320 65 L320 50 L300 40 L200 40 Z" fill="url(#tealGradientMobile)"/>
          <circle cx="250" cy="180" r="8" fill="#fff"/>
          <rect x="246" y="188" width="8" height="40" fill="#fff"/>
        </svg>
      </div>

      {/* Title - adjusted for logo placement */}
      <div className="flex-1 flex justify-center md:justify-start">
        <h1 className="text-lg md:text-xl font-bold text-center md:text-left ml-12 md:ml-0">
          <span className="hidden sm:inline">
            {(session?.user?.tenantName ?? 'Your School') + ' Portal'}
          </span>
          <span className="sm:hidden">Portal</span>
        </h1>
      </div>

      {/* User section */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {session?.user ? (
          <>
            <div className="hidden sm:flex items-center gap-2">
              <FaUserCircle className="text-xl" />
              <div>
                <p className="text-sm font-medium">{session.user.name || session.user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{session.user.role}</p>
              </div>
            </div>

            {/* Mobile: Show only icon and role */}
            <div className="sm:hidden flex items-center gap-1">
              <FaUserCircle className="text-lg" />
              <span className="text-xs capitalize">{session.user.role}</span>
            </div>

            <button
              onClick={handleLogout}
              // UPDATED: Replaced hardcoded colors with theme variables
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1 md:px-3 md:py-1 rounded text-xs md:text-sm transition-colors duration-200"
            >
              <span className="hidden sm:inline">Log out</span>
              <span className="sm:hidden">Out</span>
            </button>
          </>
        ) : (
          <div className="text-xs md:text-sm">Not signed in</div>
        )}
      </div>
    </header>
  );
}