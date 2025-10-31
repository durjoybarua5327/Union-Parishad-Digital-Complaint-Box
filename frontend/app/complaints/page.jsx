"use client";

import { useEffect, useState } from "react";
import { getComplaints } from "@/utils/api";
import ComplaintCard from "@/components/ComplaintCard";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getComplaints()
      .then((res) => setComplaints(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-400 mb-8">
        All Complaints
      </h2>

      {loading && <p className="text-center text-gray-500">Loading complaints...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!loading && complaints.length === 0 && (
        <p className="text-center text-gray-500">No complaints available.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} />
        ))}
      </div>
    </div>
  );
}
