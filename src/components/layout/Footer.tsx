/*
 * Footer Component with Attribution
 * Part of Medical Exam Preparation Platform
 * Original Author: Mbdulrohim (https://github.com/Mbdulrohim)
 */

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-2 text-sm text-gray-600">
          <p>
            Built with ❤️ using the{" "}
            <a
              href="https://github.com/Mbdulrohim/prep"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Nursing Exam Prep Platform
            </a>{" "}
            by{" "}
            <a
              href="https://github.com/Mbdulrohim"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              @Mbdulrohim
            </a>
          </p>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/Mbdulrohim/prep"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>⭐</span>
              <span>Star on GitHub</span>
            </a>
            <span className="text-gray-400">•</span>
            <p className="text-xs text-gray-500">
              Not affiliated with any government agency
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
