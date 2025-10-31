"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/api";
import Link from "next/link";

export default function OfficerDashboard() {
  const [stats, setStats] = useState({
    assignedComplaints: 0,
    inReviewComplaints: 0,
    resolvedComplaints: 0,
  });
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [complaints] = await Promise.all([
          apiFetch("/api/complaints/assigned"),
        ]);

        // Calculate stats from assigned complaints
        const total = complaints.data.length;
        const inReview = complaints.data.filter(c => c.status === "IN_REVIEW").length;
        const resolved = complaints.data.filter(c => c.status === "RESOLVED").length;

        setStats({
          assignedComplaints: total,
          inReviewComplaints: inReview,
          resolvedComplaints: resolved,
        });

        // Sort by priority and get recent
        const sorted = [...complaints.data].sort((a, b) => {
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        setAssignedComplaints(sorted.slice(0, 5));
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
      <h1 className="text-3xl font-bold mb-8">Officer Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Complaints</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.assignedComplaints}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">In Review</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mt-2">{stats.inReviewComplaints}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-500 mt-2">{stats.resolvedComplaints}</p>
        </div>
      </div>

      {/* Assigned Complaints */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Active Complaints</h2>
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
                <th className="pb-3 font-medium">Priority</th>
                <th className="pb-3 font-medium">Received</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {assignedComplaints.map((complaint) => (
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
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        complaint.priority === "HIGH"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : complaint.priority === "MEDIUM"
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="py-4">{new Date(complaint.created_at).toLocaleDateString()}</td>
                  <td className="py-4">
                    <Link
                      href={`/complaints/${complaint.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Review →
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