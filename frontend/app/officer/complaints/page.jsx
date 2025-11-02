"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Clock, MapPin, Eye, MessageSquare, Filter } from "lucide-react";

export default function OfficerComplaintsPage() {
  const { user } = useUser();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/complaints");
      const data = await res.json();
      setComplaints(data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    if (filter !== "all" && complaint.status !== filter) return false;
    if (categoryFilter !== "all" && complaint.category !== categoryFilter) return false;
    if (wardFilter !== "all" && complaint.ward_no !== wardFilter) return false;
    return true;
  });

  const uniqueCategories = [...new Set(complaints.map((c) => c.category))];
  const uniqueWards = [...new Set(complaints.map((c) => c.ward_no))];

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-300";
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            Officer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            View, manage, and update complaints efficiently
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white transition duration-200"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white transition duration-200"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Ward Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ward
              </label>
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white transition duration-200"
              >
                <option value="all">All Wards</option>
                {uniqueWards.map((ward) => (
                  <option key={ward} value={ward}>Ward {ward}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { title: "Total", value: complaints.length, color: "text-gray-900" },
            { title: "Pending", value: complaints.filter(c => c.status === "Pending").length, color: "text-yellow-600" },
            { title: "In Progress", value: complaints.filter(c => c.status === "In Progress").length, color: "text-blue-600" },
            { title: "Resolved", value: complaints.filter(c => c.status === "Resolved").length, color: "text-green-600" },
          ].map((stat) => (
            <div key={stat.title} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-md p-5 flex flex-col items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No complaints found with the selected filters.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredComplaints.map((complaint) => (
              <Link
                key={complaint.id}
                href={`/officer/complaints/${complaint.id}`}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row"
              >
                {/* Image */}
                {complaint.image_url && (
                  <div className="md:w-56 h-56 md:h-auto flex-shrink-0">
                    <img
                      src={complaint.image_url}
                      alt={complaint.title}
                      className="w-full h-full object-cover rounded-l-2xl"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                          {complaint.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-3">{complaint.description}</p>
                      </div>
                      <span className={`px-4 py-1 rounded-full text-sm font-semibold border ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>Ward {complaint.ward_no}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span className="capitalize">{complaint.visibility}</span>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">{complaint.category}</span>
                      <span className="text-xs">By: {complaint.full_name || complaint.email}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-300 mr-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">{complaint.comments?.length || 0} Comments</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
