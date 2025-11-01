"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SignUp
  fallbackRedirectUrl="/dashboard"
  appearance={{
    elements: {
      formButtonPrimary: "bg-blue-500 hover:bg-blue-600",
      footerActionLink: "text-blue-400 hover:text-blue-300",
    },
  }}
/>

    </div>
  );
}
