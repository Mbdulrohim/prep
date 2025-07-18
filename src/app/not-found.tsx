import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="h-12 w-12 text-blue-600" />
        </div>

        {/* Main Message */}
        <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>

        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get
          you back to your studies!
        </p>

        {/* Navigation Buttons */}
        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full flex items-center justify-center">
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Quick Links:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/exam/medical-surgical"
              className="text-blue-600 hover:underline"
            >
              Medical-Surgical
            </Link>
            <Link
              href="/exam/pediatric"
              className="text-blue-600 hover:underline"
            >
              Pediatric Nursing
            </Link>
            <Link
              href="/exam/obstetric"
              className="text-blue-600 hover:underline"
            >
              Obstetric Nursing
            </Link>
            <Link href="/leaderboard" className="text-blue-600 hover:underline">
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
