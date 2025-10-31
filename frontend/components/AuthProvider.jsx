"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken, getUser } from "@/utils/api";

const AuthContext = createContext({});

// Public paths that don't require auth
const PUBLIC_PATHS = ["/login", "/register"];

// Role-based path access
const ROLE_PATHS = {
  CITIZEN: ["/complaints", "/complaints/create", "/complaints/[id]", "/notifications"],
  OFFICER: ["/dashboard", "/complaints", "/complaints/[id]", "/notifications"],
  ADMIN: ["/admin", "/dashboard", "/complaints", "/complaints/[id]", "/notifications", "/users"],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user on mount
  useEffect(() => {
    const loadUser = () => {
      const token = getToken();
      const savedUser = getUser();
      if (token && savedUser) {
        setUser(savedUser);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // Auth check & route protection
  useEffect(() => {
    if (loading) return;

    const isPublicPath = PUBLIC_PATHS.some(p => pathname === p);
    if (!user && !isPublicPath) {
      router.push("/login");
      return;
    }

    if (user && isPublicPath) {
      // Redirect to role-specific dashboard
      switch (user.role) {
        case "ADMIN":
          router.push("/admin");
          break;
        case "OFFICER":
          router.push("/dashboard");
          break;
        default:
          router.push("/complaints");
      }
      return;
    }

    // Role-based access check (if logged in)
    if (user && !isPublicPath) {
      const allowedPaths = ROLE_PATHS[user.role] || [];
      const canAccess = allowedPaths.some(p => {
        if (p.includes("[id]")) {
          // Handle dynamic routes like /complaints/[id]
          const base = p.split("/[")[0];
          return pathname.startsWith(base);
        }
        return pathname === p;
      });

      if (!canAccess) {
        router.push(user.role === "ADMIN" ? "/admin" : user.role === "OFFICER" ? "/dashboard" : "/complaints");
      }
    }
  }, [user, loading, pathname]);

  const value = {
    user,
    setUser,
    loading,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);