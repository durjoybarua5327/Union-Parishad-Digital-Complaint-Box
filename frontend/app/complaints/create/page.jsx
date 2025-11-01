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
  const [images, setImages] = useState([]);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    if (isLoaded && user && !profileChecked) {
      fetchProfile();
      fetchCategories();
      setProfileChecked(true);
    }
  }, [isLoaded, user, profileChecked]);

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
      if (!email) return showToast("error", "User email not found.", "emailNotFound");

      const res = await fetch(`http://localhost:5000/api/profile/check?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (!data.exists) {
        showToast("error", "No profile found. Complete your profile first!", "noProfileToast");
        router.push("/profile");
        return;
      }

      if (!data.complete) {
        showToast("error", "Please complete your profile first!", "incompleteProfileToast");
        router.push("/profile");
        return;
      }

      setProfile(data.data);
    } catch (err) {
      console.error(err);
      showToast("error", "Error fetching profile.", "profileFetchError");
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
      showToast("error", "Could not load categories.", "fetchCategoriesError");
    }
  };

  const handleImageChange = (e) => setImages(Array.from(e.target.files));

  // Submit complaint
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!user) return showToast("error", "Please log in first", "userNotLoggedIn");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("user_email", user.emailAddresses[0].emailAddress.toLowerCase());
      formData.append("title", e.target.title.value);
      formData.append("description", e.target.description.value);
      formData.append("category", e.target.category.value);
      formData.append("ward_no", e.target.ward_no.value);
      formData.append("visibility", e.target.visibility.value);

      // Append all images
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit complaint");
      }

      const data = await res.json();
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
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-14">
        <h1 className="text-5xl font-extrabold text-center text-blue-600 dark:text-blue-400 mb-6">
          Submit a Complaint
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 text-lg mb-12">
          Fill in the details of your complaint below.
        </p>

        <form onSubmit={handleSubmitComplaint} className="space-y-10">
          <InputField name="title" label="Title" placeholder="Complaint title" required />
          <InputField
            name="description"
            label="Description"
            placeholder="Describe your issue"
            as="textarea"
            required
          />

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              name="category"
              className="w-full p-5 border rounded-2xl bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm hover:shadow-md"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <InputField
            name="ward_no"
            label="Ward Number"
            placeholder="Ward number"
            type="number"
            defaultValue={profile.ward_no || ""}
            required
          />

          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              Upload Images (multiple allowed)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-4 border rounded-2xl bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm hover:shadow-md"
            />
            {images.length > 0 && (
              <div className="flex flex-wrap mt-4 gap-4">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={URL.createObjectURL(img)}
                    alt={`preview-${idx}`}
                    className="w-32 h-32 object-cover rounded-xl shadow-lg"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Visibility
            </label>
            <select
              name="visibility"
              className="w-full p-5 border rounded-2xl bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm hover:shadow-md"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 font-bold rounded-2xl text-white text-lg transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-xl"
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
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{label}</label>
        <textarea
          name={name}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          className="w-full p-5 border rounded-2xl bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm hover:shadow-md"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full p-5 border rounded-2xl bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm hover:shadow-md"
      />
    </div>
  );
}
