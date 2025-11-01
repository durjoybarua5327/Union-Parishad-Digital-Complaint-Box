"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "@/utils/toast";

export default function SubmitComplaintPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const complaintId = searchParams.get("id"); // Edit mode if this exists

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ ward_no: "" });
  const [categories, setCategories] = useState([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [profileChecked, setProfileChecked] = useState(false);

  // Fetch profile and categories
  useEffect(() => {
    if (isLoaded && user && !profileChecked) {
      fetchProfile();
      fetchCategories();
      setProfileChecked(true);
    }
  }, [isLoaded, user, profileChecked]);

  // Fetch complaint data for editing
  useEffect(() => {
    if (!complaintId) return;
    const fetchComplaintForEdit = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/complaints/${complaintId}`);
        if (!res.ok) throw new Error("Failed to fetch complaint");

        const data = await res.json();

        setProfile((prev) => ({ ...prev, ward_no: data.ward_no || prev.ward_no }));
        setCategoryQuery(data.category || "");
        setImages(
          data.images?.map((img) => ({
            url: `http://localhost:5000${img.image_url}`,
            file: null, // preview only
          })) || []
        );

        // Fill other form fields
        ["title", "description"].forEach((field) => {
          const el = document.querySelector(`[name="${field}"]`);
          if (el) el.value = data[field] || "";
        });

        const visibilityEl = document.querySelector('[name="visibility"]');
        if (visibilityEl) visibilityEl.value = data.visibility || "public";
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to load complaint data for editing", "editFetchError");
      }
    };

    fetchComplaintForEdit();
  }, [complaintId]);

  const fetchProfile = async () => {
    try {
      const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
      if (!email) return showToast("error", "User email not found.", "emailNotFound");

      const res = await fetch(`http://localhost:5000/api/profile/check?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Server response was not JSON");
      }
      const data = await res.json();

      if (!data.exists || !data.complete) {
        showToast("error", "Please complete your profile first!", "profileIncomplete");
        router.push("/profile");
        return;
      }

      setProfile(data.data);
    } catch (err) {
      console.error(err);
      showToast("error", "Error fetching profile.", "profileFetchError");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories/search");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      const data = await res.json();
      setCategories(data);
      setFilteredCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      showToast("error", "Failed to load categories", "categoriesFetchError");
      setCategories([]);
      setFilteredCategories([]);
    }
  };

  const handleCategoryChange = async (e) => {
    const value = e.target.value;
    setCategoryQuery(value);

    if (!value) {
      setFilteredCategories(categories);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/categories/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setFilteredCategories(data);
    } catch (err) {
      console.error(err);
      setFilteredCategories([]);
    }
  };

  const handleImageChange = (e) => {
    const newImages = Array.from(e.target.files).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setImages([...images.filter((img) => img.file), ...newImages]);
  };

  // ✅ Updated submit function with full required field validation
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!user) return showToast("error", "Please log in first", "userNotLoggedIn");

    const title = e.target.title.value.trim();
    const ward_no = e.target.ward_no.value.trim();
    const description = e.target.description.value.trim();
    const category = categoryQuery.trim();
    const visibility = e.target.visibility.value.trim();

    // Validate all required fields
    if (!title || !ward_no || !description || !category || !visibility) {
      return showToast("error", "All fields are required!", "fieldsRequired");
    }

    // Validate image upload
    if (images.length === 0) {
      return showToast("error", "Please upload at least one image!", "imagesRequired");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("user_email", user.emailAddresses[0].emailAddress.toLowerCase());
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("ward_no", ward_no);
      formData.append("visibility", visibility);

      images.forEach((img) => img.file && formData.append("images", img.file));

      const url = complaintId
        ? `http://localhost:5000/api/complaints/${complaintId}`
        : "http://localhost:5000/api/complaints";

      const res = await fetch(url, {
        method: complaintId ? "PUT" : "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit complaint");
      }

      showToast("success", `Complaint ${complaintId ? "updated" : "submitted"} successfully!`, "complaintSuccess");
      router.push("/complaints");
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to submit complaint", "complaintError");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-100 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 md:p-14 transition-all duration-300 hover:shadow-blue-300 dark:hover:shadow-blue-800">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-linear-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
            {complaintId ? "Edit Complaint" : "Submit Your Complaint"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-base">
            Please fill out all the required fields below.
          </p>
        </div>

        <form onSubmit={handleSubmitComplaint} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField name="title" label="Title" placeholder="Enter your complaint title" required />
            <InputField
              name="ward_no"
              label="Ward Number"
              placeholder="Enter your ward number"
              type="number"
              defaultValue={profile.ward_no || ""}
              required
            />
          </div>

          <InputField
            name="description"
            label="Description"
            placeholder="Describe your issue in detail..."
            as="textarea"
            required
          />

          {/* Category */}
          <div className="relative">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Category</label>
            <input
              name="category"
              value={categoryQuery}
              onChange={handleCategoryChange}
              placeholder="Type or select category"
              required
              className="w-full p-3.5 border rounded-xl bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-base shadow-sm hover:shadow-md"
            />
            {categoryQuery && filteredCategories.length > 0 && (
              <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border rounded-xl mt-1 max-h-48 overflow-y-auto shadow-lg text-base">
                {filteredCategories.map((cat) => (
                  <li
                    key={cat.id}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-600 transition"
                    onClick={() => {
                      setCategoryQuery(cat.name);
                      setFilteredCategories([]);
                    }}
                  >
                    {cat.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Upload Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className={`w-full p-3 border rounded-xl bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 transition text-base ${
                images.length === 0 ? "border-red-500" : "border-gray-300 dark:border-gray-700"
              } focus:ring-blue-500`}
            />
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.url}
                    alt={`preview-${idx}`}
                    className="w-full h-32 object-cover rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Visibility</label>
            <select
              name="visibility"
              required
              className="w-full p-3.5 border rounded-xl bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-base"
            >
              <option value="">Select visibility</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 font-bold rounded-xl text-white text-lg transition-all duration-200 ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? "Submitting..." : complaintId ? "Update Complaint" : "Submit Complaint"}
          </button>
        </form>
      </div>
    </div>
  );
}

function InputField({ label, name, placeholder, type = "text", as = "input", defaultValue, required }) {
  if (as === "textarea") {
    return (
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">{label}</label>
        <textarea
          name={name}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          rows={5}
          className="w-full p-3.5 border rounded-xl bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-base"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full p-3.5 border rounded-xl bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-base"
      />
    </div>
  );
}
