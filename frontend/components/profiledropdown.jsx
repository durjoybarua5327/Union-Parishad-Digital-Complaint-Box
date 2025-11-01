"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import Link from "next/link";

export default function ProfileDropdown() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-blue-50 dark:bg-gray-800 px-3 py-2 rounded-full hover:bg-blue-100 dark:hover:bg-gray-700 transition"
      >
        <img
          src={user.profileImageUrl}
          alt={user.firstName}
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
          {user.firstName || "User"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-4">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user.profileImageUrl}
              alt={user.firstName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="text-gray-800 dark:text-gray-100 font-semibold">
                {user.fullName || user.firstName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.emailAddresses[0]?.emailAddress}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              className="px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition text-sm text-gray-700 dark:text-gray-200"
              onClick={() => setOpen(false)}
            >
              My Profile
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition text-sm text-gray-700 dark:text-gray-200"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/complaints"
              className="px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition text-sm text-gray-700 dark:text-gray-200"
              onClick={() => setOpen(false)}
            >
              All Complaints
            </Link>
            <button
              onClick={() => signOut()}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-700 transition text-sm text-red-600 dark:text-red-400"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
