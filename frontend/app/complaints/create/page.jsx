"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import withProfileCheck from "@/components/withProfileCheck";
import toast from "react-hot-toast";

// Constants
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif"];

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

  const [images, setImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);

  // ------------------- VALIDATIONS -------------------
  const validateForm = () => {
    if (form.title.length < 10) {
      toast.error("Title must be at least 10 characters long");
      return false;
    }
    if (form.description.length < 30) {
      toast.error("Description must be at least 30 characters long");
      return false;
    }
    if (!form.category) {
      toast.error("Please select a category");
      return false;
    }
    if (!form.ward) {
      toast.error("Please select a ward number");
      return false;
    }
    if (!form.address.trim()) {
      toast.error("Please provide an address");
      return false;
    }
    return true;
  };

  const validateImage = (file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(`File ${file.name} is not a supported image type`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File ${file.name} is larger than 10MB`);
      return false;
    }
    return true;
  };

  // ------------------- HANDLERS -------------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(validateImage);

    if (validFiles.length > 0) {
      setImages((prev) => [...prev, ...validFiles]);

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviewUrls((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });

      toast.success(`${validFiles.length} image(s) added successfully`);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  // ------------------- SUBMIT -------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to submit a complaint");
      return;
    }

    setLoading(true);
    const submitToast = toast.loading("Submitting your complaint...");

    try {
      const formData = new FormData();
      for (const key in form) formData.append(key, form[key]);
      images.forEach((file) => formData.append("images", file));

      // Directly send JSON to backend (no file upload in demo)
      const res = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          ward: form.ward,
          address: form.address,
          priority: form.priority,
          visibility: form.visibility,
          user: { name: "Demo User" },
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to submit complaint");

      toast.success("Complaint submitted successfully!", { id: submitToast });
      router.push("/complaints");
    } catch (err) {
      toast.error(err.message || "Failed to submit complaint", { id: submitToast });
    } finally {
      setLoading(false);
    }
  };

  // ------------------- UI -------------------
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit a Complaint</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please provide detailed information to help us address your concern effectively
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="Brief summary of your complaint"
            required
            minLength={10}
            className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            placeholder="Provide detailed information about your complaint"
            required
            minLength={30}
            className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category and Ward */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ward Number
            </label>
            <select
              name="ward"
              value={form.ward}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select ward number</option>
              {WARDS.map((w) => (
                <option key={w} value={w}>Ward {w}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            placeholder="Specific location of the issue"
            required
            className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Priority & Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Visibility
            </label>
            <select
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Attach Images
          </label>
          <input
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImages}
            className="hidden"
          />
          <div
            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg hover:border-blue-500 transition cursor-pointer"
            onClick={() => document.getElementById("images").click()}
          >
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p>Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>

          {/* Image Previews */}
          {imagePreviewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagePreviewUrls.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} className="h-24 w-full object-cover rounded-lg" alt={`Preview ${i}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition ${
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}

export default withProfileCheck(CreateComplaintPage);
