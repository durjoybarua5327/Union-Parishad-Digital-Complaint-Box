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

  if (!complaint) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">{complaint.title}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">{complaint.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Status: <span className="font-semibold">{complaint.status || "Pending"}</span>
            {' '}| Category: {complaint.category} {' '}| Ward: {complaint.ward}
          </p>
        </div>

        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-sm ${complaint.visibility === 'PRIVATE' ? 'bg-gray-800 text-white' : 'bg-blue-100 text-blue-800'}`}>
            {complaint.visibility || 'PUBLIC'}
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

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Timeline</h3>
        <ul className="space-y-2 mb-6">
          {(complaint.history || []).map((h) => (
            <li key={h.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between">
                <div className="text-sm">{h.status}</div>
                <div className="text-xs text-gray-500">{new Date(h.changed_at).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>

        <h3 className="font-semibold mb-2">Comments</h3>
        <div className="space-y-2 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <strong className="text-sm">{c.user_name}</strong>
                <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm mb-1">{c.content}</p>
              <div className="text-xs text-gray-500">{c.visibility || 'PUBLIC'}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Add a comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
          />

          <div className="flex items-center gap-2">
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
              <option value="INTERNAL">Internal</option>
            </select>
            <button onClick={handleComment} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Comment</button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
