"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Alert";
import { standaloneRMExamManager } from "@/lib/standaloneRMExams";
import { questionBankManager } from "@/lib/questionBank";
import {
  Crown,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  Users,
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  DollarSign,
  Activity,
  Award,
  Database,
  FileText,
  AlertCircle,
  Download,
  RefreshCw,
} from "lucide-react";

interface StandaloneRMExamAdminProps {
  user: any;
}

interface ExamFormData {
  title: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  price: number;
  category: string;
  difficulty: string;
  instructions: string;
  isActive: boolean;
  masterToggle: boolean;
  // Additional RM Exam specific fields
  paper: 'A' | 'B' | 'C' | 'D';
  requiresPayment: boolean;
  currency: string;
  availableDate?: string;
  examWindowMinutes?: number;
  isScheduled: boolean;
}

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulPayments: number;
  failedPayments: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface UserAccessData {
  userId: string;
  userName: string;
  email: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  accessGrantedAt?: Date;
  accessExpiresAt?: Date;
  transactionId?: string;
  amount?: number;
}

export default function StandaloneRMExamAdmin({ user }: StandaloneRMExamAdminProps) {
  const { showToast } = useToast();
  
  // Main state
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'payments' | 'users' | 'analytics'>('overview');
  const [rmExams, setRmExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Exam management state
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [examForm, setExamForm] = useState<ExamFormData>({
    title: '',
    description: '',
    questionCount: 50,
    timeLimit: 90,
    price: 5000, // Default price in kobo (₦50)
    category: 'RM',
    difficulty: 'intermediate',
    instructions: '',
    isActive: true,
    masterToggle: true,
    // Additional RM Exam specific fields
    paper: 'A',
    requiresPayment: true,
    currency: 'NGN',
    availableDate: '',
    examWindowMinutes: 180,
    isScheduled: false,
  });
  
  // Analytics state
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    failedPayments: 0,
    averageOrderValue: 0,
    conversionRate: 0,
  });
  
  const [userAccessData, setUserAccessData] = useState<UserAccessData[]>([]);
  const [examAttempts, setExamAttempts] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRMExams(),
        loadPaymentStats(),
        loadUserAccessData(),
        loadExamAttempts(),
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load admin data',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    showToast({
      type: 'success',
      title: 'Data Refreshed',
      message: 'All data has been refreshed successfully',
    });
  };

  const loadRMExams = async () => {
    try {
      const exams = await standaloneRMExamManager.getActiveRMExams();
      setRmExams(exams);
    } catch (error) {
      console.error('Error loading RM exams:', error);
    }
  };

  const loadPaymentStats = async () => {
    try {
      // This would need to be implemented in standaloneRMExamManager
      // For now, we'll use mock data
      setPaymentStats({
        totalRevenue: 450000, // ₦4,500
        totalTransactions: 23,
        successfulPayments: 20,
        failedPayments: 3,
        averageOrderValue: 5000, // ₦50
        conversionRate: 87.0,
      });
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  const loadUserAccessData = async () => {
    try {
      // This would need to be implemented to get user payment data
      // For now, we'll use mock data
      setUserAccessData([]);
    } catch (error) {
      console.error('Error loading user access data:', error);
    }
  };

  const loadExamAttempts = async () => {
    try {
      // Load recent exam attempts across all RM exams
      setExamAttempts([]);
    } catch (error) {
      console.error('Error loading exam attempts:', error);
    }
  };

  const handleCreateExam = async () => {
    try {
      // Get random questions for the exam using assignQuestionsToUser
      const questions = await questionBankManager.assignQuestionsToUser(
        `admin-${Date.now()}`, // temporary user ID for admin creation
        "RM",
        "paper-1", // default to paper-1, this could be configurable
        examForm.questionCount
      );

      if (questions.length < examForm.questionCount) {
        showToast({
          type: 'error',
          title: 'Insufficient Questions',
          message: `Only ${questions.length} questions available for ${examForm.category}. Need ${examForm.questionCount}.`,
        });
        return;
      }

      // Convert Question[] to RMQuestion[]
      const rmQuestions = questions.map(q => ({
        ...q,
        category: 'RM' as const,
        paper: 'paper-1', // Default paper
        metadata: {
          source: 'generated' as const,
          reviewStatus: 'approved' as const,
        }
      }));

      const examData = {
        title: examForm.title,
        description: examForm.description,
        paper: examForm.paper as 'A' | 'B' | 'C' | 'D',
        questions: rmQuestions,
        timeLimit: examForm.timeLimit,
        totalQuestions: examForm.questionCount,
        isActive: examForm.isActive,
        createdBy: user?.email || 'admin',
        // Payment and access control
        requiresPayment: examForm.requiresPayment,
        price: examForm.price,
        currency: examForm.currency,
        // Scheduling
        availableDate: examForm.availableDate ? new Date(examForm.availableDate) : undefined,
        examWindowMinutes: examForm.examWindowMinutes,
        isScheduled: examForm.isScheduled,
        isPublished: true, // Add missing isPublished property
        masterToggle: examForm.masterToggle,
        // RM specific properties
        examType: 'rm-exam' as const,
        difficulty: examForm.difficulty as 'easy' | 'medium' | 'hard',
        passingScore: Math.ceil(examForm.questionCount * 0.6), // 60% passing
      };

      await standaloneRMExamManager.createStandaloneRMExam(examData);
      
      showToast({
        type: 'success',
        title: 'Exam Created',
        message: `${examForm.title} has been created successfully`,
      });

      setShowCreateExam(false);
      resetExamForm();
      loadRMExams();
    } catch (error) {
      console.error('Error creating exam:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create exam',
      });
    }
  };

  const handleUpdateExam = async () => {
    if (!editingExam) return;

    try {
      const updateData = {
        title: examForm.title,
        description: examForm.description,
        timeLimit: examForm.timeLimit,
        isActive: examForm.isActive,
        requiresPayment: examForm.requiresPayment,
        price: examForm.price,
        currency: examForm.currency,
        availableDate: examForm.availableDate ? new Date(examForm.availableDate) : undefined,
        examWindowMinutes: examForm.examWindowMinutes,
        isScheduled: examForm.isScheduled,
        masterToggle: examForm.masterToggle,
        difficulty: examForm.difficulty as 'easy' | 'medium' | 'hard',
      };

      await standaloneRMExamManager.updateStandaloneRMExam(editingExam.id, updateData);
      
      showToast({
        type: 'success',
        title: 'Exam Updated',
        message: `${examForm.title} has been updated successfully`,
      });

      setEditingExam(null);
      resetExamForm();
      loadRMExams();
    } catch (error) {
      console.error('Error updating exam:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update exam',
      });
    }
  };

  const resetExamForm = () => {
    setExamForm({
      title: '',
      description: '',
      questionCount: 50,
      timeLimit: 90,
      price: 5000,
      category: 'RM',
      difficulty: 'intermediate',
      instructions: '',
      isActive: true,
      masterToggle: true,
      // Additional RM Exam specific fields
      paper: 'A',
      requiresPayment: true,
      currency: 'NGN',
      availableDate: '',
      examWindowMinutes: 180,
      isScheduled: false,
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Crown className="h-6 w-6 text-emerald-600 mr-2" />
              RM Exam Management
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive management for paid RM certification exams
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={refreshData}
              variant="outline"
              disabled={refreshing}
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateExam(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'exams', label: 'Exam Management', icon: FileText },
            { id: 'payments', label: 'Payment Analytics', icon: CreditCard },
            { id: 'users', label: 'User Access', icon: Users },
            { id: 'analytics', label: 'Performance', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <Crown className="h-8 w-8" />
                  <div className="ml-4">
                    <p className="text-emerald-100">Total Exams</p>
                    <p className="text-2xl font-bold">{rmExams.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8" />
                  <div className="ml-4">
                    <p className="text-blue-100">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(paymentStats.totalRevenue)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <Users className="h-8 w-8" />
                  <div className="ml-4">
                    <p className="text-purple-100">Paid Users</p>
                    <p className="text-2xl font-bold">{paymentStats.successfulPayments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <Activity className="h-8 w-8" />
                  <div className="ml-4">
                    <p className="text-orange-100">Conversion Rate</p>
                    <p className="text-2xl font-bold">{paymentStats.conversionRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Exams */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Recent Exams
                </h3>
                <div className="space-y-3">
                  {rmExams.slice(0, 5).map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{exam.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(exam.price || 5000)} • {exam.totalQuestions} questions
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {exam.isActive ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Overview */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Transactions</span>
                    <span className="font-semibold">{paymentStats.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Successful Payments</span>
                    <span className="font-semibold text-green-600">{paymentStats.successfulPayments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Failed Payments</span>
                    <span className="font-semibold text-red-600">{paymentStats.failedPayments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Order Value</span>
                    <span className="font-semibold">{formatCurrency(paymentStats.averageOrderValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exam Management Tab */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            {/* Exams List */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All RM Exams</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {rmExams.map((exam) => (
                  <div key={exam.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">{exam.title}</h4>
                          {exam.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{exam.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{exam.totalQuestions} questions</span>
                          <span>{exam.timeLimit} minutes</span>
                          <span>{formatCurrency(exam.price || 5000)}</span>
                          <span>Created {formatDate(exam.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingExam(exam);
                            setExamForm({
                              title: exam.title,
                              description: exam.description,
                              questionCount: exam.totalQuestions,
                              timeLimit: exam.timeLimit,
                              price: exam.price || 5000,
                              category: exam.category || 'RM',
                              difficulty: exam.difficulty || 'intermediate',
                              instructions: exam.instructions || '',
                              isActive: exam.isActive,
                              masterToggle: exam.masterToggle,
                              // Additional RM Exam specific fields
                              paper: exam.paper || 'A',
                              requiresPayment: exam.requiresPayment ?? true,
                              currency: exam.currency || 'NGN',
                              availableDate: exam.availableDate ? exam.availableDate.toISOString().split('T')[0] : '',
                              examWindowMinutes: exam.examWindowMinutes || 180,
                              isScheduled: exam.isScheduled || false,
                            });
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {rmExams.length === 0 && (
                  <div className="p-8 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No exams created</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating your first RM exam.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setShowCreateExam(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Exam
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Analytics Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Revenue Chart Placeholder */}
              <div className="col-span-2 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
                <div className="h-64 flex items-center justify-center bg-white rounded border">
                  <p className="text-gray-500">Chart visualization would go here</p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flutterwave</span>
                    <span className="font-semibold">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab === 'users' && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">User Access Management</h3>
            <p className="mt-1 text-sm text-gray-500">User access controls will be implemented here.</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Performance Analytics</h3>
            <p className="mt-1 text-sm text-gray-500">Detailed analytics and reporting will be implemented here.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Exam Modal */}
      {(showCreateExam || editingExam) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingExam ? 'Edit Exam' : 'Create New RM Exam'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateExam(false);
                    setEditingExam(null);
                    resetExamForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Exam Title
                    </label>
                    <input
                      type="text"
                      value={examForm.title}
                      onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="e.g., RM Certification Practice Exam 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Price (in Naira)
                    </label>
                    <input
                      type="number"
                      value={examForm.price / 100}
                      onChange={(e) => setExamForm({ ...examForm, price: Number(e.target.value) * 100 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="50"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      value={examForm.questionCount}
                      onChange={(e) => setExamForm({ ...examForm, questionCount: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      min="10"
                      max="200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      value={examForm.timeLimit}
                      onChange={(e) => setExamForm({ ...examForm, timeLimit: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      min="30"
                      max="300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={examForm.description}
                    onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Describe the exam content and objectives..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Instructions
                  </label>
                  <textarea
                    value={examForm.instructions}
                    onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Special instructions for exam takers..."
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={examForm.isActive}
                      onChange={(e) => setExamForm({ ...examForm, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-emerald-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={examForm.masterToggle}
                      onChange={(e) => setExamForm({ ...examForm, masterToggle: e.target.checked })}
                      className="rounded border-gray-300 text-emerald-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Master Toggle</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateExam(false);
                      setEditingExam(null);
                      resetExamForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingExam ? handleUpdateExam : handleCreateExam}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {editingExam ? 'Update Exam' : 'Create Exam'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
