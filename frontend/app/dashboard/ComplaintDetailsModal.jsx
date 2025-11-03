"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { Send, User, Shield, Edit2, Trash2, X, Check } from "lucide-react";

export default function ComplaintDetailsModal({ complaint, onClose, userEmail }) {
  const [complaintDetails, setComplaintDetails] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const intervalRef = useRef();

  // Disable background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Fetch user data (ID and role)
  useEffect(() => {
    const fetchUserData = async () => {
      if (userEmail) {
        try {
          const res = await fetch(`http://localhost:5000/api/profile?email=${userEmail}`);
          if (res.ok) {
            const data = await res.json();
            setUserId(data.id);
            setUserRole(data.role);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, [userEmail]);

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

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userId) {
      toast.error("Please enter a comment");
      return;
    }

    setAddingComment(true);
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${complaint.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          comment: newComment.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to add comment");
      
      toast.success("Comment added successfully");
      setNewComment("");
      await fetchDetails();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setAddingComment(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: editCommentText.trim(),
          user_id: userId,
        }),
      });

      if (!res.ok) throw new Error("Failed to update comment");
      
      toast.success("Comment updated successfully");
      setEditingCommentId(null);
      setEditCommentText("");
      await fetchDetails();
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete comment");
      
      toast.success("Comment deleted successfully");
      setDeletingCommentId(null);
      await fetchDetails();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const startEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  const handleDelete = async () => {
    setConfirmOpen(false);
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${complaint.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete complaint");
      toast.success("Complaint deleted successfully");
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

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "officer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
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
            {complaintDetails.category && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100 text-sm font-semibold">
                {complaintDetails.category}
              </span>
            )}
          </div>
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
                  : complaintDetails.status === "In Progress"
                  ? "bg-blue-500"
                  : "bg-gray-500"
              }`}
            >
              {complaintDetails.status}
            </span>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comments ({complaintDetails.comments?.length || 0})
            </h3>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mb-4">
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows="2"
                  disabled={addingComment}
                />
                <button
                  type="submit"
                  disabled={addingComment || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {addingComment ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {addingComment ? "Sending..." : "Send"}
                </button>
              </div>
            </form>

            {/* Comments List */}
            {complaintDetails.comments?.length > 0 ? (
              <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {complaintDetails.comments.map((c) => {
                  const isOwner = c.user_id === userId;
                  const isEditing = editingCommentId === c.id;

                  return (
                    <li
                      key={c.id}
                      className="p-4 bg-blue-50 dark:bg-gray-700 rounded-xl border border-blue-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 dark:bg-gray-600 flex items-center justify-center">
                          {c.user_role === 'officer' || c.user_role === 'admin' ? (
                            <Shield className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                          ) : (
                            <User className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {c.user_name}
                              </span>
                              {c.user_role && c.user_role !== 'citizen' && (
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRoleBadgeColor(c.user_role)}`}>
                                  {c.user_role.toUpperCase()}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(c.created_at).toLocaleString()}
                              </span>
                            </div>
                            {isOwner && !isEditing && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => startEdit(c)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-gray-600 rounded transition"
                                  title="Edit comment"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingCommentId(c.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-gray-600 rounded transition"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="mt-2">
                              <textarea
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                                rows="2"
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleEditComment(c.id)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 transition text-sm flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-800 dark:text-gray-200 break-words">
                              {c.content}
                            </p>
                          )}

                          {/* Delete Confirmation */}
                          {deletingCommentId === c.id && (
                            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                                Delete this comment?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeletingCommentId(null)}
                                  className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 transition text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 italic">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}