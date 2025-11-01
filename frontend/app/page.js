"use client";

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[90vh] w-full bg-linear-to-br from-blue-50 via-indigo-100 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950 overflow-hidden px-6 transition-colors duration-500">

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-blue-300 dark:bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse-slow -top-40 -left-32"></div>
        <div className="absolute w-[700px] h-[700px] bg-indigo-300 dark:bg-indigo-700 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse-slow top-40 -right-32"></div>
        <div className="absolute w-[500px] h-[500px] bg-purple-300 dark:bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow bottom-20 right-1/4"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto animate-fadeIn">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold bg-linear-to-r from-blue-700 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-indigo-300 dark:to-blue-200 text-transparent bg-clip-text drop-shadow-lg">
          Union Parishad
        </h1>

        <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-700 dark:text-gray-300">
          Digital Complaint Box
        </h2>

        <p className="mt-6 text-gray-600 dark:text-gray-400 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
          Empowering communities through transparency and accountability.  
          A simple and effective way to make your voice heard.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6">
          <a
            href="/sign-up"
            className="px-10 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            Get Started
          </a>
          <a
            href="/complaints"
            className="px-10 py-4 border-2 border-blue-600 text-blue-600 dark:text-blue-300 font-semibold rounded-2xl hover:bg-blue-50 dark:hover:bg-gray-800 hover:scale-105 transition-all duration-300"
          >
            View Complaints
          </a>
        </div>
      </div>

      {/* Floating Elements (for subtle motion) */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/20 dark:bg-blue-700/20 rounded-full blur-2xl animate-bounce-slow"></div>
      <div className="absolute bottom-16 right-16 w-28 h-28 bg-indigo-400/20 dark:bg-indigo-700/20 rounded-full blur-3xl animate-bounce-slow"></div>

      {/* Glow behind content */}
      <div className="absolute w-[500px] h-[500px] bg-blue-300/30 dark:bg-blue-600/30 rounded-full blur-[120px] -z-10 top-1/3 left-1/2 transform -translate-x-1/2"></div>
    </div>
  );
}
