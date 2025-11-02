"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import OfficerNavbar from "@/components/OfficerNavbar";
import { User, Mail, Phone, MapPin, Calendar, Shield } from "lucide-react";

export default function OfficerProfilePage() {
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.emailAddresses[0]?.emailAddress) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/profile?email=${user.emailAddresses[0].emailAddress}`
      );
      const data = await res.json();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <OfficerNavbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OfficerNavbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Officer Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your profile information
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {profile?.image_url ? (
                  <img
                    src={profile.image_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {profile?.full_name || "Officer"}
                </h2>
                <div className="flex items-center gap-2 text-white/90">
                  <Shield className="w-4 h-4" />
                  <span className="capitalize">{profile?.role || "Officer"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user?.emailAddresses[0]?.emailAddress || "N/A"}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile?.phone_number || "Not provided"}
                  </p>
                </div>
              </div>

              {/* NID */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">NID Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile?.nid_number || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date of Birth</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : "Not provided"}
                  </p>
                </div>
              </div>

              {/* Ward No */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ward Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile?.ward_no ? `Ward ${profile.ward_no}` : "Not provided"}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4 md:col-span-2">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Address</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile?.address || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> To update your profile information, please contact the administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}