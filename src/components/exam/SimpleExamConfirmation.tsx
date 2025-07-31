"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  User,
  Building2,
  BookOpen,
  Target,
} from "lucide-react";

export interface StudentDetails {
  name: string;
  university: string;
}

interface SimpleExamConfirmationProps {
  onStartExam: (details: StudentDetails) => void;
  onCancel?: () => void;
  examDetails?: {
    title: string;
    description?: string;
    questionsCount: number;
    durationMinutes: number;
    difficulty?: string;
    category?: string;
    topics?: string[];
  } | null;
  loading?: boolean;
  userProfile?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    displayName?: string;
    email?: string;
    university?: string | null;
  } | null;
}

export function SimpleExamConfirmation({
  onStartExam,
  onCancel,
  examDetails,
  loading = false,
  userProfile,
}: SimpleExamConfirmationProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string>("");

  // Get user's display name from various possible sources
  const getUserDisplayName = () => {
    if (userProfile?.displayName) return userProfile.displayName;
    if (userProfile?.name) return userProfile.name;
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    if (userProfile?.firstName) return userProfile.firstName;
    if (userProfile?.email) {
      // Extract name from email as fallback
      return userProfile.email
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return "Student";
  };

  const getUserUniversity = () => {
    return userProfile?.university || "Not specified";
  };

  const handleConfirmStart = () => {
    if (!agreedToTerms) {
      setError("Please agree to the exam terms and conditions");
      return;
    }

    setError("");

    // Use the pre-populated data from Firebase
    const studentDetails: StudentDetails = {
      name: getUserDisplayName(),
      university: getUserUniversity(),
    };

    onStartExam(studentDetails);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-lg text-slate-700">Loading exam details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Start Your Exam
            </h1>
            <p className="text-gray-600">
              Please confirm your details and exam information before starting
            </p>
          </div>

          {/* Exam Details */}
          {examDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {examDetails.title}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm text-gray-600">Questions:</span>
                  <span className="font-semibold text-gray-900">
                    {examDetails.questionsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="font-semibold text-gray-900 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDuration(examDetails.durationMinutes)}
                  </span>
                </div>
                {examDetails.difficulty && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Difficulty:</span>
                    <span className="font-semibold text-gray-900 flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      {examDetails.difficulty}
                    </span>
                  </div>
                )}
                {examDetails.category && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="font-semibold text-gray-900">
                      {examDetails.category}
                    </span>
                  </div>
                )}
              </div>

              {examDetails.topics && examDetails.topics.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Topics Covered:</h4>
                  <div className="flex flex-wrap gap-2">
                    {examDetails.topics.slice(0, 6).map((topic, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                    {examDetails.topics.length > 6 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        +{examDetails.topics.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student Details (Pre-filled) */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Your Details
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{getUserDisplayName()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">University:</span>
                <span className="font-medium text-gray-900 flex items-center">
                  <Building2 className="h-4 w-4 mr-1" />
                  {getUserUniversity()}
                </span>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-6">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="text-sm">
                <span className="text-gray-900">
                  I agree to the exam terms and conditions and confirm that:
                </span>
                <ul className="mt-2 ml-4 space-y-1 text-gray-600 list-disc">
                  <li>I will not use any unauthorized materials during the exam</li>
                  <li>I understand that this exam is timed and cannot be paused</li>
                  <li>I confirm that the information above is correct</li>
                  <li>I am ready to begin the exam now</li>
                </ul>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleConfirmStart}
              disabled={!agreedToTerms}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Start Exam
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important Reminders:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Ensure you have a stable internet connection</li>
                  <li>Find a quiet environment free from distractions</li>
                  <li>Your progress will be automatically saved</li>
                  <li>The exam will auto-submit when time expires</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
