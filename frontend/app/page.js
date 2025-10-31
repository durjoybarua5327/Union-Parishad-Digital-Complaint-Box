"use client";

import { useEffect, useState } from "react";
// ...existing code...
import ComplaintCard from "@/components/ComplaintCard";
import { useAuth, useUser, UserButton, SignIn } from "@clerk/nextjs";

export default function HomePage() {
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    // Only fetch complaints for signed-in users
    if (!isLoaded || !isSignedIn) {
      setComplaints([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("http://localhost:5000/api/complaints")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch complaints");
        return res.json();
      })
      .then((data) => setComplaints(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  // If auth hasn't loaded yet, show nothing (or a small loader)
  if (!isLoaded) {
    return (
      <div className="w-full max-w-5xl">
        <p className="text-center text-gray-500">Loading...</p>
      </div>
    );
  }

  // If user is not signed in, show the embedded SignIn UI
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-6">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: "bg-blue-500 hover:bg-blue-600",
                footerActionLink: "text-blue-400 hover:text-blue-300",
              },
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl relative">
      

      <h2 className="text-3xl font-bold mb-8 text-center text-blue-700 dark:text-blue-400">
        Citizen Complaints Overview
      </h2>

      {loading && (
        <p className="text-center text-gray-500 dark:text-gray-400">Loading complaints...</p>
      )}

      {error && (
        <p className="text-center text-red-600 dark:text-red-400 mb-4">{error}</p>
      )}

      {!loading && complaints.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">No complaints found yet.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {complaints.map((complaint) => (
          <ComplaintCard key={complaint.id} complaint={complaint} />
        ))}
      </div>
    </div>
  );
}
