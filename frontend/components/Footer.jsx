export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-10 py-6">
      <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400 text-sm">
        <p>
          © {new Date().getFullYear()} Union Parishad Digital Complaint Box —{" "}
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            Empowering Transparency
          </span>
        </p>
        <p className="mt-2">
          Built with ❤️ using{" "}
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Next.js
          </a>{" "}
          &{" "}
          <a
            href="https://tailwindcss.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Tailwind CSS
          </a>
        </p>
      </div>
    </footer>
  );
}
