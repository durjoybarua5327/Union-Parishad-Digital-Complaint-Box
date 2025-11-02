"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import OfficerNavbar from "@/components/OfficerNavbar";
import { Clock, MapPin, Eye, User, MessageSquare, ArrowLeft } from "lucide-react";

export default function OfficerComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchComplaint();
    fetchUserId();
  }, [params.id]);

  const fetchUserId = async () => {
    if (user?.emailAddresses[0]?.emailAddress) {
      try {
        const res = await fetch(
          `http://localhost:5000/api/profile?email=${user.emailAddresses[0].emailAddress}`
        );
        const data = await res.json();
        setUserId(data.id);
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    }
  };

  const fetchComplaint = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${params.id}`);
      const data = await res.json();
      setComplaint(data);
      setNewStatus(data.status);
    } catch (error) {
      console.error("Error fetching complaint:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!user?.emailAddresses[0]?.emailAddress) return;
    
    setUpdatingStatus(true);
    try {
      const res = await fetch(`http://localhost:5000/api/officer/complaints/${params.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          officer_email: user.emailAddresses[0].emailAddress,
        }),
      });

      if (res.ok) {
        await fetchComplaint();
        alert("Status updated successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userId) return;

    setAddingComment(true);
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          comment: newComment,
        }),
      });

      if (res.ok) {
        setNewComment("");
        await fetchComplaint();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setAddingComment(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-300";
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div>
        <OfficerNavbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div>
        <OfficerNavbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">Complaint not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OfficerNavbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to All Complaints</span>
        </button>

        {/* Complaint Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {complaint.title}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(complaint.status)}`}>
              {complaint.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(complaint.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Ward {complaint.ward_no}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span className="capitalize">{complaint.visibility}</span>
            </div>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {complaint.category}
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {complaint.description}
          </p>
        </div>

        {/* Images */}
        {complaint.images && complaint.images.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {complaint.images.map((img, index) => (
                <img
                  key={index}
                  src={`http://localhost:5000${img.image_url}`}
                  alt={`Complaint image ${index + 1}`}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* Update Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Update Status</h2>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <button
              onClick={handleStatusUpdate}
              disabled={updatingStatus || newStatus === complaint.status}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {updatingStatus ? "Updating..." : "Update Status"}
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({complaint.comments?.length || 0})
          </h2>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white resize-none"
              rows="3"
            />
            <button
              type="submit"
              disabled={addingComment || !newComment.trim()}
              className="mt-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {addingComment ? "Adding..." : "Add Comment"}
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {complaint.comments && complaint.comments.length > 0 ? (
              complaint.comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {comment.user_name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}