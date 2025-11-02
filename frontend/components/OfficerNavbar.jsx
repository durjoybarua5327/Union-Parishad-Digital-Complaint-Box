"use client";

import Link from "next/link";
import { useAuth, useUser, SignOutButton } from "@clerk/nextjs";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function OfficerNavbar() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/officer", label: "All Complaints" },
    { href: "/officer/profile", label: "My Profile" },
  ];

  const isActive = (href) => pathname === href;

  return (
    <nav className="w-full backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/officer"
          className="text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-500 transition-colors duration-300"
        >
          Officer Dashboard
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm sm:text-base">
          {isSignedIn ? (
            <>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isActive(link.href)
                      ? "bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400 font-semibold"
                      : "hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Logout Button */}
              <SignOutButton>
                <button className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 font-medium">
                  Logout
                </button>
              </SignOutButton>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              Sign In
            </Link>
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
            {isSignedIn ? (
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
                <SignOutButton>
                  <button className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 w-full text-left">
                    Logout
                  </button>
                </SignOutButton>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}