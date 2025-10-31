// frontend/app/layout.jsx
"use client";

import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        appearance={{
          baseTheme: "dark",
          elements: {
            formButtonPrimary: "bg-blue-500 hover:bg-blue-600",
            footerActionLink: "text-blue-400 hover:text-blue-300",
          },
        }}
      >
        <body className="min-h-screen flex flex-col bg-linear-to-b from-blue-50 to-white dark:from-gray-950 dark:to-black text-gray-800 dark:text-gray-100 font-sans antialiased">
          {/* 🌍 Global Navbar */}
          <Navbar />

          {/* 🌟 Main Content */}
          <main className="flex-1 flex flex-col items-center px-6 py-10 mt-16 w-full max-w-6xl mx-auto">
            {children}
          </main>

          {/* 🌙 Footer */}
          <footer className="w-full bg-gray-100 dark:bg-gray-900 py-4 mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Union Parishad — All Rights Reserved
          </footer>

          {/* 🔔 Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#333",
                color: "#fff",
              },
              success: {
                style: { background: "#059669" },
              },
              error: {
                style: { background: "#DC2626" },
              },
            }}
          />
        </body>
      </ClerkProvider>
    </html>
  );
}
