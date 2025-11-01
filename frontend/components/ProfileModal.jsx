"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function ProfileDropdown() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
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

  // Fetch backend profile when dropdown opens
  useEffect(() => {
    if (open && user?.emailAddresses?.[0]?.emailAddress) {
      fetchProfile();
    }
  }, [open, user]);

  const fetchProfile = async () => {
    try {
      const email = user.emailAddresses[0].emailAddress.toLowerCase();
      const res = await fetch(
        `http://localhost:5000/api/profile?email=${encodeURIComponent(email)}`,
        { credentials: "include" }
      );

      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();

      // Use backend image if exists, otherwise fallback to Clerk profile, then default
      setProfileData({
        ...data,
        image_url: data.image_url || null,
      });
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
    }
  };

  if (!user) return null;

  // Determine final profile image URL
  const profileImage =
    profileData?.image_url
      ? `http://localhost:5000${profileData.image_url}`
      : user.profileImageUrl || "/default-profile.png";

  const displayName = profileData?.full_name || user.firstName;

  // Handle "View Profile" click
  const handleViewProfile = () => {
    router.push("/profile");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile image button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500 hover:border-blue-600 transition"
      >
        <img
          src={profileImage}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <div className="flex flex-col items-center p-4 gap-3">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500">
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {displayName}
              </p>
            </div>

            <button
              onClick={handleViewProfile}
              className="w-full py-2 rounded-lg bg-blue-500 text-white text-center hover:bg-blue-600 transition"
            >
              View Profile
            </button>

            <button
              onClick={() => signOut()}
              className="w-full py-2 rounded-lg bg-red-500 text-white text-center hover:bg-red-600 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
