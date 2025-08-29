// src/components/admin/EnhancedRMAdminDashboard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { rmUserAccessManager } from "@/lib/rmUserAccess";
import { standaloneRMExamManager } from "@/lib/standaloneRMExams";
import { rmExamAttemptManager, RMExamAttempt } from "@/lib/rmExamAttempts";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Settings,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Award
} from "lucide-react";

interface AdminStats {
  totalRMUsers: number;
  activeExams: number;
  totalAttempts: number;
  totalRevenue: number;
  todaySignups: number;
  todayAttempts: number;
  averageScore: number;
  passRate: number;
}

interface UserAccessInfo {
  userId: string;
  userEmail: string;
  userName: string;
  hasAccess: boolean;
  accessType: string;
  expiresAt: Date | null;
  purchaseDate: Date | null;
  totalAttempts: number;
  bestScore: number;
  lastActivity: Date | null;
}

interface ExamAnalytics {
  examId: string;
  examTitle: string;
  totalAttempts: number;
  completionRate: number;
  averageScore: number;
  passRate: number;
  topScore: number;
  lastAttempt: Date | null;
}

export default function EnhancedRMAdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'exams' | 'analytics' | 'settings'>('overview');
  
  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [userAccessList, setUserAccessList] = useState<UserAccessInfo[]>([]);
  const [examAnalytics, setExamAnalytics] = useState<ExamAnalytics[]>([]);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadUserAccessData(),
        loadExamAnalytics()
      ]);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (): Promise<void> => {
    try {
      // Get RM user access statistics
      const allUsers = await rmUserAccessManager.getAllRMUsers();
      const totalRMUsers = allUsers.length;
      
      // Get exam statistics
      const allExams = await standaloneRMExamManager.getActiveRMExams();
      const activeExams = allExams.length;
      
      // Calculate today's metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayUsers = allUsers.filter(user => 
        user.accessGrantedAt && new Date(user.accessGrantedAt) >= today
      );
      
      // Get attempt statistics
      const allAttempts = await rmExamAttemptManager.getAllRMExamAttempts();
      const todayAttempts = allAttempts.filter((attempt: RMExamAttempt) => 
        attempt.startTime && new Date(attempt.startTime) >= today
      );
      
      const completedAttempts = allAttempts.filter((attempt: RMExamAttempt) => attempt.completed);
      const averageScore = completedAttempts.length > 0 
        ? completedAttempts.reduce((sum: number, attempt: RMExamAttempt) => sum + (attempt.score || 0), 0) / completedAttempts.length
        : 0;
      
      const passedAttempts = completedAttempts.filter((attempt: RMExamAttempt) => 
        (attempt.score || 0) >= 70 // Assuming 70% pass rate
      );
      const passRate = completedAttempts.length > 0 
        ? (passedAttempts.length / completedAttempts.length) * 100
        : 0;

      setStats({
        totalRMUsers,
        activeExams,
        totalAttempts: allAttempts.length,
        totalRevenue: totalRMUsers * 2000, // Assuming ₦2000 per user
        todaySignups: todayUsers.length,
        todayAttempts: todayAttempts.length,
        averageScore,
        passRate
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadUserAccessData = async (): Promise<void> => {
    try {
      const allUsers = await rmUserAccessManager.getAllRMUsers();
      const userAccessInfo: UserAccessInfo[] = [];

      for (const userAccess of allUsers) {
        // Get user's attempt statistics
        const userAttempts = await rmExamAttemptManager.getUserRMExamAttempts(userAccess.userId);
        const completedAttempts = userAttempts.filter((attempt: RMExamAttempt) => attempt.completed);
        const bestScore = completedAttempts.length > 0 
          ? Math.max(...completedAttempts.map((attempt: RMExamAttempt) => attempt.score || 0))
          : 0;
        
        const lastActivity = userAttempts.length > 0 
          ? new Date(Math.max(...userAttempts.map((attempt: RMExamAttempt) => 
              new Date(attempt.startTime || 0).getTime()
            )))
          : null;

        userAccessInfo.push({
          userId: userAccess.userId,
          userEmail: userAccess.userEmail || 'Unknown',
          userName: userAccess.userEmail || 'Unknown', // Using email as name fallback
          hasAccess: userAccess.hasAccess,
          accessType: userAccess.accessMethod || 'payment',
          expiresAt: userAccess.accessExpiresAt ? new Date(userAccess.accessExpiresAt) : null,
          purchaseDate: userAccess.accessGrantedAt ? new Date(userAccess.accessGrantedAt) : null,
          totalAttempts: userAttempts.length,
          bestScore,
          lastActivity
        });
      }

      setUserAccessList(userAccessInfo);
    } catch (error) {
      console.error("Error loading user access data:", error);
    }
  };

  const loadExamAnalytics = async (): Promise<void> => {
    try {
      const allExams = await standaloneRMExamManager.getActiveRMExams();
      const allAttempts = await rmExamAttemptManager.getAllRMExamAttempts();
      const examAnalytics: ExamAnalytics[] = [];

      for (const exam of allExams) {
        // Filter attempts for this specific exam
        const examAttempts = allAttempts.filter((attempt: RMExamAttempt) => attempt.examId === exam.id);
        const completedAttempts = examAttempts.filter((attempt: RMExamAttempt) => attempt.completed);
        
        const completionRate = examAttempts.length > 0 
          ? (completedAttempts.length / examAttempts.length) * 100
          : 0;
        
        const averageScore = completedAttempts.length > 0
          ? completedAttempts.reduce((sum: number, attempt: RMExamAttempt) => sum + (attempt.score || 0), 0) / completedAttempts.length
          : 0;
        
        const passedAttempts = completedAttempts.filter((attempt: RMExamAttempt) => 
          (attempt.score || 0) >= 70
        );
        const passRate = completedAttempts.length > 0
          ? (passedAttempts.length / completedAttempts.length) * 100
          : 0;
        
        const topScore = completedAttempts.length > 0
          ? Math.max(...completedAttempts.map((attempt: RMExamAttempt) => attempt.score || 0))
          : 0;
        
        const lastAttempt = examAttempts.length > 0
          ? new Date(Math.max(...examAttempts.map((attempt: RMExamAttempt) => 
              new Date(attempt.startTime || 0).getTime()
            )))
          : null;

        examAnalytics.push({
          examId: exam.id,
          examTitle: exam.title,
          totalAttempts: examAttempts.length,
          completionRate,
          averageScore,
          passRate,
          topScore,
          lastAttempt
        });
      }

      setExamAnalytics(examAnalytics);
    } catch (error) {
      console.error("Error loading exam analytics:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const handleGrantAccess = async (userId: string, userEmail: string) => {
    try {
      const adminSettings = {
        maxAttempts: 5, // Default admin setting
        notes: `Access granted via admin dashboard by ${user?.email || 'admin'}`
      };
      await rmUserAccessManager.adminGrantRMAccess(userId, userEmail, adminSettings, user?.email || 'admin');
      await loadUserAccessData();
    } catch (error) {
      console.error("Error granting access:", error);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    try {
      await rmUserAccessManager.revokeRMAccess(userId);
      await loadUserAccessData();
    } catch (error) {
      console.error("Error revoking access:", error);
    }
  };

  const filteredUsers = userAccessList.filter(user => {
    const matchesSearch = 
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.hasAccess) ||
      (filterStatus === 'expired' && !user.hasAccess);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RM Admin Dashboard</h1>
              <p className="text-gray-600">Comprehensive RM system management</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'exams', label: 'Exam Analytics', icon: BookOpen },
              { id: 'analytics', label: 'Performance Analytics', icon: TrendingUp },
              { id: 'settings', label: 'System Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total RM Users</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalRMUsers}</p>
                      <p className="text-sm text-green-600">+{stats.todaySignups} today</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Exams</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.activeExams}</p>
                      <p className="text-sm text-blue-600">Available now</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</p>
                      <p className="text-sm text-purple-600">+{stats.todayAttempts} today</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">₦{stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-green-600">Total earned</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Score</span>
                      <span className="text-2xl font-bold text-blue-600">{stats.averageScore.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pass Rate</span>
                      <span className="text-2xl font-bold text-green-600">{stats.passRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Exam
                    </button>
                    <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Download className="h-4 w-4 mr-2" />
                      Export User Data
                    </button>
                    <button className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Management Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">User Access Management</h2>
                <p className="text-gray-600">Manage RM access for all users</p>
              </div>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Access</option>
                  <option value="expired">No Access</option>
                </select>
              </div>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((userInfo) => (
                      <tr key={userInfo.userId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{userInfo.userName}</div>
                            <div className="text-sm text-gray-500">{userInfo.userEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userInfo.hasAccess
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userInfo.hasAccess ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                No Access
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userInfo.totalAttempts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userInfo.bestScore}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userInfo.lastActivity ? userInfo.lastActivity.toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {userInfo.hasAccess ? (
                              <button
                                onClick={() => handleRevokeAccess(userInfo.userId)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Revoke
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGrantAccess(userInfo.userId, userInfo.userEmail)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Grant
                              </button>
                            )}
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Exam Analytics</h2>
              <p className="text-gray-600">Performance insights for all RM exams</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {examAnalytics.map((exam) => (
                <div key={exam.examId} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{exam.examTitle}</h3>
                      <p className="text-sm text-gray-500">ID: {exam.examId}</p>
                    </div>
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Attempts</span>
                      <span className="font-semibold">{exam.totalAttempts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-semibold">{exam.completionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Score</span>
                      <span className="font-semibold">{exam.averageScore.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pass Rate</span>
                      <span className="font-semibold text-green-600">{exam.passRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Top Score</span>
                      <span className="font-semibold text-blue-600">{exam.topScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Attempt</span>
                      <span className="text-sm">{exam.lastAttempt ? exam.lastAttempt.toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      <button className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Performance Analytics</h2>
              <p className="text-gray-600">Detailed performance insights and trends</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
              <p className="text-gray-600">Advanced analytics features including:</p>
              <ul className="mt-4 space-y-2 text-gray-600">
                <li>• Time-based performance trends</li>
                <li>• User engagement patterns</li>
                <li>• Question-level analytics</li>
                <li>• Revenue tracking and forecasting</li>
                <li>• Custom reporting and exports</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
              <p className="text-gray-600">Configure RM system parameters</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Options</h3>
              <p className="text-gray-600">System configuration features including:</p>
              <ul className="mt-4 space-y-2 text-gray-600">
                <li>• Exam scheduling and availability</li>
                <li>• Access pricing and duration settings</li>
                <li>• Email notification templates</li>
                <li>• Security and authentication settings</li>
                <li>• Backup and maintenance options</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
