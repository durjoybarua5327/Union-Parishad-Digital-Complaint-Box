"use client";

import Link from "next/link";
import { useAuth, useUser, SignOutButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.emailAddresses[0]?.emailAddress) {
        try {
          const res = await fetch(
            `http://localhost:5000/api/profile?email=${user.emailAddresses[0].emailAddress}`
          );
          const data = await res.json();
          setUserRole(data.role || 'citizen');
          
          // Redirect based on role and current path
          if (data.role === 'officer' && !pathname.startsWith('/officer')) {
            router.push('/officer/complaints');
          } else if (data.role === 'citizen' && pathname.startsWith('/officer')) {
            router.push('/complaints');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole('citizen'); // Default to citizen on error
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    if (isSignedIn) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, [user, isSignedIn, pathname, router]);

  // Citizen navigation links
  const citizenLinks = [
    { href: "/complaints", label: "All Complaints" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/complaints/create", label: "Submit" },
    { href: "/notifications", label: "Notifications" },
  ];

  // Officer navigation links
  const officerLinks = [
    { href: "/officer/complaints", label: "All Complaints" },
    { href: "/officer/dashboard", label: "Dashboard" },
  ];

  // Admin navigation links (for future use)
  const adminLinks = [
    { href: "/admin/complaints", label: "All Complaints" },
    { href: "/admin/users", label: "Manage Users" },
    { href: "/admin/dashboard", label: "Dashboard" },
  ];

  // Select links based on role
  const links = 
    userRole === 'officer' ? officerLinks :
    userRole === 'admin' ? adminLinks :
    citizenLinks;

  // Profile link based on role
  const profileLink = 
    userRole === 'officer' ? '/officer/profile' :
    userRole === 'admin' ? '/admin/profile' :
    '/profile';

  // Theme color based on role
  const themeColor = 
    userRole === 'officer' ? 'green' :
    userRole === 'admin' ? 'purple' :
    'blue';

  const getColorClasses = (type) => {
    const colors = {
      blue: {
        text: 'text-blue-700 dark:text-blue-400',
        hover: 'hover:text-blue-800 dark:hover:text-blue-500',
        bg: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
        activeBg: 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400',
        hoverText: 'hover:text-blue-600 dark:hover:text-blue-400',
        hoverBg: 'hover:bg-blue-100 dark:hover:bg-gray-800',
      },
      green: {
        text: 'text-green-700 dark:text-green-400',
        hover: 'hover:text-green-800 dark:hover:text-green-500',
        bg: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
        activeBg: 'bg-green-100 text-green-700 dark:bg-gray-700 dark:text-green-400',
        hoverText: 'hover:text-green-600 dark:hover:text-green-400',
        hoverBg: 'hover:bg-green-100 dark:hover:bg-gray-800',
      },
      purple: {
        text: 'text-purple-700 dark:text-purple-400',
        hover: 'hover:text-purple-800 dark:hover:text-purple-500',
        bg: 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600',
        activeBg: 'bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-400',
        hoverText: 'hover:text-purple-600 dark:hover:text-purple-400',
        hoverBg: 'hover:bg-purple-100 dark:hover:bg-gray-800',
      },
    };
    return colors[themeColor][type];
  };

  const isActive = (href) => pathname === href;

  // Show loading state
  if (isSignedIn && loading) {
    return (
      <nav className="w-full backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={isSignedIn ? (userRole === 'officer' ? '/officer/complaints' : '/complaints') : '/'}
          className={`text-xl sm:text-2xl font-extrabold ${getColorClasses('text')} ${getColorClasses('hover')} transition-colors duration-300`}
        >
          {userRole === 'officer' ? 'Officer Panel' : 
           userRole === 'admin' ? 'Admin Panel' : 
           'Union Parishad Digital Complaint Box'}
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm sm:text-base">
          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className={`px-4 py-2 rounded-lg ${getColorClasses('hoverBg')} transition-colors duration-200`}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className={`px-4 py-2 rounded-lg ${getColorClasses('bg')} text-white transition-colors duration-200`}
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive(link.href)
                      ? getColorClasses('activeBg') + ' font-semibold'
                      : `${getColorClasses('hoverText')} text-gray-700 dark:text-gray-200`
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 p-1"
                >
                  <img
                    src={user?.imageUrl || "/default-avatar.png"}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    <Link
                      href={profileLink}
                      className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => setProfileOpen(false)}
                    >
                      My Profile
                    </Link>
                    <SignOutButton>
                      <button className="w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                        Logout
                      </button>
                    </SignOutButton>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-inner">
          <div className="flex flex-col gap-2 px-6 py-4">
            {!isSignedIn ? (
              <>
                <Link
                  href="/sign-in"
                  className={`px-4 py-2 rounded-lg ${getColorClasses('hoverBg')} transition-colors`}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className={`px-4 py-2 rounded-lg ${getColorClasses('bg')} text-white transition-colors`}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                      isActive(link.href)
                        ? getColorClasses('activeBg') + ' font-semibold'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={profileLink}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isActive(profileLink)
                      ? getColorClasses('activeBg') + ' font-semibold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  My Profile
                </Link>
                <SignOutButton>
                  <button className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200">
                    Logout
                  </button>
                </SignOutButton>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}