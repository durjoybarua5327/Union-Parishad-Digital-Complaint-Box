// frontend/utils/api.js
"use client";

// ✅ Set API base from environment or fallback
// Use your backend port (default 3001)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ✅ Helper: Retrieve stored JWT token
export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// Helper: get stored user
export const getUser = () => {
  if (typeof window !== "undefined") {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }
  return null;
};

// ✅ Base fetch wrapper with JSON parsing & JWT header
export async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok) {
    throw new Error(data.message || data.error?.message || "API Error");
  }

  return data;
}

// ✅ Multipart form upload (for complaints with images)
export async function apiUpload(endpoint, formData) {
  const token = getToken();

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok) {
    throw new Error(data.message || data.error?.message || "Upload failed");
  }

  return data;
}

// ✅ Example: Login
export async function loginUser(email, password) {
  const res = await apiFetch("/api/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (res.success && res.data.token) {
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
  }

  return res;
}

// ✅ Example: Register
export async function registerUser(userData) {
  return await apiFetch("/api/users/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

// ✅ Example: Get complaints (role-based)
export async function getComplaints(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/api/complaints${query ? `?${query}` : ""}`;
  return await apiFetch(endpoint, { method: "GET" });
}

// ✅ Example: Create complaint
export async function createComplaint(formData) {
  return await apiUpload("/api/complaints", formData);
}
