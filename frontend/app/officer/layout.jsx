"use client";

import OfficerNavbar from "../../components/OfficerNavbar";
import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "../../utils/toast";

export default function OfficerLayout({ children }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    async function checkRole() {
      if (!isLoaded) return;
      if (!isSignedIn) {
        router.push('/sign-in');
        return;
      }

      try {
        const token = await getToken();
        const res = await fetch('http://localhost:5000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch user role');
        
        const data = await res.json();
        if (data.role !== 'officer') {
          toast.error('Access denied. Officer privileges required.');
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking role:', error);
        toast.error('Failed to verify access. Please try again.');
        router.push('/');
      }
    }

    checkRole();
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <OfficerNavbar />
      <main>{children}</main>
    </div>
  );
}