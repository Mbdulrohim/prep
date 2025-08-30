"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';

interface RMExam {
  id: string;
  title: string;
  paper: string;
  description: string;
  duration: number;
  totalQuestions: number;
  passingScore: number;
  instructions: any;
  settings: any;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

interface RMExamSchedulerProps {
  onUpdate?: () => void;
}

export default function RMExamScheduler({ onUpdate }: RMExamSchedulerProps) {
  const [exams, setExams] = useState<RMExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [clearClicks, setClearClicks] = useState<Record<string, number>>({});

  const [editingExam, setEditingExam] = useState<string | null>(null);
  const [examData, setExamData] = useState<Partial<RMExam>>({});

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rm-exams');
      const result = await response.json();
      
      if (result.success) {
        setExams(result.data?.exams || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load RM exams' });
      }
    } catch (error) {
      console.error('Error loading exams:', error);
      setMessage({ type: 'error', text: 'Failed to load RM exams' });
    } finally {
      setLoading(false);
    }
  };

  const updateExam = async (examId: string, updates: Partial<RMExam>) => {
    try {
      setSaving(examId);
      const response = await fetch(`/api/admin/rm-exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Exam updated successfully' });
        loadExams();
        setEditingExam(null);
        onUpdate?.();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update exam' });
      }
    } catch (error) {
      console.error('Error updating exam:', error);
      setMessage({ type: 'error', text: 'Failed to update exam' });
    } finally {
      setSaving(null);
    }
  };

  const toggleExamStatus = async (examId: string, field: 'isActive' | 'isPublished') => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    await updateExam(examId, {
      [field]: !exam[field]
    });
  };

  const startEditing = (exam: RMExam) => {
    setEditingExam(exam.id);
    setExamData({
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      passingScore: exam.passingScore,
      scheduledDate: exam.scheduledDate,
      scheduledTime: exam.scheduledTime
    });
  };

  const saveExamChanges = () => {
    if (!editingExam) return;
    updateExam(editingExam, examData);
  };

  const handleClearSchedule = (examId: string) => {
    const currentClicks = clearClicks[examId] || 0;
    
    if (currentClicks === 0) {
      // First click - mark as needing confirmation
      setClearClicks({ ...clearClicks, [examId]: 1 });
      setMessage({ type: 'error', text: 'Click Clear again to confirm deletion of schedule' });
      
      // Reset after 3 seconds
      setTimeout(() => {
        setClearClicks({ ...clearClicks, [examId]: 0 });
      }, 3000);
    } else {
      // Second click - actually clear
      updateExam(examId, { scheduledDate: undefined });
      setClearClicks({ ...clearClicks, [examId]: 0 });
      setMessage({ type: 'success', text: 'Exam schedule cleared successfully' });
    }
  };

  const scheduleExam = (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    const scheduledDate = examData.scheduledDate;
    const scheduledTime = examData.scheduledTime;

    if (!scheduledDate || !scheduledTime) {
      setMessage({ type: 'error', text: 'Please select both date and time' });
      return;
    }

    updateExam(examId, { scheduledDate, scheduledTime });
  };

  const getExamStatusColor = (exam: RMExam) => {
    if (!exam.isActive) return 'bg-gray-100 text-gray-600';
    if (!exam.isPublished) return 'bg-yellow-100 text-yellow-700';
    if (exam.totalQuestions === 0) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  const getExamStatusText = (exam: RMExam) => {
    if (!exam.isActive) return 'Inactive';
    if (!exam.isPublished) return 'Draft';
    if (exam.totalQuestions === 0) return 'No Questions';
    return 'Live';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">RM Exam Scheduler</h2>
            <p className="text-gray-600">Manage RM Paper 1 & 2 exam scheduling and settings</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={loadExams}
            variant="outline"
            className="text-blue-600 border-blue-600"
          >
            Refresh
          </Button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {exams.map((exam) => (
          <div key={exam.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingExam === exam.id ? (
                      <input
                        type="text"
                        value={examData.title || ''}
                        onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-lg font-semibold"
                      />
                    ) : (
                      exam.title
                    )}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExamStatusColor(exam)}`}>
                    {getExamStatusText(exam)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">
                  {editingExam === exam.id ? (
                    <textarea
                      value={examData.description || ''}
                      onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      rows={2}
                    />
                  ) : (
                    exam.description
                  )}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {editingExam === exam.id ? (
                      <input
                        type="number"
                        value={examData.duration || ''}
                        onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) })}
                        className="border border-gray-300 rounded px-1 py-0.5 w-16 ml-1"
                      />
                    ) : (
                      <span>{exam.duration}</span>
                    )} min
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>{exam.totalQuestions} questions</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    Pass: {editingExam === exam.id ? (
                      <input
                        type="number"
                        value={examData.passingScore || ''}
                        onChange={(e) => setExamData({ ...examData, passingScore: parseInt(e.target.value) })}
                        className="border border-gray-300 rounded px-1 py-0.5 w-12 ml-1"
                      />
                    ) : (
                      <span>{exam.passingScore}</span>
                    )}%
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Settings className="h-4 w-4 mr-1" />
                    <span className="capitalize">{exam.paper}</span>
                  </div>
                </div>

                {/* Exam Scheduling Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Exam Scheduling
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Date (Available all day)
                      </label>
                      <input
                        type="date"
                        value={editingExam === exam.id ? (examData.scheduledDate || '') : (exam.scheduledDate || '')}
                        onChange={(e) => editingExam === exam.id 
                          ? setExamData({ ...examData, scheduledDate: e.target.value })
                          : updateExam(exam.id, { scheduledDate: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Auto-schedule Paper 2
                      </label>
                      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                        {exam.paper === 'paper1' ? (
                          exam.scheduledDate ? (
                            `Paper 2 will be available on ${new Date(new Date(exam.scheduledDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}`
                          ) : (
                            'Set Paper 1 date to auto-schedule Paper 2'
                          )
                        ) : (
                          'Paper 2 date set automatically'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {exam.scheduledDate ? (
                        <span className="text-green-600 font-medium">
                          ✓ Scheduled for {new Date(exam.scheduledDate).toLocaleDateString()} (All day)
                        </span>
                      ) : (
                        <span className="text-orange-600">No schedule set</span>
                      )}
                    </div>
                    
                    {exam.scheduledDate && (
                      <Button
                        onClick={() => handleClearSchedule(exam.id)}
                        variant="outline"
                        size="sm"
                        className={`text-red-600 border-red-600 hover:bg-red-50 ${
                          clearClicks[exam.id] > 0 ? 'bg-red-100 border-red-700' : ''
                        }`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {clearClicks[exam.id] > 0 ? 'Click Again to Clear' : 'Clear'}
                      </Button>
                    )}
                  </div>
                </div>

                {editingExam === exam.id && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Last updated: {new Date(exam.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Created: {new Date(exam.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {editingExam === exam.id ? (
                  <>
                    <Button
                      onClick={() => setEditingExam(null)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveExamChanges}
                      size="sm"
                      disabled={saving === exam.id}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {saving === exam.id ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => startEditing(exam)}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      onClick={() => toggleExamStatus(exam.id, 'isActive')}
                      variant="outline"
                      size="sm"
                      disabled={saving === exam.id}
                      className={exam.isActive ? 'text-orange-600 border-orange-600' : 'text-green-600 border-green-600'}
                    >
                      {exam.isActive ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => toggleExamStatus(exam.id, 'isPublished')}
                      variant="outline"
                      size="sm"
                      disabled={saving === exam.id || exam.totalQuestions === 0}
                      className={exam.isPublished ? 'text-red-600 border-red-600' : 'text-blue-600 border-blue-600'}
                    >
                      {exam.isPublished ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Publish
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {exam.totalQuestions === 0 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-orange-700 text-sm">
                    This exam has no questions. Upload questions before publishing.
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {exams.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No RM exams found.</p>
          <p className="text-sm text-gray-500 mt-2">
            RM exams will be created automatically when questions are uploaded.
          </p>
        </div>
      )}
    </div>
  );
}
