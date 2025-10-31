"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    router.push("/login");
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md fixed w-full z-20 top-0 left-0 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <div
          onClick={() => router.push("/")}
          className="cursor-pointer text-2xl font-bold text-blue-700 dark:text-blue-400"
        >
          UP Complaint Box
        </div>

        <div className="flex items-center gap-6 text-gray-700 dark:text-gray-200">
          <button
            onClick={() => router.push("/complaints")}
            className="hover:text-blue-600 transition"
          >
            Complaints
          </button>

          {token ? (
            <>
              <button
                onClick={() => router.push("/complaints/create")}
                className="hover:text-blue-600 transition"
              >
                Create
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="hover:text-blue-600 transition"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/register")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
