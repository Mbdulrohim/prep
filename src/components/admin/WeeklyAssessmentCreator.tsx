// src/components/admin/WeeklyAssessmentCreator.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DocumentUpload } from "@/components/admin/DocumentUpload";
import { ParsedQuestion } from "@/lib/documentParser";
import { weeklyAssessmentManager } from "@/lib/weeklyAssessments";
import {
  X,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface WeeklyAssessmentCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (assessmentId: string) => void;
  createdBy: string;
}

export const WeeklyAssessmentCreator: React.FC<WeeklyAssessmentCreatorProps> = ({
  isOpen,
  onClose,
  onSuccess,
  createdBy,
}) => {
  const [currentStep, setCurrentStep] = useState<"details" | "upload" | "review">("details");
  const [title, setTitle] = useState("");
  const [uploadedQuestions, setUploadedQuestions] = useState<ParsedQuestion[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleTitleSubmit = () => {
    if (!title.trim()) {
      setError("Please enter a title for the assessment");
      return;
    }
    setError("");
    setCurrentStep("upload");
  };

  const handleQuestionsUploaded = (questions: ParsedQuestion[]) => {
    setUploadedQuestions(questions);
    setCurrentStep("review");
  };

  const handleCreateAssessment = async () => {
    try {
      setCreating(true);
      setError("");

      if (uploadedQuestions.length < 150) {
        setError(`Not enough questions. Need 150, but only ${uploadedQuestions.length} uploaded.`);
        return;
      }

      const assessmentId = await weeklyAssessmentManager.createWeeklyAssessment(
        title,
        uploadedQuestions,
        createdBy
      );

      onSuccess(assessmentId);
      handleClose();
    } catch (error) {
      console.error("Error creating assessment:", error);
      setError("Failed to create assessment. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setCurrentStep("details");
    setTitle("");
    setUploadedQuestions([]);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create Weekly Assessment
              </h2>
              <p className="text-sm text-gray-600">
                Step {currentStep === "details" ? 1 : currentStep === "upload" ? 2 : 3} of 3
              </p>
            </div>
          </div>
          <Button onClick={handleClose} variant="outline" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className={`flex items-center ${currentStep === "details" ? "text-blue-600" : "text-green-600"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                currentStep === "details" ? "bg-blue-100" : "bg-green-100"
              }`}>
                {currentStep === "details" ? "1" : <CheckCircle className="h-4 w-4" />}
              </div>
              Assessment Details
            </div>
            <div className={`flex items-center ${
              currentStep === "upload" ? "text-blue-600" : 
              currentStep === "review" ? "text-green-600" : "text-gray-400"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                currentStep === "upload" ? "bg-blue-100" : 
                currentStep === "review" ? "bg-green-100" : "bg-gray-200"
              }`}>
                {currentStep === "review" ? <CheckCircle className="h-4 w-4" /> : "2"}
              </div>
              Upload Questions
            </div>
            <div className={`flex items-center ${currentStep === "review" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                currentStep === "review" ? "bg-blue-100" : "bg-gray-200"
              }`}>
                3
              </div>
              Review & Create
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Step 1: Assessment Details */}
          {currentStep === "details" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Assessment Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium text-blue-900">Questions</p>
                      <p className="text-sm text-blue-700">150 questions</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium text-blue-900">Time Limit</p>
                      <p className="text-sm text-blue-700">90 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium text-blue-900">Type</p>
                      <p className="text-sm text-blue-700">Weekly Assessment</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Week 5 Pharmacology Review"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <p className="text-sm text-gray-600 mt-1">
                  Choose a descriptive title that helps students understand the focus of this assessment.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Creating a new assessment will deactivate the current one</li>
                  <li>• Students who haven't completed the current assessment will lose access to it</li>
                  <li>• The new assessment will become immediately available to all students</li>
                  <li>• Weekly leaderboard will reset for the new assessment</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Upload Questions */}
          {currentStep === "upload" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Questions for "{title}"
                </h3>
                <p className="text-gray-600">
                  Upload a DOCX file containing exactly 150 questions for this assessment.
                </p>
              </div>

              <DocumentUpload 
                onQuestionsExtracted={(questions) => handleQuestionsUploaded(questions)}
              />
            </div>
          )}

          {/* Step 3: Review & Create */}
          {currentStep === "review" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Review Assessment
                </h3>
                <p className="text-gray-600">
                  Please review the assessment details before creating.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Assessment Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Title:</p>
                    <p className="font-medium text-gray-900">{title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Questions:</p>
                    <p className="font-medium text-gray-900">{uploadedQuestions.length} questions</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time Limit:</p>
                    <p className="font-medium text-gray-900">90 minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created By:</p>
                    <p className="font-medium text-gray-900">{createdBy}</p>
                  </div>
                </div>
              </div>

              {uploadedQuestions.length !== 150 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <p className="font-medium text-red-900">Question Count Issue</p>
                      <p className="text-sm text-red-700">
                        Weekly assessments require exactly 150 questions. 
                        You have {uploadedQuestions.length} questions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {uploadedQuestions.length >= 150 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium text-green-900">Ready to Create</p>
                      <p className="text-sm text-green-700">
                        Assessment is properly configured and ready to be created.
                        {uploadedQuestions.length > 150 && 
                          ` Only the first 150 questions will be used.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <div>
            {currentStep !== "details" && (
              <Button
                onClick={() => {
                  if (currentStep === "upload") setCurrentStep("details");
                  if (currentStep === "review") setCurrentStep("upload");
                }}
                variant="outline"
              >
                Back
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
            
            {currentStep === "details" && (
              <Button onClick={handleTitleSubmit} className="bg-blue-600 hover:bg-blue-700">
                Next: Upload Questions
              </Button>
            )}
            
            {currentStep === "review" && (
              <Button
                onClick={handleCreateAssessment}
                disabled={creating || uploadedQuestions.length < 150}
                className="bg-green-600 hover:bg-green-700"
              >
                {creating ? "Creating..." : "Create Assessment"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
