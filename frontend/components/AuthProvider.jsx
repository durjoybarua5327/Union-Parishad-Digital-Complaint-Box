"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const AuthContext = createContext({});

// Public paths that don't require auth
const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

// Role-based path access
const ROLE_PATHS = {
  CITIZEN: ["/complaints", "/complaints/create", "/complaints/", "/notifications"],
  OFFICER: ["/dashboard", "/complaints", "/notifications"],
  ADMIN: ["/admin", "/dashboard", "/complaints", "/notifications", "/users"],
};

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  // Stop until Clerk is loaded
  useEffect(() => {
    if (isLoaded) setLoading(false);
  }, [isLoaded]);

  // Route protection
  useEffect(() => {
    if (loading) return;

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // Redirect if not signed in and trying to access private route
    if (!isSignedIn && !isPublicPath) {
      router.push("/sign-in");
      return;
    }

    // Redirect signed-in users away from public pages
    if (isSignedIn && isPublicPath) {
      const role = user?.publicMetadata?.role || "CITIZEN";
      switch (role) {
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

    // Role-based access control
    if (isSignedIn && !isPublicPath) {
      const role = user?.publicMetadata?.role || "CITIZEN";
      const allowedPaths = ROLE_PATHS[role] || [];
      const canAccess = allowedPaths.some((p) => pathname.startsWith(p));

      if (!canAccess) {
        const fallback = role === "ADMIN" ? "/admin" : role === "OFFICER" ? "/dashboard" : "/complaints";
        router.push(fallback);
      }
    }
  }, [isSignedIn, loading, pathname, user]);

  const value = {
    user,
    isSignedIn,
    loading,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
