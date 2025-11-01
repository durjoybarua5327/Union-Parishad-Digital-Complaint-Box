"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { showToast } from "@/utils/toast";

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
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isLoaded && user?.emailAddresses?.[0]?.emailAddress) {
      fetchProfile();
    }
  }, [isLoaded, user]);

  const fetchProfile = async () => {
    try {
      const email = user.emailAddresses[0].emailAddress.toLowerCase();
      const res = await fetch(
        `http://localhost:5000/api/profile?email=${encodeURIComponent(email)}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        if (res.status === 404) {
          console.warn("Profile not found, creating a new one");
          setFetching(false);
          return;
        }
        throw new Error("Failed to fetch profile");
      }

      const data = await res.json();
      setForm({
        full_name: data.full_name || "",
        nid_number: data.nid_number || "",
        phone_number: data.phone_number || "",
        address: data.address || "",
        ward_no: data.ward_no || "",
        date_of_birth: data.date_of_birth || "",
      });
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      showToast("error", "Failed to load profile.", "fetchProfileError");
    } finally {
      setFetching(false);
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
      const age = Math.floor((Date.now() - dob) / (365.25 * 24 * 60 * 60 * 1000));
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
      showToast("error", "Please correct the errors in the form.", "formValidationError");
      return;
    }

    const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    if (!email) {
      showToast("error", "User email not found.", "emailMissingError");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, ...form }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      showToast("success", "Profile updated successfully!", "profileUpdateSuccess");
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ Profile update failed:", err);
      showToast("error", err.message || "Failed to update profile", "profileUpdateError");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10">
        <h1 className="text-4xl font-extrabold text-center text-blue-600 dark:text-blue-400 mb-4">
          Complete Your Profile
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-10">
          Provide your details to continue using Union Parishad services.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <InputField
            label="Full Name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            error={errors.full_name}
          />

          <InputField
            label="NID Number"
            name="nid_number"
            value={form.nid_number}
            onChange={handleChange}
            error={errors.nid_number}
          />

          <InputField
            label="Phone Number"
            name="phone_number"
            type="tel"
            value={form.phone_number}
            onChange={handleChange}
            placeholder="01XXXXXXXXX"
            error={errors.phone_number}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              error={errors.address}
            />

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Ward Number
              </label>
              <select
                name="ward_no"
                value={form.ward_no}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

          <InputField
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={form.date_of_birth}
            onChange={handleChange}
            error={errors.date_of_birth}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-semibold rounded-xl text-white transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg"
            }`}
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ✅ Reusable Input Field Component with focus effect */
function InputField({ label, name, value, onChange, error, type = "text", placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className={`w-full p-3 border rounded-lg bg-blue-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
