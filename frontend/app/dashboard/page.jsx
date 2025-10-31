"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
// Directly fetch complaints from backend API
import Link from "next/link";

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return; // wait until Clerk is ready
    if (!isSignedIn) {
      window.location.href = "/sign-in"; // redirect unauthenticated users
      return;
    }

    const fetchComplaints = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/complaints");
        if (!res.ok) throw new Error("Failed to fetch complaints");
        const data = await res.json();
        setComplaints(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          My Complaints {user?.firstName ? `(${user.firstName})` : ""}
        </h1>
        <Link
          href="/complaints/create"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Submit New Complaint
        </Link>
      </div>

      {complaints.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            You haven't submitted any complaints yet.
          </p>
          <Link
            href="/complaints/create"
            className="text-blue-600 hover:underline"
          >
            Submit your first complaint →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {complaint.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {complaint.description.length > 150
                      ? `${complaint.description.substring(0, 150)}...`
                      : complaint.description}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    complaint.status === "RESOLVED"
                      ? "bg-green-100 text-green-800"
                      : complaint.status === "IN_REVIEW"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {complaint.status}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Ward {complaint.ward}</span>
                  <span>•</span>
                  <span>
                    Submitted {new Date(complaint.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Link
                  href={`/complaints/${complaint.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
