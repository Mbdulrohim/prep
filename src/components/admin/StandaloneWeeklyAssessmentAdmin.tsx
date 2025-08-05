// src/components/admin/StandaloneWeeklyAssessmentAdmin.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, Users, BarChart3, Upload, Settings, Power, Flag, Edit, CheckCircle, XCircle, AlertCircle, Play, Pause, RotateCcw, Eye } from "lucide-react";
import { standaloneWeeklyAssessmentManager, StandaloneWeeklyAssessment, StandaloneAssessmentStats } from "../../lib/standaloneWeeklyAssessments";
import { ParsedQuestion } from "../../lib/documentParser";
import DocumentParser from "../../lib/documentParser";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

interface StandaloneWeeklyAssessmentAdminProps {
  user: User | null;
}

const StandaloneWeeklyAssessmentAdmin: React.FC<StandaloneWeeklyAssessmentAdminProps> = ({ user }) => {
  const [currentAssessment, setCurrentAssessment] = useState<StandaloneWeeklyAssessment | null>(null);
  const [allAssessments, setAllAssessments] = useState<(StandaloneWeeklyAssessment & { isAvailable: boolean })[]>([]);
  const [stats, setStats] = useState<StandaloneAssessmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"overview" | "create" | "schedule" | "history">("overview");
  
  // Create form state
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    timeLimit: 90, // exam duration
    examWindowMinutes: 100, // total window (exam + buffer)
    totalQuestions: 150,
    availableDate: "",
    isScheduled: false,
  });
  const [uploadedQuestions, setUploadedQuestions] = useState<ParsedQuestion[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    availableDate: "",
    isScheduled: false,
    timeLimit: 90,
    totalQuestions: 150,
    description: "",
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current assessment for admin
      const current = await standaloneWeeklyAssessmentManager.getCurrentAssessmentForAdmin();
      setCurrentAssessment(current);
      
      // Get all assessments with status
      const all = await standaloneWeeklyAssessmentManager.getAllAssessmentsWithStatus();
      setAllAssessments(all);
      
      // Get stats for current assessment
      if (current) {
        const assessmentStats = await standaloneWeeklyAssessmentManager.getStandaloneAssessmentStats(current.id);
        setStats(assessmentStats);
        
        // Populate schedule form with current data
        setScheduleForm({
          availableDate: current.availableDate ? current.availableDate.toISOString().slice(0, 16) : "",
          isScheduled: current.isScheduled || false,
          timeLimit: current.timeLimit || 90,
          totalQuestions: current.totalQuestions || 150,
          description: current.description || "",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await DocumentParser.parseDocxFile(file, "weekly-assessment");
      
      if (result.success && result.questions) {
        setUploadedQuestions(result.questions);
        console.log(`Parsed ${result.questions.length} questions from document`);
      } else {
        throw new Error(result.error || "Failed to parse document");
      }
    } catch (error) {
      console.error("Error parsing document:", error);
      alert("Error parsing document. Please check the format and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!user || uploadedQuestions.length === 0) return;

    setCreating(true);
    try {
      const options = {
        timeLimit: createForm.timeLimit,
        examWindowMinutes: createForm.examWindowMinutes,
        totalQuestions: createForm.totalQuestions,
        availableDate: createForm.availableDate ? new Date(createForm.availableDate) : undefined,
        isActive: true,
        masterToggle: true,
        isScheduled: createForm.isScheduled,
      };

      await standaloneWeeklyAssessmentManager.createStandaloneAssessment(
        createForm.title,
        createForm.description,
        uploadedQuestions,
        user.uid,
        options
      );

      // Reset form
      setCreateForm({
        title: "",
        description: "",
        timeLimit: 90,
        examWindowMinutes: 100,
        totalQuestions: 150,
        availableDate: "",
        isScheduled: false,
      });
      setUploadedQuestions([]);
      
      // Refresh data
      await fetchData();
      setActiveView("overview");
      
      alert("Weekly assessment created successfully!");
    } catch (error) {
      console.error("Error creating assessment:", error);
      alert("Error creating assessment. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!currentAssessment) return;

    setUpdating(true);
    try {
      const scheduleData = {
        availableDate: scheduleForm.availableDate ? new Date(scheduleForm.availableDate) : undefined,
        isScheduled: scheduleForm.isScheduled,
        timeLimit: scheduleForm.timeLimit,
        totalQuestions: scheduleForm.totalQuestions,
        description: scheduleForm.description,
      };

      await standaloneWeeklyAssessmentManager.updateAssessmentSchedule(currentAssessment.id, scheduleData);
      
      await fetchData();
      alert("Assessment schedule updated successfully!");
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert("Error updating schedule. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleMasterSwitch = async (enabled: boolean) => {
    if (!currentAssessment) return;

    try {
      await standaloneWeeklyAssessmentManager.toggleMasterSwitch(currentAssessment.id, enabled);
      await fetchData();
    } catch (error) {
      console.error("Error toggling master switch:", error);
      alert("Error updating master switch. Please try again.");
    }
  };

  const handleReactivateAssessment = async (assessmentId: string) => {
    try {
      await standaloneWeeklyAssessmentManager.reactivateStandaloneAssessment(assessmentId);
      await fetchData();
      alert("Assessment reactivated successfully!");
    } catch (error) {
      console.error("Error reactivating assessment:", error);
      alert("Error reactivating assessment. Please try again.");
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Not set";
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getStatusColor = (assessment: StandaloneWeeklyAssessment & { isAvailable: boolean }) => {
    if (!assessment.isActive) return "text-gray-500";
    if (!assessment.masterToggle) return "text-red-500";
    if (assessment.isAvailable) return "text-green-500";
    return "text-yellow-500";
  };

  const getStatusIcon = (assessment: StandaloneWeeklyAssessment & { isAvailable: boolean }) => {
    if (!assessment.isActive) return <XCircle className="w-4 h-4" />;
    if (!assessment.masterToggle) return <Pause className="w-4 h-4" />;
    if (assessment.isAvailable) return <CheckCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Standalone Weekly Assessment Manager</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView("overview")}
            className={`px-4 py-2 rounded-lg ${activeView === "overview" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView("create")}
            className={`px-4 py-2 rounded-lg ${activeView === "create" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Create New
          </button>
          <button
            onClick={() => setActiveView("schedule")}
            className={`px-4 py-2 rounded-lg ${activeView === "schedule" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveView("history")}
            className={`px-4 py-2 rounded-lg ${activeView === "history" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            History
          </button>
        </div>
      </div>

      {activeView === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Assessment Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Current Assessment</h2>
              {currentAssessment && (
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${getStatusColor(currentAssessment as any)}`}>
                    {currentAssessment.isActive && currentAssessment.masterToggle ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => handleToggleMasterSwitch(!currentAssessment.masterToggle)}
                    className={`p-2 rounded-lg ${
                      currentAssessment.masterToggle
                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}
                    title={`${currentAssessment.masterToggle ? "Disable" : "Enable"} Assessment`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {currentAssessment ? (
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-gray-900">{currentAssessment.title}</h3>
                  <p className="text-sm text-gray-600">{currentAssessment.description || "No description"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Questions:</span>
                    <span className="ml-2 font-medium">{currentAssessment.totalQuestions}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time Limit:</span>
                    <span className="ml-2 font-medium">{currentAssessment.timeLimit} min</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 font-medium">{formatDate(currentAssessment.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Scheduled:</span>
                    <span className="ml-2 font-medium">{currentAssessment.isScheduled ? "Yes" : "No"}</span>
                  </div>
                </div>

                {currentAssessment.isScheduled && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-blue-900 mb-1">Schedule</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>Available: {formatDate(currentAssessment.availableDate)}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No active assessment</p>
                <button
                  onClick={() => setActiveView("create")}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Assessment
                </button>
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Statistics</h2>
            
            {stats && currentAssessment ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalAttempts}</div>
                    <div className="text-sm text-blue-800">Total Attempts</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{stats.averagePercentage.toFixed(1)}%</div>
                    <div className="text-sm text-green-800">Average Score</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">{stats.topScore}</div>
                    <div className="text-sm text-purple-800">Top Score</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">{stats.averageTimeSpent.toFixed(1)}</div>
                    <div className="text-sm text-orange-800">Avg Time (min)</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No statistics available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === "create" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Weekly Assessment</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Weekly Assessment #1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Duration (minutes)
                  <span className="text-xs text-gray-500 block">Time students have to complete the exam</span>
                </label>
                <input
                  type="number"
                  value={createForm.timeLimit}
                  onChange={(e) => setCreateForm({...createForm, timeLimit: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Window (minutes)
                  <span className="text-xs text-gray-500 block">Total time window including late registration buffer</span>
                </label>
                <input
                  type="number"
                  value={createForm.examWindowMinutes}
                  onChange={(e) => setCreateForm({...createForm, examWindowMinutes: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={createForm.timeLimit}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Recommended: {createForm.timeLimit + 10} minutes ({createForm.timeLimit} exam + 10 buffer)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Optional description for the assessment"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Questions</label>
                <input
                  type="number"
                  value={createForm.totalQuestions}
                  onChange={(e) => setCreateForm({...createForm, totalQuestions: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max={uploadedQuestions.length}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isScheduled"
                  checked={createForm.isScheduled}
                  onChange={(e) => setCreateForm({...createForm, isScheduled: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isScheduled" className="ml-2 block text-sm text-gray-900">
                  Schedule assessment
                </label>
              </div>
            </div>

            {createForm.isScheduled && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Date & Time</label>
                  <input
                    type="datetime-local"
                    value={createForm.availableDate}
                    onChange={(e) => setCreateForm({...createForm, availableDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Questions Document</label>
              <input
                type="file"
                accept=".docx,.doc,.txt"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {uploading && <p className="text-sm text-blue-600 mt-2">Parsing document...</p>}
              {uploadedQuestions.length > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  Successfully parsed {uploadedQuestions.length} questions
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setCreateForm({
                    title: "",
                    description: "",
                    timeLimit: 90,
                    examWindowMinutes: 100,
                    totalQuestions: 150,
                    availableDate: "",
                    isScheduled: false,
                  });
                  setUploadedQuestions([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleCreateAssessment}
                disabled={!createForm.title || uploadedQuestions.length === 0 || creating}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : "Create Assessment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === "schedule" && currentAssessment && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Schedule Management</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
                <input
                  type="number"
                  value={scheduleForm.timeLimit}
                  onChange={(e) => setScheduleForm({...scheduleForm, timeLimit: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Questions</label>
                <input
                  type="number"
                  value={scheduleForm.totalQuestions}
                  onChange={(e) => setScheduleForm({...scheduleForm, totalQuestions: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max={currentAssessment.questions.length}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Optional description for the assessment"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="scheduleIsScheduled"
                checked={scheduleForm.isScheduled}
                onChange={(e) => setScheduleForm({...scheduleForm, isScheduled: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="scheduleIsScheduled" className="ml-2 block text-sm text-gray-900">
                Enable scheduling
              </label>
            </div>

            {scheduleForm.isScheduled && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.availableDate}
                    onChange={(e) => setScheduleForm({...scheduleForm, availableDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleUpdateSchedule}
                disabled={updating}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Update Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === "history" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Assessment History</h2>
          
          <div className="space-y-4">
            {allAssessments.map((assessment) => (
              <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">{assessment.title}</h3>
                      <div className={`flex items-center space-x-1 ${getStatusColor(assessment)}`}>
                        {getStatusIcon(assessment)}
                        <span className="text-sm font-medium">
                          {assessment.isActive ? (assessment.isAvailable ? "Available" : "Scheduled") : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {assessment.description || "No description"}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{assessment.totalQuestions} questions</span>
                      <span>{assessment.timeLimit} minutes</span>
                      <span>Created {formatDate(assessment.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!assessment.isActive && (
                      <button
                        onClick={() => handleReactivateAssessment(assessment.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Reactivate Assessment"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Preview Assessment"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {allAssessments.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No assessments found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StandaloneWeeklyAssessmentAdmin;
