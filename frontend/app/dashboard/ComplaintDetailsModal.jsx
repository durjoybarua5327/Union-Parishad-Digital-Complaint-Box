"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ComplaintDetailsModal({ complaint, onClose }) {
  const [complaintDetails, setComplaintDetails] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/complaints/${complaint.id}`);
        if (!res.ok) throw new Error("Failed to fetch complaint details");
        const data = await res.json();
        setComplaintDetails(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDetails();
  }, [complaint.id]);

  if (!complaintDetails) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-center pt-10 px-4 sm:pt-20 bg-black/40 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 
                   rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 border border-blue-100 
                   dark:border-gray-700 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-2xl font-bold transition-colors"
        >
          &times;
        </button>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">
          {complaintDetails.title}
        </h2>

        {/* Divider */}
        <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full mb-4"></div>

        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed break-words">
          {complaintDetails.description}
        </p>

        {/* Images */}
        {complaintDetails.images?.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {complaintDetails.images.map((img, idx) => (
              <img
                key={idx}
                src={`http://localhost:5000${img.image_url}`}
                alt="Complaint image"
                className="w-full h-32 sm:h-36 object-cover rounded-lg border border-blue-100 dark:border-gray-700 shadow-sm hover:scale-[1.02] transition-transform"
              />
            ))}
          </div>
        )}

        {/* Status */}
        <div className="mb-6 text-sm">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Status:</span>{" "}
          <span
            className={`font-semibold px-3 py-1 rounded-full text-white text-xs ${
              complaintDetails.status === "Resolved"
                ? "bg-green-500"
                : complaintDetails.status === "Pending"
                ? "bg-yellow-500"
                : "bg-blue-500"
            }`}
          >
            {complaintDetails.status}
          </span>
        </div>

        {/* Comments */}
        <div>
          <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-200">
            Comments
          </h3>
          {complaintDetails.comments?.length > 0 ? (
            <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {complaintDetails.comments.map((c) => (
                <li
                  key={c.id}
                  className="p-3 bg-blue-50 dark:bg-gray-700 rounded-xl border border-blue-100 dark:border-gray-600 shadow-sm"
                >
                  <p className="text-gray-800 dark:text-gray-200 mb-1 break-words">
                    {c.content}
                  </p>
                  <span className="text-xs text-gray-500">
                    {c.user_name} • {new Date(c.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No comments yet.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
