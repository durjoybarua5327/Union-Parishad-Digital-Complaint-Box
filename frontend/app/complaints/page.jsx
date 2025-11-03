"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import ComplaintDetailsModal from "@/app/dashboard/ComplaintDetailsModal";
import toast from "react-hot-toast";

export default function ComplaintsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: "", ward: "" });

  const fetchComplaints = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/complaints?visibility=public");
      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();

      const mapped = data
        .filter((c) => c.visibility === "public")
        .map((c) => ({
          ...c,
          user_name: c.user?.full_name?.trim() || c.full_name?.trim() || "Anonymous",
        }))
        .filter((c) => !filters.status || c.status === filters.status)
        .filter((c) => !filters.ward || String(c.ward_no) === filters.ward);

      setComplaints(mapped);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filters]);

  const handleSubmitComplaint = async () => {
    if (!isLoaded || !user) {
      toast.error("Please log in first");
      return;
    }
    try {
      const profileRes = await fetch(
        `http://localhost:5000/api/profile/check?email=${encodeURIComponent(
          user.emailAddresses[0].emailAddress
        )}`
      );
      if (!profileRes.ok) throw new Error("Failed to check profile");

      const profileData = await profileRes.json();
      if (!profileData.exists || !profileData.complete) {
        toast.error("Please complete your profile first!");
        router.push("/profile?redirect=/complaints/create");
        return;
      }
      router.push("/complaints/create");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to check profile");
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold text-center text-blue-700 dark:text-blue-400 mb-10">
          🌍 Public Complaints
        </h1>

        {/* Submit button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleSubmitComplaint}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                       text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all"
          >
            + Submit a Complaint
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/60 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-md mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Filter by Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Ward Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Filter by Ward
              </label>
              <select
                value={filters.ward}
                onChange={(e) => setFilters((prev) => ({ ...prev, ward: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="">All Wards</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((ward) => (
                  <option key={ward} value={ward}>
                    Ward {ward}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-center text-red-600 mb-6">
            {error}{" "}
            <button onClick={fetchComplaints} className="ml-2 underline font-medium hover:text-red-700">
              Retry
            </button>
          </div>
        )}

        {complaints.length === 0 ? (
          <div className="text-center py-20 text-gray-600 dark:text-gray-300">
            <p className="text-lg mb-4">No public complaints available yet.</p>
            <button
              onClick={handleSubmitComplaint}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transition-transform hover:-translate-y-1"
            >
              Submit your first complaint →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-100 dark:border-gray-700 
                           rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
                  <img
                    src={complaint.image_url || "/placeholder.jpg"}
                    alt={complaint.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-md ${
                      complaint.status === "Resolved"
                        ? "bg-green-500/80 text-white"
                        : complaint.status === "In Progress"
                        ? "bg-blue-500/80 text-white"
                        : complaint.status === "Pending"
                        ? "bg-yellow-500/80 text-white"
                        : "bg-gray-500/80 text-white"
                    }`}
                  >
                    {complaint.status}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col grow justify-between">
                  <div className="flex flex-col space-y-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                      {complaint.title}
                    </h3>

                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium flex items-center gap-1">👤 {complaint.user_name}</span>
                      <span className="px-2 py-0.5 bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-100 rounded-full text-xs font-semibold">
                        {complaint.category || "General"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {complaint.ward_no && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg font-semibold">
                          Ward {complaint.ward_no}
                        </span>
                      )}
                      {complaint.created_at && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold">
                          🗓 {new Date(complaint.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedComplaint(complaint)}
                    className="mt-5 inline-block px-4 py-2 rounded-lg font-semibold text-blue-600 hover:text-white 
                               border border-blue-600 hover:bg-blue-600 transition-colors duration-200"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedComplaint && (
          <ComplaintDetailsModal
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
            userEmail={user?.emailAddresses?.[0]?.emailAddress}
          />
        )}
      </div>
    </div>
  );
}
