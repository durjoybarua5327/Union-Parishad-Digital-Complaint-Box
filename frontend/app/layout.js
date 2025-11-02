"use client";

import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import OfficerNavbar from "@/components/OfficerNavbar";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        appearance={{
          baseTheme: "dark",
          elements: {
            formButtonPrimary:
              "bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-md hover:shadow-lg",
            footerActionLink: "text-blue-400 hover:text-blue-300 underline",
          },
        }}
      >
        <body className="min-h-screen flex flex-col bg-linear-to-b from-blue-50 via-white to-blue-100 dark:from-gray-950 dark:via-gray-900 dark:to-black text-gray-800 dark:text-gray-100 font-sans antialiased transition-colors duration-500">
          {/* ✨ Floating Decorative linear Background */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute w-[500px] h-[500px] bg-blue-200 dark:bg-blue-800 rounded-full blur-3xl opacity-40 top-[-10%] left-[-10%] animate-pulse-slow"></div>
            <div className="absolute w-[600px] h-[600px] bg-blue-400 dark:bg-blue-700 rounded-full blur-3xl opacity-30 bottom-[-10%] right-[-10%] animate-pulse-slow"></div>
          </div>

          {/* 🌍 Global Navbar */}
          <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 shadow-md transition-all duration-300">
            {/* Only show Navbar for non-officer routes */}
            {!pathname?.startsWith('/officer') && <Navbar />}
            {/* Show OfficerNavbar for officer routes */}
            {pathname?.startsWith('/officer') && <OfficerNavbar />}
          </header>

          {/* 🌟 Main Content */}
          <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 w-full max-w-7xl mx-auto animate-fadeIn">
            {children}
          </main>

          {/* 🌙 Footer */}
          <footer className="relative w-full border-t border-gray-200 dark:border-gray-800 py-6 text-center text-sm text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
            <p className="tracking-wide">
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                Union Parishad
              </span>{" "}
              — Empowering Communities Digitally
            </p>
          </footer>

          {/* 🔔 Toast Notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1f2937",
                color: "#fff",
                borderRadius: "0.75rem",
                padding: "12px 16px",
                fontSize: "0.95rem",
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
