// frontend/app/officer/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "../../../utils/toast";

export default function OfficerComplaintDetail({ params }) {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const id = params.id;
  const [complaint, setComplaint] = useState(null);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    fetchDetail();
  }, [id, isLoaded, isSignedIn, user]);

  async function fetchDetail() {
    try {
      setIsLoading(true);
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/officer/complaints/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch complaint details');
      const data = await res.json();
      setComplaint(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load complaint details. Please try again.');
      router.push('/officer');
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(newStatus) {
    try {
      setIsSubmitting(true);
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/officer/complaints/${id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to update status');
      
      setComplaint(json.complaint || { ...complaint, status: newStatus });
      toast.success('Complaint status updated successfully');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to update status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function postComment() {
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/officer/complaints/${id}/comments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ comment }),
      });
      
      if (!res.ok) throw new Error('Failed to post comment');
      
      const data = await res.json();
      if (!data) throw new Error('Invalid response from server');
      
      setComplaint((prev) => ({ ...prev, comments: data }));
      setComment("");
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!complaint) return null;

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push('/officer')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
        >
          ← Back to Complaints
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{complaint.title}</h1>
            <div className="flex gap-3 mt-2 text-sm text-gray-600">
              <span>Ward {complaint.ward_no}</span>
              <span>•</span>
              <span>{complaint.category}</span>
              <span>•</span>
              <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(complaint.status)}`}>
            {complaint.status}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Update Status</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => updateStatus("In Progress")} 
            disabled={isSubmitting || complaint.status === "In Progress"}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Mark In Progress
          </button>
          <button 
            onClick={() => updateStatus("Resolved")} 
            disabled={isSubmitting || complaint.status === "Resolved"}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Mark Resolved
          </button>
          <button 
            onClick={() => updateStatus("Closed")} 
            disabled={isSubmitting || complaint.status === "Closed"}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Close Case
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Comments & Updates</h2>
        <div className="space-y-4 mb-6">
          {complaint.comments?.length ? (
            complaint.comments.map((c) => (
              <div key={c.id} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{c.content}</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium">{c.user_name}</span>
                  <span>•</span>
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No comments yet.</p>
          )}
        </div>

        <div className="border-t pt-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
            placeholder="Add your comment or update..."
            disabled={isSubmitting}
          />
          <div className="mt-2 flex justify-end">
            <button 
              onClick={postComment} 
              disabled={isSubmitting || !comment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
