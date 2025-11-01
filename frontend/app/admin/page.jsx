"use client";

import { useEffect, useState } from "react";
// Directly fetch complaints from backend API
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    inReviewComplaints: 0,
    resolvedComplaints: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [officers, setOfficers] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Fetch complaints
        const res = await fetch("http://localhost:5000/api/complaints");
        if (!res.ok) throw new Error("Failed to fetch complaints");
        const data = await res.json();

        // Fetch officers
        const officersRes = await fetch("http://localhost:5000/api/users/officers");
        if (!officersRes.ok) throw new Error("Failed to fetch officers");
        const officersData = await officersRes.json();
        setOfficers(officersData);

        // Calculate stats from complaints
        const total = data.length;
        const pending = data.filter(c => c.status === "PENDING").length;
        const inReview = data.filter(c => c.status === "IN_REVIEW").length;
        const resolved = data.filter(c => c.status === "RESOLVED").length;

        setStats({
          totalComplaints: total,
          pendingComplaints: pending,
          inReviewComplaints: inReview,
          resolvedComplaints: resolved,
        });

        // Get 5 most recent complaints
        setRecentComplaints(data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Complaints</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalComplaints}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500 mt-2">{stats.pendingComplaints}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-500 mt-2">{stats.resolvedComplaints}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolution Rate</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mt-2">
            {stats.totalComplaints ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Complaints</h2>
          <Link
            href="/complaints"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Ward</th>
                <th className="pb-3 font-medium">Submitted</th>
                <th className="pb-3 font-medium">Assign Officer</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentComplaints.map((complaint) => (
                <tr key={complaint.id} className="text-sm">
                  <td className="py-4">{complaint.id}</td>
                  <td className="py-4">{complaint.title}</td>
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        complaint.status === "RESOLVED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : complaint.status === "IN_REVIEW"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {complaint.status}
                    </span>
                  </td>
                  <td className="py-4">{complaint.ward_no}</td>
                  <td className="py-4">{new Date(complaint.created_at).toLocaleDateString()}</td>
                  <td className="py-4">
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={complaint.assigned_officer || ''}
                      onChange={async (e) => {
                        try {
                          const res = await fetch(`http://localhost:5000/api/complaints/${complaint.id}/assign`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ officerId: e.target.value })
                          });
                          if (!res.ok) throw new Error('Failed to assign officer');
                          // Refresh data after assignment
                          fetchDashboard();
                        } catch (err) {
                          console.error('Error assigning officer:', err);
                        }
                      }}
                    >
                      <option value="">Select Officer</option>
                      {officers.map(officer => (
                        <option key={officer.id} value={officer.id}>
                          {officer.full_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4">
                    <Link
                      href={`/complaints/${complaint.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}