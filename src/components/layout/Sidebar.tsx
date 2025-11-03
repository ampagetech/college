'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { FaHome, FaUserShield, FaUserGraduate, FaUserEdit, FaClipboardList, FaMoneyBillWave, FaTasks, FaUsersCog, FaFileAlt, FaDollarSign, FaBars, FaTimes, FaBuilding, FaBug, FaMicrophone } from 'react-icons/fa';
import { PATHS, ROLES } from '@/lib/constants';

// Define the type for navigation items
type NavItem = {
  path: string;
  label: string;
  icon: JSX.Element;
  roles: string[];
};

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      setIsCollapsed(isMobile);
      if (!isMobile) {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => { window.removeEventListener('resize', checkScreenSize); };
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const userRole = session?.user?.role?.toLowerCase() || ROLES.PUBLIC.toLowerCase();

  const navItems: NavItem[] = [
    // ... navItems array remains the same
    {
        path: PATHS.HOME,
        label: 'Dashboard',
        icon: <FaHome size={18} />,
        roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.APPLICANT, ROLES.PUBLIC],
      },
      
      {
        path: PATHS.NATURAL_LANG_TO_SQL,
        label: 'Via Voice',
        icon: <FaMicrophone size={18} />,
        roles: [ROLES.ADMIN, ROLES.TEACHER],
      },
     
      {
        path: PATHS.ASSISTANT,
        label: 'Lessons',
        icon: <FaClipboardList size={18} />,
        roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
      },
      {
        path: PATHS.ADMIN_MANAGE_DOCUMENTS,
        label: 'Verify Applications',
        icon: <FaFileAlt size={18} />,
        roles: [ROLES.ADMIN],
      },
      {
        path: PATHS.ADMIN_MANAGE_PAYMENTS,
        label: 'Confirm Payments',
        icon: <FaTasks size={18} />,
        roles: [ROLES.ADMIN],
      },
      {
        path: PATHS.ADMIN_USERS,
        label: 'User Roles',
        icon: <FaUsersCog size={18} />,
        roles: [ROLES.ADMIN],
      },
      {
        path: PATHS.ADMIN_MANAGE_FEES,
        label: 'Set Fees',
        icon: <FaDollarSign size={18} />,
        roles: [ROLES.ADMIN],
      },
      {
        path: PATHS.QUIZ,
        label: 'Quiz',
        icon: <FaClipboardList size={18} />,
        roles: [ROLES.STUDENT, ROLES.TEACHER],
      },
      {
        path: PATHS.QUIZ_RESULTS,
        label: 'Quiz Results',
        icon: <FaClipboardList size={18} />,
        roles: [ROLES.STUDENT, ROLES.TEACHER],
      },
      {
        path: PATHS.QUIZ_PERFORMANCE,
        label: 'Quiz Performance',
        icon: <FaClipboardList size={18} />,
        roles: [ROLES.STUDENT, ROLES.TEACHER],
      },
      {
        path: PATHS.SCHEME_WORDCLOUD,
        label: 'Scheme Cloud',
        icon: <FaClipboardList size={18} />,
        roles: [ROLES.TEACHER],
      },
      {
        path: PATHS.SCHEME,
        label: 'Scheme',
        icon: <FaClipboardList size={18} />,
        roles: [ROLES.STUDENT, ROLES.TEACHER],
      },
      {
        path: PATHS.BIO_DATA,
        label: 'Bio-Data Form',
        icon: <FaUserGraduate size={18} />,
        roles: [ROLES.APPLICANT],
      },
      {
        path: PATHS.DOCUMENTS,
        label: 'My Documents',
        icon: <FaFileAlt size={18} />,
        roles: [ROLES.APPLICANT],
      },
      {
        path: PATHS.PAYMENTS,
        label: 'My Payments',
        icon: <FaMoneyBillWave size={18} />,
        roles: [ROLES.APPLICANT],
      },
      {
        path: PATHS.APPLICANT_ADMISSION_LETTER,
        label: 'Print Admission Letter',
        icon: <FaFileAlt size={18} />,
        roles: [ROLES.APPLICANT],
      },
      {
        path: PATHS.PROFILE_EDIT_JEWEL,
        label: 'My Profile',
        icon: <FaUserEdit size={18} />,
        roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.APPLICANT],
      },
      {
        path: PATHS.ISSUES,
        label: 'App Issues',
        icon: <FaBug size={18} />,
        roles: [ROLES.ADMIN, ROLES.TEACHER],
      },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (userRole && userRole !== ROLES.PUBLIC) {
      return item.roles.some(navItemRole => navItemRole.toLowerCase() === userRole);
    }
    return item.roles.includes(ROLES.PUBLIC);
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <button
        onClick={toggleMobileMenu}
        // UPDATED: Use theme variables
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Toggle navigation menu"
      >
        {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => { setIsMobileMenuOpen(false); }}
        />
      )}

      <aside
        // UPDATED: Replaced hardcoded colors with theme variables
        className={`
          bg-card text-foreground min-h-screen p-5 flex flex-col border-r transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          md:relative md:translate-x-0
          ${isMobileMenuOpen 
            ? 'fixed top-0 left-0 z-40 translate-x-0 w-64' 
            : 'fixed top-0 left-0 z-40 -translate-x-full md:translate-x-0'
          }
        `}
      >
        <nav className="flex-grow">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => {
              if (!item.path) {
                return null;
              }
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={() => { setIsMobileMenuOpen(false); }}
                    // UPDATED: Use theme variables for active/hover states
                    className={`
                      flex items-center gap-3 p-3 rounded-lg transition-colors duration-150 ease-in-out group relative
                      ${isActive(item.path)
                        ? 'bg-primary text-primary-foreground font-medium shadow-md'
                        : 'hover:bg-accent hover:text-accent-foreground'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.label : ''}
                  >
                    <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                    {!isCollapsed && <span>{item.label}</span>}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-background text-foreground border text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto pt-5 border-t">
          {session?.user.email && !isCollapsed && (
            <p className="text-xs text-muted-foreground text-center break-words">
              Logged in as: {session.user.email}
            </p>
          )}
          {session?.user.role && !isCollapsed && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              Role: {String(session.user.role).toUpperCase()}
            </p>
          )}
          {isCollapsed && session?.user.email && (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                {session.user.email.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}