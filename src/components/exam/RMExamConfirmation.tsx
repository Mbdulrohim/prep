// src/components/exam/RMExamConfirmation.tsx
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
  Crown,
  X,
} from "lucide-react";

export interface StudentDetails {
  name: string;
  university: string;
}

interface RMExamConfirmationProps {
  examTitle: string;
  onConfirm: (details: StudentDetails) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  userProfile?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    displayName?: string;
    email?: string;
    university?: string | null;
  } | null;
}

export function RMExamConfirmation({
  examTitle,
  onConfirm,
  onCancel,
  isLoading = false,
  userProfile,
}: RMExamConfirmationProps) {
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
    return "";
  };

  const getUserUniversity = () => {
    return userProfile?.university || "";
  };

  const [name, setName] = useState(getUserDisplayName());
  const [university, setUniversity] = useState(getUserUniversity());
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !university.trim() || !agreed) {
      return;
    }

    onConfirm({
      name: name.trim(),
      university: university.trim(),
    });
  };

  const isValid = name.trim() && university.trim() && agreed;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-6 w-6 mr-3" />
              <div>
                <h2 className="text-xl font-bold">Start RM Exam</h2>
                <p className="text-green-100 text-sm">{examTitle}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-white hover:text-green-200 disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="university" className="text-sm font-medium text-gray-700">
                  University/Institution <span className="text-red-500">*</span>
                </label>
                <input
                  id="university"
                  type="text"
                  value={university}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUniversity(e.target.value)}
                  placeholder="Enter your university or institution"
                  disabled={isLoading}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Exam Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                RM Exam Details
              </h3>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Exam:</span>
                  <span className="font-medium">{examTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-medium">Registered Midwifery</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="font-medium">Multiple Choice (CBT)</span>
                </div>
              </div>
            </div>

            {/* Important Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Important Instructions
              </h3>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• Ensure stable internet connection throughout the exam</li>
                <li>• Do not close the browser tab or navigate away</li>
                <li>• Auto-save occurs every 30 seconds</li>
                <li>• Exam will auto-submit when time expires</li>
                <li>• Only one attempt allowed per RM exam</li>
              </ul>
            </div>

            {/* Agreement Checkbox */}
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  disabled={isLoading}
                  className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  I understand the exam instructions and agree to the terms. 
                  I confirm that I will take this RM exam honestly and independently.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Start RM Exam
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
