// frontend/app/layout.jsx
import "./globals.css";

export const metadata = {
  title: "Union Parishad Digital Complaint Box",
  description: "Submit and manage citizen complaints digitally with transparency.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-black text-gray-800 dark:text-gray-100 font-sans antialiased">
        <header className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
              Union Parishad Digital Complaint Box
            </h1>
            <nav className="flex gap-4 text-sm sm:text-base">
              <a
                href="/complaints"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Complaints
              </a>
              <a
                href="/complaints/create"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Submit
              </a>
              <a
                href="/login"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Login
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center px-6 py-10">
          {children}
        </main>

        <footer className="w-full bg-gray-100 dark:bg-gray-900 py-4 mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Union Parishad — All Rights Reserved
        </footer>
      </body>
    </html>
  );
}
