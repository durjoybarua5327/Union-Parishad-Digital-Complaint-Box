export default function Comment({ comment }) {
  return (
    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-gray-800 dark:text-gray-200 text-sm mb-1">
        {comment.content}
      </p>
      <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>By: {comment.user_name || "Anonymous"}</span>
        <span>{new Date(comment.created_at).toLocaleString()}</span>
      </div>
    </div>
  );
}
