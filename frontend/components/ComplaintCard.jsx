"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ComplaintCard({ complaint, showMetadata = true }) {
  const router = useRouter();

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "RESOLVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "IN_REVIEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "MEDIUM":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Main Content */}
      <div className="p-6">
        <div className="flex justify-between items-start gap-4 mb-4">
          <Link
            href={`/complaints/${complaint.id}`}
            className="flex-1 hover:underline decoration-blue-500 decoration-2"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {complaint.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2">
            {complaint.priority && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                  complaint.priority
                )}`}
              >
                {complaint.priority}
              </span>
            )}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                complaint.status
              )}`}
            >
              {complaint.status || "PENDING"}
            </span>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4">
          {complaint.description}
        </p>

        {showMetadata && (
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Ward {complaint.ward}</span>
            </div>
            {complaint.category && (
              <div className="flex items-center gap-1">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <span>{complaint.category}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{new Date(complaint.created_at).toLocaleString()}</span>
            </div>
            {complaint.comments?.length > 0 && (
              <div className="flex items-center gap-1">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>{complaint.comments.length} comments</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
            {complaint.user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <span className="text-gray-600 dark:text-gray-300">
            {complaint.user?.name || "Anonymous"}
          </span>
        </div>
        <Link
          href={`/complaints/${complaint.id}`}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
