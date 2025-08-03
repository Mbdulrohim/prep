// src/components/admin/AdvancedWeeklyAssessmentManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { DocumentUpload } from "@/components/admin/DocumentUpload";
import { ParsedQuestion } from "@/lib/documentParser";
import { weeklyAssessmentManager, StandaloneWeeklyAssessment as WeeklyAssessment } from "@/lib/weeklyAssessments";
import {
  X,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Settings,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
} from "lucide-react";

interface AdvancedWeeklyAssessmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (assessmentId: string) => void;
  createdBy: string;
}

type ModalView = "list" | "create" | "edit" | "schedule";

interface CreateAssessmentForm {
  title: string;
  timeLimit: number;
  totalQuestions: number;
  uploadedQuestions: ParsedQuestion[];
  isScheduled: boolean;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}

export const AdvancedWeeklyAssessmentManager: React.FC<AdvancedWeeklyAssessmentManagerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  createdBy,
}) => {
  const [currentView, setCurrentView] = useState<ModalView>("list");
  const [assessments, setAssessments] = useState<(WeeklyAssessment & { isAvailable: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create assessment form state
  const [createForm, setCreateForm] = useState<CreateAssessmentForm>({
    title: "",
    timeLimit: 90,
    totalQuestions: 150,
    uploadedQuestions: [],
    isScheduled: false,
  });
  const [createStep, setCreateStep] = useState<"details" | "upload" | "review">("details");
  const [creating, setCreating] = useState(false);

  // Edit assessment state
  const [editingAssessment, setEditingAssessment] = useState<WeeklyAssessment | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAssessments();
    }
  }, [isOpen]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const assessmentsList = await weeklyAssessmentManager.getAllAssessmentsWithStatus();
      setAssessments(assessmentsList);
    } catch (error) {
      console.error("Error loading assessments:", error);
      setError("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    try {
      setCreating(true);
      setError("");

      if (!createForm.title.trim()) {
        setError("Please enter a title for the assessment");
        return;
      }

      if (createForm.uploadedQuestions.length < createForm.totalQuestions) {
        setError(`Not enough questions. Need ${createForm.totalQuestions}, but only ${createForm.uploadedQuestions.length} uploaded.`);
        return;
      }

      let availableDate: Date | undefined;

      if (createForm.isScheduled) {
        if (createForm.startDate && createForm.startTime) {
          availableDate = new Date(`${createForm.startDate}T${createForm.startTime}`);
        }
      }

      const assessmentId = await weeklyAssessmentManager.createWeeklyAssessment(
        createForm.title,
        createForm.uploadedQuestions,
        createdBy,
        {
          timeLimit: createForm.timeLimit,
          totalQuestions: createForm.totalQuestions,
          isScheduled: createForm.isScheduled,
          availableDate,
        }
      );

      setSuccess("Assessment created successfully!");
      onSuccess?.(assessmentId);
      resetCreateForm();
      setCurrentView("list");
      await loadAssessments();
    } catch (error) {
      console.error("Error creating assessment:", error);
      setError("Failed to create assessment. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleMaster = async (assessmentId: string, enabled: boolean) => {
    try {
      await weeklyAssessmentManager.toggleMasterSwitch(assessmentId, enabled);
      setSuccess(`Assessment ${enabled ? "enabled" : "disabled"} successfully`);
      await loadAssessments();
    } catch (error) {
      console.error("Error toggling master switch:", error);
      setError("Failed to update assessment status");
    }
  };

  const handleUpdateSchedule = async (assessmentId: string, scheduleData: any) => {
    try {
      await weeklyAssessmentManager.updateAssessmentSchedule(assessmentId, scheduleData);
      setSuccess("Schedule updated successfully");
      await loadAssessments();
    } catch (error) {
      console.error("Error updating schedule:", error);
      setError("Failed to update schedule");
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      timeLimit: 90,
      totalQuestions: 150,
      uploadedQuestions: [],
      isScheduled: false,
    });
    setCreateStep("details");
  };

  const formatDateTime = (date: Date | undefined) => {
    if (!date) return "Not set";
    return date.toLocaleString();
  };

  const getAvailabilityStatus = (assessment: WeeklyAssessment & { isAvailable: boolean }) => {
    if (!assessment.masterToggle) return { status: "Disabled", color: "text-red-600" };
    if (!assessment.isActive) return { status: "Inactive", color: "text-gray-600" };
    if (!assessment.isAvailable && assessment.isScheduled) return { status: "Scheduled", color: "text-orange-600" };
    if (assessment.isAvailable) return { status: "Available", color: "text-green-600" };
    return { status: "Unknown", color: "text-gray-600" };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Weekly Assessment Management
              </h2>
              <p className="text-sm text-gray-600">
                {currentView === "list" && "Manage all weekly assessments"}
                {currentView === "create" && "Create new weekly assessment"}
                {currentView === "edit" && "Edit assessment"}
                {currentView === "schedule" && "Manage schedules"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentView !== "list" && (
              <Button
                onClick={() => setCurrentView("list")}
                variant="outline"
                size="sm"
              >
                Back to List
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
              <button onClick={() => setError("")} className="ml-auto">
                <X className="h-4 w-4 text-red-600" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">{success}</span>
              <button onClick={() => setSuccess("")} className="ml-auto">
                <X className="h-4 w-4 text-green-600" />
              </button>
            </div>
          )}

          {/* List View */}
          {currentView === "list" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">All Assessments</h3>
                <div className="flex space-x-3">
                  <Button onClick={loadAssessments} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => setCurrentView("create")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assessment
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading assessments...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map((assessment) => {
                    const status = getAvailabilityStatus(assessment);
                    return (
                      <div key={assessment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">{assessment.title}</h4>
                              <span className={`text-sm font-medium ${status.color}`}>
                                {status.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Questions:</span> {assessment.totalQuestions}
                              </div>
                              <div>
                                <span className="font-medium">Time Limit:</span> {assessment.timeLimit} min
                              </div>
                              <div>
                                <span className="font-medium">Created:</span> {assessment.createdAt.toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">By:</span> {assessment.createdBy}
                              </div>
                              {assessment.isScheduled && (
                                <div>
                                  <span className="font-medium">Available:</span> {formatDateTime(assessment.availableDate)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            {/* Master Toggle */}
                            <button
                              onClick={() => handleToggleMaster(assessment.id, !assessment.masterToggle)}
                              className={`p-2 rounded-lg transition-colors ${
                                assessment.masterToggle 
                                  ? "bg-green-100 text-green-600 hover:bg-green-200" 
                                  : "bg-red-100 text-red-600 hover:bg-red-200"
                              }`}
                              title={assessment.masterToggle ? "Disable Assessment" : "Enable Assessment"}
                            >
                              {assessment.masterToggle ? (
                                <ToggleRight className="h-5 w-5" />
                              ) : (
                                <ToggleLeft className="h-5 w-5" />
                              )}
                            </button>

                            {/* Edit Button */}
                            <Button
                              onClick={() => {
                                setEditingAssessment(assessment);
                                setCurrentView("edit");
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {assessments.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No assessments found</p>
                      <Button
                        onClick={() => setCurrentView("create")}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        Create Your First Assessment
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Create View */}
          {currentView === "create" && (
            <div>
              {createStep === "details" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Assessment Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assessment Title *
                      </label>
                      <input
                        type="text"
                        value={createForm.title}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Week 5 Pharmacology Review"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        value={createForm.timeLimit}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 90 }))}
                        min="30"
                        max="300"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Questions
                      </label>
                      <input
                        type="number"
                        value={createForm.totalQuestions}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) || 150 }))}
                        min="50"
                        max="300"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Scheduling Options */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900">Scheduling Options</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={createForm.isScheduled}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, isScheduled: e.target.checked }))}
                          className="mr-2"
                        />
                        Enable Scheduling
                      </label>
                    </div>

                    {createForm.isScheduled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={createForm.startDate || ""}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={createForm.startTime || ""}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, startTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={createForm.endDate || ""}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={createForm.endTime || ""}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, endTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setCreateStep("upload")}
                      disabled={!createForm.title.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next: Upload Questions
                    </Button>
                  </div>
                </div>
              )}

              {createStep === "upload" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Upload Questions for "{createForm.title}"
                    </h3>
                    <p className="text-gray-600">
                      Upload a DOCX file containing at least {createForm.totalQuestions} questions for this assessment.
                    </p>
                  </div>

                  <DocumentUpload 
                    onQuestionsExtracted={(questions) => {
                      setCreateForm(prev => ({ ...prev, uploadedQuestions: questions }));
                      setCreateStep("review");
                    }}
                  />

                  <div className="flex justify-between">
                    <Button
                      onClick={() => setCreateStep("details")}
                      variant="outline"
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}

              {createStep === "review" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Review Assessment</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Assessment Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Title:</p>
                        <p className="font-medium text-gray-900">{createForm.title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Questions:</p>
                        <p className="font-medium text-gray-900">{createForm.uploadedQuestions.length} questions</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time Limit:</p>
                        <p className="font-medium text-gray-900">{createForm.timeLimit} minutes</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Questions:</p>
                        <p className="font-medium text-gray-900">{createForm.totalQuestions}</p>
                      </div>
                      {createForm.isScheduled && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Start:</p>
                            <p className="font-medium text-gray-900">
                              {createForm.startDate && createForm.startTime 
                                ? `${createForm.startDate} at ${createForm.startTime}`
                                : "Not set"
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">End:</p>
                            <p className="font-medium text-gray-900">
                              {createForm.endDate && createForm.endTime 
                                ? `${createForm.endDate} at ${createForm.endTime}`
                                : "Not set"
                              }
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {createForm.uploadedQuestions.length < createForm.totalQuestions && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        <div>
                          <p className="font-medium text-red-900">Insufficient Questions</p>
                          <p className="text-sm text-red-700">
                            You need {createForm.totalQuestions} questions but only have {createForm.uploadedQuestions.length}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      onClick={() => setCreateStep("upload")}
                      variant="outline"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleCreateAssessment}
                      disabled={creating || createForm.uploadedQuestions.length < createForm.totalQuestions}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {creating ? "Creating..." : "Create Assessment"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit View */}
          {currentView === "edit" && editingAssessment && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Assessment: {editingAssessment.title}
              </h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  <strong>Note:</strong> You can only edit scheduling and settings for existing assessments. 
                  To change questions, create a new assessment.
                </p>
              </div>

              {/* Schedule Management Form would go here */}
              <div className="text-center py-8">
                <p className="text-gray-600">Schedule editing interface coming soon...</p>
                <Button
                  onClick={() => setCurrentView("list")}
                  variant="outline"
                  className="mt-4"
                >
                  Back to List
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
