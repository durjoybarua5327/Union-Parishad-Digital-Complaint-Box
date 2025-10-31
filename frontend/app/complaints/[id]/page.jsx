"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/utils/api";

export default function ComplaintDetailPage() {
  const params = useParams();
  const { id } = params;

  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState(null);

  const fetchComplaint = async () => {
    try {
      const res = await apiFetch(`/api/complaints?id=${id}`);
      setComplaint(res.data[0]);
      // Assuming backend returns comments in complaint or fetch separately
      setComments(res.data[0]?.comments || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleComment = async () => {
    if (!newComment) return;
    try {
      await apiFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({ complaintId: id, content: newComment }),
      });
      setNewComment("");
      fetchComplaint();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  if (!complaint) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-2">{complaint.title}</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{complaint.description}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Status: {complaint.status || "Pending"} | Category: {complaint.category}
      </p>

      {complaint.attachments?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-4">
          {complaint.attachments.map((file, i) => (
            <img
              key={i}
              src={file.file_url}
              alt={`attachment-${i}`}
              className="h-32 rounded-md object-cover"
            />
          ))}
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Comments</h3>
        <div className="space-y-2 mb-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
            >
              <p className="text-sm">{c.content}</p>
              <span className="text-xs text-gray-500">{c.user_name}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
          />
          <button
            onClick={handleComment}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Comment
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
