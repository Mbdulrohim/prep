/*
 * Attribution Banner Component
 * Part of Medical Exam Preparation Platform
 * Original Author: Mbdulrohim (https://github.com/Mbdulrohim)
 */

import { Star, Github, Info } from "lucide-react";

export function AttributionBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 mb-6">
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm text-gray-800">
                <strong>Open Source Project</strong> • Created by{" "}
                <a
                  href="https://github.com/Mbdulrohim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  @Mbdulrohim
                </a>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                ⚠️ Not affiliated with any government agency • Independent educational tool
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href="https://github.com/Mbdulrohim/prep"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 bg-gray-900 text-white px-3 py-1.5 rounded-md text-xs hover:bg-gray-800 transition-colors"
              >
                <Github className="h-3 w-3" />
                <span>View Source</span>
              </a>
              <a
                href="https://github.com/Mbdulrohim/prep"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 bg-yellow-500 text-white px-3 py-1.5 rounded-md text-xs hover:bg-yellow-600 transition-colors"
              >
                <Star className="h-3 w-3" />
                <span>Star</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
