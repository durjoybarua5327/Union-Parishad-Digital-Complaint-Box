"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import OfficerNavbar from "@/components/OfficerNavbar";
import Link from "next/link";
import { TrendingUp, CheckCircle, Clock, Activity, AlertCircle } from "lucide-react";

export default function OfficerDashboardPage() {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.emailAddresses[0]?.emailAddress) {
      fetchDashboard();
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/officer/dashboard?officer_email=${user.emailAddresses[0].emailAddress}`
      );
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "text-yellow-600";
      case "In Progress":
        return "text-blue-600";
      case "Resolved":
        return "text-green-600";
      case "Closed":
        return "text-gray-600";
      default:
        return "text-gray-600";
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

  if (!dashboardData) {
    return (
      <div>
        <OfficerNavbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OfficerNavbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Officer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your activity and complaint statistics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Complaints */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {dashboardData.total}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Complaints</p>
          </div>

          {/* Status Changes Made */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {dashboardData.changesMade}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Status Changes Made</p>
          </div>

          {/* Pending Complaints */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {dashboardData.statusBreakdown.find(s => s.status === 'Pending')?.count || 0}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Complaints</p>
          </div>

          {/* Resolved Complaints */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {dashboardData.statusBreakdown.find(s => s.status === 'Resolved')?.count || 0}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Resolved Complaints</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Status Breakdown
          </h2>
          <div className="space-y-4">
            {dashboardData.statusBreakdown.map((item) => {
              const percentage = (item.count / dashboardData.total) * 100;
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'Pending' ? 'bg-yellow-500' :
                        item.status === 'In Progress' ? 'bg-blue-500' :
                        item.status === 'Resolved' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Recent Status Changes
          </h2>
          {dashboardData.recentChanges && dashboardData.recentChanges.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentChanges.map((change) => (
                <Link
                  key={change.id}
                  href={`/officer/complaints/${change.complaint_id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {change.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className={getStatusColor(change.old_status)}>
                          {change.old_status}
                        </span>
                        <span>→</span>
                        <span className={getStatusColor(change.new_status)}>
                          {change.new_status}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(change.change_date).toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No status changes yet. Start managing complaints to see your activity here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}