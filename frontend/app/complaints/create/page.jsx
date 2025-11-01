"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { showToast } from "@/utils/toast";

export default function SubmitComplaintPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ ward_no: "" });
  const [categories, setCategories] = useState([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    if (isLoaded && user && !profileChecked) {
      fetchProfile();
      fetchCategories();
      setProfileChecked(true);
    }
  }, [isLoaded, user, profileChecked]);

  const fetchProfile = async () => {
    try {
      const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
      if (!email) return showToast("error", "User email not found.", "emailNotFound");

      const res = await fetch(`http://localhost:5000/api/profile/check?email=${encodeURIComponent(email)}`);
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
      const res = await fetch("http://localhost:5000/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
      setFilteredCategories(data);
    } catch (err) {
      console.error(err);
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

  const handleImageChange = (e) => setImages(Array.from(e.target.files));

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!user) return showToast("error", "Please log in first", "userNotLoggedIn");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("user_email", user.emailAddresses[0].emailAddress.toLowerCase());
      formData.append("title", e.target.title.value);
      formData.append("description", e.target.description.value);
      formData.append("category", categoryQuery);
      formData.append("ward_no", e.target.ward_no.value);
      formData.append("visibility", e.target.visibility.value);

      images.forEach((img) => formData.append("images", img));

      const res = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit complaint");
      }

      showToast("success", "Complaint submitted successfully!", "complaintSuccess");
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
            Submit Your Complaint
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-base">
            Please fill out all the required fields below to file your complaint.
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

          {/* Autocomplete Category */}
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

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Upload Images (optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-3 border rounded-xl bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-base"
            />
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={URL.createObjectURL(img)}
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
            {loading ? "Submitting..." : "Submit Complaint"}
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
