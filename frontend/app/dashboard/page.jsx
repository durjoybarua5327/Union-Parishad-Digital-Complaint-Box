"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import ComplaintDetailsModal from "./ComplaintDetailsModal";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }

    const fetchComplaints = async () => {
      try {
        const email =
          user.emailAddresses?.[0]?.emailAddress ||
          user.primaryEmailAddress?.email;
        if (!email) throw new Error("User email not found");

        const res = await fetch(
          `http://localhost:5000/api/complaints?user_email=${encodeURIComponent(
            email
          )}`
        );
        if (!res.ok) throw new Error("Failed to fetch complaints");
        const data = await res.json();
        setComplaints(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        My Complaints {user?.firstName ? `(${user.firstName})` : ""}
      </h1>

      {complaints.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p className="mb-4 text-lg">You haven't submitted any complaints yet.</p>
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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-2xl transition-all overflow-hidden group flex flex-col h-[28rem]"
            >
              {/* Image */}
              <div className="h-56 w-full overflow-hidden">
                <img
                  src={complaint.image_url || "/placeholder.jpg"}
                  alt={complaint.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow justify-between">
                <div className="flex flex-col space-y-3">
                  {/* Header row */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {complaint.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
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

                  {/* Category & Ward row */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    {/* Ward on the left */}
                    <div className="flex items-center gap-2">
                      {complaint.ward_no && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg font-semibold">
                          Ward {complaint.ward_no}
                        </span>
                      )}
                    </div>

                    {/* Category on the right */}
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {complaint.category || "General"}
                    </span>
                  </div>

                  {/* Date row */}
                  {complaint.created_at && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      🗓 {new Date(complaint.created_at).toLocaleDateString()}
                    </div>
                  )}

                  {/* View Details button */}
                  <div className="mt-3">
                    <button
                      onClick={() => setSelectedComplaint(complaint)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
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
        />
      )}
    </div>
  );
}
