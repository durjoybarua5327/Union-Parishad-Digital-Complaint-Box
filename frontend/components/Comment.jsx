export default function Comment({ comment }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
            {comment.user_name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {comment.user_name || "Anonymous"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(comment.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        {comment.visibility && (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              comment.visibility === "INTERNAL"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                : comment.visibility === "PRIVATE"
                ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
            }`}
          >
            {comment.visibility}
          </span>
        )}
      </div>
      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
        {comment.content}
      </p>
    </div>
  );
}
