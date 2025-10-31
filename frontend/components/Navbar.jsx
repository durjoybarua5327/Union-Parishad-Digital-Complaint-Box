"use client";

import { useAuth } from "@/app/auth";
import Link from "next/link";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400"
        >
          Union Parishad Digital Complaint Box
        </Link>
        <div className="flex items-center gap-6 text-sm sm:text-base">
          {!user ? (
            <>
              <Link
                href="/login"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Admin Dashboard
                </Link>
              )}
              {user.role === "OFFICER" && (
                <Link
                  href="/officer"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Officer Dashboard
                </Link>
              )}
              {user.role === "CITIZEN" && (
                <Link
                  href="/dashboard"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  My Complaints
                </Link>
              )}
              <Link
                href="/complaints"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                All Complaints
              </Link>
              <Link
                href="/complaints/create"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Submit
              </Link>
              <Link
                href="/notifications"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Notifications
              </Link>
              <button
                onClick={logout}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
