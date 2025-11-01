// frontend/utils/toast.js
import toast from "react-hot-toast";

let activeToasts = new Set();

/**
 * Show toast message
 * @param {"error"|"success"|"info"} type
 * @param {string} message
 * @param {string} id - unique identifier for this toast
 * @param {number} delay - delay before showing toast in ms (default 0)
 */
export const showToast = (type, message, id = message, delay = 0) => {
  if (activeToasts.has(id)) return; // Prevent duplicate toasts
  activeToasts.add(id);

  const clearToast = () => activeToasts.delete(id);

  setTimeout(() => {
    if (type === "error") {
      toast.error(message, { id, duration: 4000, onClose: clearToast });
    } else if (type === "success") {
      toast.success(message, { id, duration: 4000, onClose: clearToast });
    } else {
      toast(message, { id, duration: 4000, onClose: clearToast });
    }
  }, delay);
};
