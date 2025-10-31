"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    nid_number: "",
    phone_number: "",
    address: "",
    ward_no: "",
    date_of_birth: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch existing profile from backend
  useEffect(() => {
    if (isLoaded && user) fetchProfile();
  }, [isLoaded, user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/profile?user_id=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      if (data) {
        setForm({
          full_name: data.full_name || "",
          nid_number: data.nid_number || "",
          phone_number: data.phone_number || "",
          address: data.address || "",
          ward_no: data.ward_no || "",
          date_of_birth: data.date_of_birth || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!form.nid_number.trim()) newErrors.nid_number = "NID number is required";
    else if (!/^\d{10}$|^\d{13}$|^\d{17}$/.test(form.nid_number))
      newErrors.nid_number = "Invalid NID number format";

    if (!form.phone_number.trim()) newErrors.phone_number = "Phone number is required";
    else if (!/^01[3-9]\d{8}$/.test(form.phone_number))
      newErrors.phone_number = "Invalid phone number format";

    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.ward_no) newErrors.ward_no = "Ward number is required";

    if (!form.date_of_birth) newErrors.date_of_birth = "Date of birth is required";
    else {
      const dob = new Date(form.date_of_birth);
      const age = Math.floor(
        (new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (age < 18) newErrors.date_of_birth = "Must be at least 18 years old";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, user_id: user.id }),
      });
      if (!res.ok) throw new Error("Failed to update profile");

      toast.success("Profile updated successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600 dark:text-blue-400">
          Complete Your Profile
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-10">
          Please provide your details to continue using Union Parishad services.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 ${
                errors.full_name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* NID */}
          <div>
            <label className="block text-sm font-medium mb-2">NID Number</label>
            <input
              type="text"
              name="nid_number"
              value={form.nid_number}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 ${
                errors.nid_number ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.nid_number && (
              <p className="text-sm text-red-500 mt-1">{errors.nid_number}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              className={`w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 ${
                errors.phone_number ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.phone_number && (
              <p className="text-sm text-red-500 mt-1">{errors.phone_number}</p>
            )}
          </div>

          {/* Address & Ward */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.address && (
                <p className="text-sm text-red-500 mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ward Number</label>
              <select
                name="ward_no"
                value={form.ward_no}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 ${
                  errors.ward_no ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Ward</option>
                {Array.from({ length: 9 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Ward {i + 1}
                  </option>
                ))}
              </select>
              {errors.ward_no && (
                <p className="text-sm text-red-500 mt-1">{errors.ward_no}</p>
              )}
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium mb-2">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 ${
                errors.date_of_birth ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.date_of_birth && (
              <p className="text-sm text-red-500 mt-1">{errors.date_of_birth}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white font-semibold rounded-lg transition ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
