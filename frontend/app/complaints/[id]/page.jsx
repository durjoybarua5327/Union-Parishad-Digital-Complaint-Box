"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/utils/api";
import { useAuth } from "@/app/auth";

export default function ComplaintDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const { id } = params;

  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComplaint = async () => {
    try {
      const res = await apiFetch(`/api/complaints/${id}`);
      // backend returns { complaint, attachments, history, comments }
      setComplaint(res.data.complaint);
      setComments(res.data.comments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!newComment) return;
    try {
      await apiFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({ complaintId: id, content: newComment, visibility }),
      });
      setNewComment("");
      fetchComplaint();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchComplaint();
    // Set visibility based on user role
    if (user && (user.role === "OFFICER" || user.role === "ADMIN")) {
      setVisibility("INTERNAL");
    } else {
      setVisibility("PUBLIC");
    }
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>Complaint not found or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }

  const canUpdateStatus = user?.role === "ADMIN" || user?.role === "OFFICER";

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      {/* Complaint Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{complaint.title}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{complaint.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Ward {complaint.ward}</span>
            </div>
            {complaint.category && (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>{complaint.category}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{new Date(complaint.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              complaint.status === "RESOLVED"
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : complaint.status === "IN_REVIEW"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
            }`}
          >
            {complaint.status || "PENDING"}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              complaint.visibility === "PRIVATE"
                ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
            }`}
          >
            {complaint.visibility || "PUBLIC"}
          </span>
        </div>
      </div>

      {complaint.attachments?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
          {complaint.attachments.map((file) => (
            <img key={file.id} src={file.file_url} alt="attachment" className="w-full h-40 object-cover rounded-md shadow" />
          ))}
        </div>
      )}

      {/* Status Actions for Officers/Admin */}
      {canUpdateStatus && (
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Update Status</h3>
          <div className="flex gap-4">
            <button
              onClick={() => handleStatusChange("IN_REVIEW")}
              disabled={complaint.status === "IN_REVIEW"}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                complaint.status === "IN_REVIEW"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              }`}
            >
              Mark In Review
            </button>
            <button
              onClick={() => handleStatusChange("RESOLVED")}
              disabled={complaint.status === "RESOLVED"}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                complaint.status === "RESOLVED"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
              }`}
            >
              Mark Resolved
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Timeline</h3>
        <div className="space-y-4">
          {(complaint.history || []).map((h, index) => (
            <div key={h.id} className="flex items-start gap-4">
              <div
                className={`mt-2 w-3 h-3 rounded-full flex-shrink-0 ${
                  h.status === "RESOLVED"
                    ? "bg-green-500"
                    : h.status === "IN_REVIEW"
                    ? "bg-blue-500"
                    : "bg-yellow-500"
                }`}
              ></div>
              <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{h.status}</p>
                    {h.note && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{h.note}</p>}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(h.changed_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Comments</h3>
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                      {c.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{c.user_name}</p>
                      <p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      c.visibility === "INTERNAL"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                        : c.visibility === "PRIVATE"
                        ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                    }`}
                  >
                    {c.visibility}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        {user && (
          <form onSubmit={handleComment} className="space-y-4">
            <div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-4 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[100px] resize-y"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="p-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="PUBLIC">Public Comment</option>
                {(user.role === "OFFICER" || user.role === "ADMIN") && (
                  <option value="INTERNAL">Internal Note</option>
                )}
                <option value="PRIVATE">Private Note</option>
              </select>

              <button
                type="submit"
                disabled={!newComment.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  !newComment.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                    : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                }`}
              >
                Post Comment
              </button>
            </div>
          </form>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
