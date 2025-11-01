"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-blue-100 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
      {/* ✨ Background Blur Circles */}
      <div className="absolute w-[400px] h-[400px] bg-blue-300 dark:bg-blue-800 rounded-full blur-3xl opacity-30 top-10 left-10 animate-pulse-slow"></div>
      <div className="absolute w-[500px] h-[500px] bg-blue-500 dark:bg-blue-700 rounded-full blur-3xl opacity-20 bottom-10 right-10 animate-pulse-slow"></div>

      {/* 🌟 Sign-In Card */}
      <div className="relative z-10 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-3xl p-10 sm:p-16 transition-all duration-500 hover:scale-[1.01]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-700 dark:text-blue-400 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Sign in to continue to your dashboard
          </p>
        </div>

        <SignIn
          fallbackRedirectUrl="/dashboard"
          appearance={{
            baseTheme: "dark",
            elements: {
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-md hover:shadow-lg",
              footerActionLink: "text-blue-500 hover:text-blue-400",
              card: "bg-transparent shadow-none",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
