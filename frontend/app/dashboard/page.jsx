"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import ComplaintDetailsModal from "./ComplaintDetailsModal";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null); // for modal

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }

    const fetchComplaints = async () => {
      try {
        const email =
          user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.email;
        if (!email) throw new Error("User email not found");

        const res = await fetch(
          `http://localhost:5000/api/complaints?user_email=${encodeURIComponent(email)}`
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
    <div className="max-w-7xl w-full mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Complaints {user?.firstName ? `(${user.firstName})` : ""}
        </h1>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-2xl transition"
            >
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                  {complaint.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 break-words overflow-hidden">
  {complaint.description.length > 120
    ? `${complaint.description.substring(0, 120)}...`
    : complaint.description}
</p>

              </div>

              <div className="flex justify-between items-center mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
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

                <button
                  onClick={() => setSelectedComplaint(complaint)}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  View Details
                </button>
              </div>

              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span>Ward {complaint.ward_no}</span> •{" "}
                <span>
                  Submitted {new Date(complaint.created_at).toLocaleDateString()}
                </span>
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
