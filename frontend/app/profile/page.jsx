"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { apiFetch } from "@/utils/api";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [form, setForm] = useState({
    fullName: "",
    nidNumber: "",
    phoneNumber: "",
    address: "",
    ward: "",
    dateOfBirth: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      // Pre-fill the form with any existing user data
      setForm(prev => ({
        ...prev,
        fullName: user.fullName || "",
      }));

      // Check if profile is already completed
      fetchProfile();
    }
  }, [isLoaded, user]);

  const fetchProfile = async () => {
    try {
      const response = await apiFetch("/api/profile");
      if (response.success) {
        setForm(prev => ({
          ...prev,
          ...response.data,
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!form.nidNumber.trim()) {
      newErrors.nidNumber = "NID number is required";
    } else if (!/^\d{10}$|^\d{13}$|^\d{17}$/.test(form.nidNumber)) {
      newErrors.nidNumber = "Invalid NID number format";
    }

    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^01[3-9]\d{8}$/.test(form.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format";
    }

    if (!form.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!form.ward) {
      newErrors.ward = "Ward number is required";
    }

    if (!form.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(form.dateOfBirth);
      const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        newErrors.dateOfBirth = "Must be at least 18 years old";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (response.success) {
        toast.success("Profile updated successfully!");
        // If there's a redirect path stored (e.g., from complaint creation attempt)
        const redirectPath = localStorage.getItem("profileRedirect");
        if (redirectPath) {
          localStorage.removeItem("profileRedirect");
          router.push(redirectPath);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please provide your information to continue using our services
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg border ${
                errors.fullName 
                  ? "border-red-500 dark:border-red-400" 
                  : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* NID Number */}
          <div>
            <label htmlFor="nidNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              NID Number
            </label>
            <input
              type="text"
              id="nidNumber"
              name="nidNumber"
              value={form.nidNumber}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg border ${
                errors.nidNumber 
                  ? "border-red-500 dark:border-red-400" 
                  : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
            />
            {errors.nidNumber && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.nidNumber}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              className={`w-full p-3 rounded-lg border ${
                errors.phoneNumber 
                  ? "border-red-500 dark:border-red-400" 
                  : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.phoneNumber}
              </p>
            )}
          </div>

          {/* Address and Ward */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg border ${
                  errors.address 
                    ? "border-red-500 dark:border-red-400" 
                    : "border-gray-300 dark:border-gray-600"
                } bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.address}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ward" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ward Number
              </label>
              <select
                id="ward"
                name="ward"
                value={form.ward}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg border ${
                  errors.ward 
                    ? "border-red-500 dark:border-red-400" 
                    : "border-gray-300 dark:border-gray-600"
                } bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
              >
                <option value="">Select ward</option>
                {Array.from({ length: 9 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Ward {i + 1}
                  </option>
                ))}
              </select>
              {errors.ward && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.ward}
                </p>
              )}
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              className={`w-full p-3 rounded-lg border ${
                errors.dateOfBirth 
                  ? "border-red-500 dark:border-red-400" 
                  : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.dateOfBirth}
              </p>
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
                Updating Profile...
              </span>
            ) : (
              "Update Profile"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}