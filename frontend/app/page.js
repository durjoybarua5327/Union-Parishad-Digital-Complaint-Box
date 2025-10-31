"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/api";
import ComplaintCard from "@/components/ComplaintCard";

export default function HomePage() {
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/complaints")
      .then((res) => setComplaints(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-5xl">
      <h2 className="text-3xl font-bold mb-8 text-center text-blue-700 dark:text-blue-400">
        Citizen Complaints Overview
      </h2>

      {loading && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Loading complaints...
        </p>
      )}

      {error && (
        <p className="text-center text-red-600 dark:text-red-400 mb-4">
          {error}
        </p>
      )}

      {!loading && complaints.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No complaints found yet.
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {complaints.map((complaint) => (
          <ComplaintCard key={complaint.id} complaint={complaint} />
        ))}
      </div>
    </div>
  );
}
