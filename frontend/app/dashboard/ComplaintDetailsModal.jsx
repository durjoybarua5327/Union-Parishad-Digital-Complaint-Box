"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

export default function ComplaintDetailsModal({ complaint, onClose, userEmail }) {
  const [complaintDetails, setComplaintDetails] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const intervalRef = useRef();

  // Disable background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Fetch complaint details function
  const fetchDetails = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${complaint.id}`);
      if (!res.ok) throw new Error("Failed to fetch complaint details");
      const data = await res.json();
      setComplaintDetails(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load complaint details");
    }
  };

  // Fetch once on mount
  useEffect(() => {
    fetchDetails();

    // Live polling every 5 seconds
    intervalRef.current = setInterval(fetchDetails, 5000);
    return () => clearInterval(intervalRef.current);
  }, [complaint.id]);

  const handleDelete = async () => {
    setConfirmOpen(false);
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${complaint.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete complaint");
      toast.success("Complaint deleted successfully");
      // Remove locally instead of reloading
      setComplaintDetails(null);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete complaint");
    }
  };

  const handleEdit = () => {
    window.location.href = `/complaints/create?id=${complaint.id}`;
  };

  if (!complaintDetails) return null;

  const isCreator = complaintDetails.email === userEmail;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-center items-start overflow-auto bg-black/30 backdrop-blur-sm"
      onClick={onClose}
      style={{ paddingTop: "5vh", paddingBottom: "5vh" }}
    >
      <div
        className="relative bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800
                   rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-3xl p-0 border border-blue-100 dark:border-gray-700 animate-fadeIn overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 z-20 border-b border-blue-100 dark:border-gray-700 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-400">
              {complaintDetails.title}
            </h2>
            {/* Category Badge */}
            {complaintDetails.category && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100 text-sm font-semibold">
                {complaintDetails.category}
              </span>
            )}
          </div>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-3 sm:mt-0 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-2xl font-bold transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Edit/Delete buttons */}
          {isCreator && (
            <div className="flex gap-3 mb-4 relative">
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>

              {/* Inline Confirm Modal */}
              {confirmOpen && (
                <div className="absolute top-12 right-0 min-w-[200px] max-w-[300px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
                  <p className="text-gray-800 dark:text-gray-200 mb-3 text-sm">
                    Are you sure you want to delete this complaint? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setConfirmOpen(false)}
                      className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed break-words">
            {complaintDetails.description}
          </p>

          {/* Images */}
          {complaintDetails.images?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {complaintDetails.images.map((img, idx) => (
                <img
                  key={idx}
                  src={`http://localhost:5000${img.image_url}`}
                  alt="Complaint image"
                  className="w-full h-auto object-cover rounded-lg border border-blue-100 dark:border-gray-700 shadow-sm hover:scale-[1.02] transition-transform"
                />
              ))}
            </div>
          )}

          {/* Status */}
          <div className="text-sm">
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
          <div className="overflow-auto">
            <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-200">
              Comments
            </h3>
            {complaintDetails.comments?.length > 0 ? (
              <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
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
              <p className="text-gray-500 dark:text-gray-400 italic">No comments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
