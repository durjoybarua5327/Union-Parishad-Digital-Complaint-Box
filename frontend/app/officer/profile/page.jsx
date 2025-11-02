"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "../../../utils/toast";

export default function OfficerProfile() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_assigned: 0,
    resolved: 0,
    pending: 0,
    in_progress: 0,
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!isLoaded || !isSignedIn || !user) return;
      
      try {
        setLoading(true);
        const token = await getToken();
        const res = await fetch('http://localhost:5000/api/officer/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch profile');
        
        const data = await res.json();
        setProfile(data.profile);
        setStats(data.stats);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfile();
  }, [userProfile?.id, authToken]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-6">
          <img
            src={profile.image_url || "/default-avatar.png"}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold mb-2">{profile.name}</h1>
            <div className="space-y-1 text-gray-600">
              <p>Email: {profile.email}</p>
              <p>Ward: {profile.ward_no}</p>
              <p>Department: {profile.department}</p>
              <p>Phone: {profile.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-gray-600 text-sm font-medium">Total Assigned</div>
          <div className="mt-2 text-2xl font-bold">{stats.total_assigned}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-yellow-600 text-sm font-medium">Pending</div>
          <div className="mt-2 text-2xl font-bold">{stats.pending}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-blue-600 text-sm font-medium">In Progress</div>
          <div className="mt-2 text-2xl font-bold">{stats.in_progress}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-green-600 text-sm font-medium">Resolved</div>
          <div className="mt-2 text-2xl font-bold">{stats.resolved}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {profile.recent_activity && profile.recent_activity.length > 0 ? (
          <div className="space-y-4">
            {profile.recent_activity.map((activity) => (
              <div key={activity.id} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-800">{activity.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
}