// frontend/app/officer/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "../../utils/toast";

export default function OfficerPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  });

  useEffect(() => {
    // Update URL when filter changes
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('status', filters.status);
      window.history.pushState({}, '', url);
    }

    async function fetchData() {
      if (!isLoaded || !isSignedIn || !user) return;
      
      try {
        setLoading(true);
        const token = await getToken();
        
        // Fetch assigned complaints
        const res = await fetch(
          `http://localhost:5000/api/officer/assigned`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (!res.ok) throw new Error('Failed to fetch complaints');
        const data = await res.json();
        setAssigned(data);

        // Fetch officer stats
        const statsRes = await fetch(
          'http://localhost:5000/api/officer/stats',
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load officer dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isLoaded, isSignedIn, user, filters.status]);

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const changeStatus = async (id, newStatus) => {
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/officer/complaints/${id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to update status");
      
      const updated = assigned.map((it) => (it.id === Number(id) ? { ...it, status: newStatus } : it));
      setAssigned(updated);
      toast.success('Complaint status updated successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update status. Please try again.');
    }
  };

  if (loading) return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-yellow-600 text-sm font-medium">Pending</div>
          <div className="mt-2 text-2xl font-bold">{stats.pending || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-blue-600 text-sm font-medium">In Progress</div>
          <div className="mt-2 text-2xl font-bold">{stats.in_progress || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-green-600 text-sm font-medium">Resolved</div>
          <div className="mt-2 text-2xl font-bold">{stats.resolved || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-gray-600 text-sm font-medium">Closed</div>
          <div className="mt-2 text-2xl font-bold">{stats.closed || 0}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Assigned Complaints</h1>
        </div>

        {assigned.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600">No complaints found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assigned.map((c) => (
              <div key={c.id} className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
                <div className="flex justify-between items-start gap-4">
                  <div className="grow">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-lg text-gray-900">{c.title}</h2>
                      {c.is_assigned && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                          Assigned to You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <span>{c.category}</span>
                      <span>•</span>
                      <span>Complaint from Ward {c.citizen_ward_no}</span>
                      <span>•</span>
                      <span>ID: {c.id}</span>
                    </div>
                    <p className="mt-3 text-gray-700 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Submitted by: {c.citizen_name}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 min-w-[140px]">
                    <Link 
                      href={`/officer/${c.id}`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors text-center"
                    >
                      View Details
                    </Link>
                    {c.is_assigned && c.status !== 'resolved' && (
                      <button
                        onClick={() => changeStatus(c.id, "Resolved")}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
