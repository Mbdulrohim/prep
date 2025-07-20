"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { UniversitySelector } from "@/components/ui/UniversitySelector";
import { Clock, FileText, AlertCircle, CheckCircle } from "lucide-react";

export interface StudentDetails {
  name: string;
  university: string;
}

interface PreExamModalProps {
  examId?: string;
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
    university?: string | null;
  } | null;
}

export function PreExamModal({
  onStartExam,
  examDetails,
  loading = false,
  userProfile,
}: PreExamModalProps) {
  const [name, setName] = useState<string>("");
  const [university, setUniversity] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Auto-populate user details from profile
  useEffect(() => {
    if (userProfile) {
      const displayName = userProfile.name || 
        (userProfile.firstName && userProfile.lastName 
          ? `${userProfile.firstName} ${userProfile.lastName}` 
          : userProfile.firstName || "");
      
      if (displayName) {
        setName(displayName);
      }
      
      if (userProfile.university) {
        setUniversity(userProfile.university);
      }
    }
  }, [userProfile]);

  // Auto-start exam if user profile has all required info
  useEffect(() => {
    if (userProfile && name && university && !agreedToTerms) {
      setAgreedToTerms(true);
      // Small delay to show the modal briefly before auto-starting
      setTimeout(() => {
        handleStart();
      }, 500);
    }
  }, [name, university, userProfile]);

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!university.trim()) {
      setError("Please enter your university");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the exam terms and conditions");
      return;
    }

    setError("");
    onStartExam({ name: name.trim(), university: university.trim() });
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
            {examDetails?.description || "Prepare to begin your examination"}
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

        {/* Student Information Form */}
        <form onSubmit={handleStart} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label
              htmlFor="university"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              University/Institution *
            </label>
            <UniversitySelector
              value={university}
              onChange={setUniversity}
              placeholder="Select or search for your university..."
              required
            />
          </div>

          {/* Terms and Conditions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Exam Terms & Conditions
            </h4>
            <ul className="text-sm text-blue-800 space-y-2 mb-4">
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
              <span className="text-sm text-blue-900">
                I agree to the terms and conditions and confirm that I will
                complete this exam honestly and independently.
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
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
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!name.trim() || !university.trim() || !agreedToTerms}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Start Exam
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
