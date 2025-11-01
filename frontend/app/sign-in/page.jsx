"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SignIn
        fallbackRedirectUrl="/dashboard" // <-- new prop
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
