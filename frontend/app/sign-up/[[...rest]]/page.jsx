"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-br from-blue-50 via-white to-blue-100 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
      {/* 🔵 Animated Background Blobs */}
      <div className="absolute w-[400px] h-[400px] bg-blue-300 dark:bg-blue-800 rounded-full blur-3xl opacity-30 top-10 left-10 animate-pulse-slow"></div>
      <div className="absolute w-[600px] h-[600px] bg-blue-500 dark:bg-blue-700 rounded-full blur-3xl opacity-20 bottom-10 right-10 animate-pulse-slow"></div>

      {/* 🪄 Sign-Up Box */}
      <div className="relative z-10 backdrop-blur-xl bg-white/80 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-3xl p-8 sm:p-12 transition-all duration-500 hover:scale-[1.01]">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 dark:text-blue-400">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Join the Union Parishad digital complaint system
          </p>
        </div>

        <SignUp
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-md hover:shadow-lg",
              footerActionLink: "text-blue-500 hover:text-blue-400",
              card: "bg-transparent shadow-none",
            },
          }}
        />
      </div>
    </div>
  );
}
