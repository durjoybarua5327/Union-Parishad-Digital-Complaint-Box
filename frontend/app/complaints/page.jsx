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

  const fetchComplaints = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/complaints?visibility=public");
      if (!res.ok) throw new Error("Failed to fetch complaints");

      const data = await res.json();

      const mappedComplaints = data
        .filter(c => c.visibility === "public")
        .map(c => ({
          ...c,
          user_name: c.user?.full_name?.trim() || c.full_name?.trim() || "Anonymous",
        }));

      setComplaints(mappedComplaints);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-400 mb-8">
        Public Complaints
      </h1>

      <div className="text-center mb-8">
        <button
          onClick={handleSubmitComplaint}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-xl transition"
        >
          Submit a Complaint
        </button>
      </div>

      {error && (
        <div className="text-center text-red-600 mb-6">
          {error}{" "}
          <button onClick={fetchComplaints} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p className="mb-4 text-lg">No public complaints available.</p>
          <a
            href="/complaints/create"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Submit your first complaint →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group flex flex-col"
            >
              {/* Image */}
              <div className="h-48 w-full overflow-hidden rounded-t-2xl">
                <img
                  src={complaint.image_url || "/placeholder.jpg"}
                  alt={complaint.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-grow justify-between">
                <div className="flex flex-col space-y-3">
                  {/* Header row */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                      {complaint.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        complaint.status === "Resolved"
                          ? "bg-green-100 text-green-800"
                          : complaint.status === "In Progress"
                          ? "bg-blue-100 text-blue-800"
                          : complaint.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {complaint.status}
                    </span>
                  </div>

                  {/* User and Category */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium flex items-center gap-1">
                      👤 {complaint.user_name}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {complaint.category || "General"}
                    </span>
                  </div>

                  {/* Ward & Date */}
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

                  {/* View Details button on next line */}
                  <div className="mt-3">
                    <button
                      onClick={() => setSelectedComplaint(complaint)}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
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
  );
}
