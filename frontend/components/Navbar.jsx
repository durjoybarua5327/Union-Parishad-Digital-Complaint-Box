"use client";

import Link from "next/link";
import { useAuth, useUser, SignOutButton } from "@clerk/nextjs";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser(); // Fetch user data including profile image
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    
    { href: "/complaints", label: "All Complaints" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/complaints/create", label: "Submit" },
    { href: "/notifications", label: "Notifications" },
  ];

  const isActive = (href) => pathname === href;

  return (
    <nav className="w-full backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-500 transition-colors duration-300"
        >
          Union Parishad Digital Complaint Box
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm sm:text-base">
          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200"
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
                      ? "bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400 font-semibold"
                      : "hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200"
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
                      href="/profile"
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
                  className="px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
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
                        ? "bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400 font-semibold"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/profile"
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isActive("/profile")
                      ? "bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400 font-semibold"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  }`}
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
