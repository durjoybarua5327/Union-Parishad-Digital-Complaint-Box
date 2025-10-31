"use client";

import { useState } from "react";
import { createComplaint } from "@/utils/api";
import { useRouter } from "next/navigation";
import { withAuth } from "@/app/auth";

// Predefined categories and wards for consistent data
const CATEGORIES = [
  "Infrastructure",
  "Sanitation",
  "Education",
  "Health",
  "Water Supply",
  "Electricity",
  "Public Safety",
  "Other",
];

const WARDS = Array.from({ length: 9 }, (_, i) => (i + 1).toString());

function CreateComplaintPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    ward: "",
    address: "",
    priority: "MEDIUM",
    visibility: "PUBLIC",
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImages = (e) => {
    setImages(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      for (const key in form) formData.append(key, form[key]);
      for (const file of images) formData.append("images", file);

      await createComplaint(formData);
      router.push("/complaints");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit a Complaint</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please provide detailed information to help us address your concern effectively
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Brief summary of your complaint"
            required
            minLength={10}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Minimum 10 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Provide detailed information about your complaint"
            required
            minLength={30}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Minimum 30 characters
          </p>
        </div>

        {/* Category and Ward */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ward"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Ward Number
            </label>
            <select
              id="ward"
              name="ward"
              value={form.ward}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              required
            >
              <option value="">Select ward number</option>
              {WARDS.map((ward) => (
                <option key={ward} value={ward}>
                  Ward {ward}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Address
          </label>
          <input
            id="address"
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Specific location of the issue"
            required
          />
        </div>

        {/* Priority and Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="visibility"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Visibility
            </label>
            <select
              id="visibility"
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="PUBLIC">Public (Visible to all)</option>
              <option value="PRIVATE">Private (Only visible to you and officials)</option>
            </select>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label
            htmlFor="images"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Attach Images
          </label>
          <input
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition cursor-pointer"
            onClick={() => document.getElementById("images").click()}>
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <label
                  htmlFor="images"
                  className="relative cursor-pointer rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none"
                >
                  <span>Upload images</span>
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF up to 10MB each
              </p>
            </div>
          </div>

          {/* Image Previews */}
          {imagePreviewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </span>
          ) : (
            "Submit Complaint"
          )}
        </button>
      </form>
    </div>
  );
}
