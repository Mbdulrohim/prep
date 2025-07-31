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
} from "lucide-react";

export interface StudentDetails {
  name: string;
  university: string;
}

interface ExamConfirmationModalProps {
  onStartExam: (details: StudentDetails) => void;
  onCancel?: () => void;
  examDetails?: {
    title: string;
    description: string;
    questionsCount: number;
    durationMinutes: number;
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

export function ExamConfirmationModal({
  onStartExam,
  onCancel,
  examDetails,
  loading = false,
  userProfile,
}: ExamConfirmationModalProps) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {examDetails?.title || "Exam Assessment"}
          </h1>
          <p className="text-gray-600">
            {examDetails?.description ||
              "Confirm your details and begin your examination"}
          </p>
        </div>

        {/* Exam Details */}
        {examDetails && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">
              Exam Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Questions</p>
                  <p className="font-semibold">{examDetails.questionsCount}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">
                    {formatDuration(examDetails.durationMinutes)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Details Confirmation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Confirm Your Details
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700">Full Name</p>
                <p className="font-semibold text-blue-900">
                  {getUserDisplayName()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700">University/Institution</p>
                <p className="font-semibold text-blue-900">
                  {getUserUniversity()}
                </p>
              </div>
            </div>
          </div>

          {userProfile?.university === null && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                University not specified in your profile. You can update this in
                your dashboard after the exam.
              </p>
            </div>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Exam Terms & Conditions
          </h4>
          <ul className="text-sm text-gray-700 space-y-2 mb-4">
            <li>• You must complete the exam in one sitting</li>
            <li>• No external resources or assistance are permitted</li>
            <li>• Your responses will be automatically saved</li>
            <li>• Once submitted, you cannot modify your answers</li>
            <li>• Results will be available immediately after submission</li>
          </ul>

          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              I confirm that the above details are correct and agree to the exam
              terms and conditions. I will complete this exam honestly and
              independently.
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-red-800 text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </p>
          </div>
        )}

        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel || (() => window.history.back())}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={!agreedToTerms}
            onClick={handleConfirmStart}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Start Exam
          </Button>
        </div>
      </div>
    </div>
  );
}
