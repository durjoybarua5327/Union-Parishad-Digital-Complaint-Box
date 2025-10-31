"use client";

import { useRouter } from "next/navigation";

export default function ComplaintCard({ complaint }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/complaints/${complaint.id}`)}
      className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition p-5 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
        {complaint.title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
        {complaint.description}
      </p>
      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md">
          {complaint.category || "General"}
        </span>
        <span>{complaint.status || "Pending"}</span>
      </div>
    </div>
  );
}
