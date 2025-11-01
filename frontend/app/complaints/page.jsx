"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { showToast } from "@/utils/toast";
import ComplaintCard from "@/components/ComplaintCard";

export default function ComplaintsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/complaints");
      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();
      setComplaints(data);
    } catch (err) {
      setError(err.message);
      showToast("error", err.message || "Failed to fetch complaints", "fetchComplaintsError");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async () => {
    if (!isLoaded || !user) {
      showToast("error", "Please log in first", "notLoggedIn");
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

      if (!profileData.exists) {
        showToast(
          "error",
          "No profile found for this account. Please complete your profile first!",
          "noProfileToast"
        );
        router.push("/profile?redirect=/complaints/create");
        return;
      }

      if (!profileData.complete) {
        showToast("error", "Please complete your profile first!", "incompleteProfileToast");
        router.push("/profile?redirect=/complaints/create");
        return;
      }

      // ✅ Profile exists & complete, redirect to complaint creation
      router.push("/complaints/create");
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to check profile", "profileCheckError");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-400 mb-8">
        All Complaints
      </h2>

      <div className="text-center mb-6">
        <button
          onClick={handleSubmitComplaint}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
        >
          Submit a Complaint
        </button>
      </div>

      {loading && <p className="text-center text-gray-500">Loading complaints...</p>}

      {error && (
        <div className="text-center text-red-600">
          {error}{" "}
          <button onClick={() => window.location.reload()} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {!loading && Array.isArray(complaints) && complaints.length === 0 && (
        <p className="text-center text-gray-500">No complaints available.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {Array.isArray(complaints) &&
          complaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
      </div>
    </div>
  );
}
