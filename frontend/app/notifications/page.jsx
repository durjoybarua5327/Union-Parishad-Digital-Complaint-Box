"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/api";
import { withAuth } from "@/app/auth";
import Link from "next/link";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await apiFetch("/api/notifications");
      setNotifications(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch("/api/notifications/read-all", {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-gray-600 dark:text-gray-400">
              You have {unreadCount} unread notification
              {unreadCount !== 1 && "s"}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600">
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            You're all caught up! No notifications to display.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg transition ${
                notification.read
                  ? "bg-white dark:bg-gray-800"
                  : "bg-blue-50 dark:bg-blue-900/20"
              } border border-gray-200 dark:border-gray-700`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p
                    className={`mb-1 ${
                      notification.read
                        ? "text-gray-800 dark:text-gray-200"
                        : "text-gray-900 dark:text-gray-100 font-medium"
                    }`}
                  >
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                    {notification.type === "COMPLAINT_UPDATE" && (
                      <Link
                        href={`/complaints/${notification.data?.complaint_id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Complaint →
                      </Link>
                    )}
                  </div>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="ml-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default withAuth(NotificationsPage);
