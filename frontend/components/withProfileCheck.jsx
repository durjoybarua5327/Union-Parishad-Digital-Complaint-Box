"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { apiFetch } from "@/utils/api";
import toast from "react-hot-toast";

export function withProfileCheck(WrappedComponent) {
  return function ProfileCheckWrapper(props) {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      if (!isLoaded) return;

      const checkProfile = async () => {
        try {
          if (!user) {
            toast.error("Please sign in to continue");
            router.push("/login");
            return;
          }

          const response = await apiFetch("/api/profile");
          if (!response.success || !response.data?.isComplete) {
            // Store the current path to redirect back after profile completion
            localStorage.setItem("profileRedirect", window.location.pathname);
            toast.error("Please complete your profile to continue");
            router.push("/profile");
            return;
          }
          setIsChecking(false);
        } catch (error) {
          console.error("Profile check error:", error);
          toast.error("Please complete your profile to continue");
          router.push("/profile");
        }
      };

      checkProfile();
    }, [isLoaded, user, router]);

    if (isChecking) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

// keep a default export for modules that import the HOC as default
export default withProfileCheck;