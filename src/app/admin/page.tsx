"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { DocumentUpload } from "@/components/admin/DocumentUpload";
import { ParsedQuestion } from "@/lib/documentParser";
import { examAttemptManager } from "@/lib/examAttempts";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where, updateDoc, doc } from "firebase/firestore";
import { 
  Settings, 
  Upload, 
  Database, 
  Users, 
  BarChart3,
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Award,
  School,
  Clock,
  Target,
  UserX,
  UserCheck,
  Crown,
  TrendingUp,
  MessageCircle,
  Building2,
  Calendar,
  Filter
} from "lucide-react";

// Admin access control
const ADMIN_EMAILS = [
  "doyextech@gmail.com",
  "ibrahimadekunle3030@gmail.com", 
  "adekunleibrahim6060@gmail.com"
];

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  category: string;
  difficulty: string;
  createdAt: Date;
}

interface UserData {
  id: string;
  email: string;
  displayName: string;
  university: string;
  photoURL?: string;
  isRestricted: boolean;
  restrictionReason?: string;
  totalAttempts: number;
  averageScore: number;
  lastLoginAt?: Date;
  accessCategory?: string;
  papers?: string[];
  expiryDate?: Date;
}

interface UniversityRanking {
  university: string;
  totalStudents: number;
  averageScore: number;
  totalAttempts: number;
  topStudent: {
    name: string;
    score: number;
  };
  categories: {
    RN: number;
    RM: number;
    RPHN: number;
  };
}

export default function AdminDashboard() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'questions' | 'users' | 'rankings' | 'feedback' | 'universities'>('overview');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [rankings, setRankings] = useState<UniversityRanking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    averageScore: 0,
    activeUsers: 0,
    restrictedUsers: 0
  });

  // Check if user is admin
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadQuestions(),
        loadStats(),
        loadUniversityRankings()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Load user access data
      const accessQuery = query(collection(db, 'userAccess'), orderBy('createdAt', 'desc'));
      const accessSnapshot = await getDocs(accessQuery);
      
      // Load user profiles
      const profilesQuery = query(collection(db, 'users'));
      const profilesSnapshot = await getDocs(profilesQuery);
      
      const usersMap = new Map();
      
      // Map user profiles
      profilesSnapshot.docs.forEach(doc => {
        const profile = doc.data();
        usersMap.set(doc.id, {
          id: doc.id,
          email: profile.email,
          displayName: profile.displayName,
          university: profile.university || 'Unknown',
          photoURL: profile.photoURL,
          isRestricted: false,
          totalAttempts: 0,
          averageScore: 0
        });
      });
      
      // Add access data
      accessSnapshot.docs.forEach(doc => {
        const access = doc.data();
        const userId = doc.id;
        const user = usersMap.get(userId) || {};
        
        usersMap.set(userId, {
          ...user,
          id: userId,
          email: access.userEmail || user.email,
          displayName: access.userName || user.displayName,
          university: access.userUniversity || user.university,
          isRestricted: access.isRestricted || false,
          restrictionReason: access.restrictionReason,
          accessCategory: access.examCategory,
          papers: access.papers,
          expiryDate: access.expiryDate,
          lastLoginAt: access.lastLoginAt
        });
      });
      
      setUsers(Array.from(usersMap.values()));
      
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      const questionsQuery = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(questionsQuery);
      const questionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Load exam attempts for statistics
      const attemptsQuery = query(collection(db, 'examAttempts'));
      const attemptsSnapshot = await getDocs(attemptsQuery);
      
      let totalScore = 0;
      let totalAttempts = 0;
      const activeUserIds = new Set();
      
      attemptsSnapshot.docs.forEach(doc => {
        const attempt = doc.data();
        if (attempt.completed) {
          totalScore += attempt.score || 0;
          totalAttempts++;
          activeUserIds.add(attempt.userId);
        }
      });
      
      const avgScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
      const restrictedUsers = users.filter(u => u.isRestricted).length;
      
      setStats({
        totalUsers: users.length,
        totalQuestions: questions.length,
        totalAttempts,
        averageScore: avgScore,
        activeUsers: activeUserIds.size,
        restrictedUsers
      });
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUniversityRankings = async () => {
    try {
      const attemptsQuery = query(collection(db, 'examAttempts'), where('completed', '==', true));
      const snapshot = await getDocs(attemptsQuery);
      
      const universityData = new Map<string, {
        students: Set<string>;
        totalScore: number;
        totalAttempts: number;
        topScore: number;
        topStudent: string;
        categories: { RN: number; RM: number; RPHN: number };
      }>();
      
      snapshot.docs.forEach(doc => {
        const attempt = doc.data();
        const university = attempt.userUniversity || 'Unknown';
        
        if (!universityData.has(university)) {
          universityData.set(university, {
            students: new Set(),
            totalScore: 0,
            totalAttempts: 0,
            topScore: 0,
            topStudent: '',
            categories: { RN: 0, RM: 0, RPHN: 0 }
          });
        }
        
        const data = universityData.get(university)!;
        data.students.add(attempt.userId);
        data.totalScore += attempt.score || 0;
        data.totalAttempts++;
        data.categories[attempt.examCategory as keyof typeof data.categories]++;
        
        if ((attempt.score || 0) > data.topScore) {
          data.topScore = attempt.score || 0;
          data.topStudent = attempt.userName || 'Unknown';
        }
      });
      
      const rankings: UniversityRanking[] = Array.from(universityData.entries())
        .map(([university, data]) => ({
          university,
          totalStudents: data.students.size,
          averageScore: data.totalAttempts > 0 ? data.totalScore / data.totalAttempts : 0,
          totalAttempts: data.totalAttempts,
          topStudent: {
            name: data.topStudent,
            score: data.topScore
          },
          categories: data.categories
        }))
        .sort((a, b) => b.averageScore - a.averageScore);
      
      setRankings(rankings);
      
    } catch (error) {
      console.error('Error loading university rankings:', error);
    }
  };

  const handleQuestionsExtracted = (newQuestions: ParsedQuestion[], examId: string) => {
    const formattedQuestions: Question[] = newQuestions.map(q => ({
      ...q,
      category: q.category || examId,
      difficulty: q.difficulty || 'Intermediate',
      explanation: q.explanation || '',
      createdAt: new Date()
    }));
    
    setQuestions(prev => [...prev, ...formattedQuestions]);
    
    // Here you would save to Firestore
    console.log('New questions extracted for:', examId, formattedQuestions);
    alert(`Successfully extracted ${formattedQuestions.length} questions for ${examId}`);
  };

  const toggleUserRestriction = async (userId: string, restrict: boolean, reason?: string) => {
    try {
      await updateDoc(doc(db, 'userAccess', userId), {
        isRestricted: restrict,
        restrictionReason: reason || '',
        updatedAt: new Date()
      });
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, isRestricted: restrict, restrictionReason: reason }
          : user
      ));
      
      alert(`User ${restrict ? 'restricted' : 'unrestricted'} successfully`);
      
    } catch (error) {
      console.error('Error updating user restriction:', error);
      alert('Failed to update user restriction');
    }
  };

  const filteredUsers = users.filter(user => 
    (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.university?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCategory === 'all' || user.accessCategory === filterCategory)
  );

  const filteredQuestions = questions.filter(q => 
    q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You don't have permission to access the admin dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'upload', label: 'Upload Documents', icon: Upload },
    { id: 'questions', label: 'Manage Questions', icon: Database },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'rankings', label: 'University Rankings', icon: Award },
    { id: 'feedback', label: 'Feedback & Support', icon: MessageCircle },
    { id: 'universities', label: 'Universities', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive exam platform management
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm text-blue-600 font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm text-green-600 font-medium">Total Questions</p>
                    <p className="text-2xl font-bold text-green-900">{stats.totalQuestions}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm text-purple-600 font-medium">Total Attempts</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.totalAttempts}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm text-yellow-600 font-medium">Average Score</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.averageScore.toFixed(1)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <p className="text-sm text-indigo-600 font-medium">Active Users</p>
                    <p className="text-2xl font-bold text-indigo-900">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <UserX className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm text-red-600 font-medium">Restricted Users</p>
                    <p className="text-2xl font-bold text-red-900">{stats.restrictedUsers}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">System initialized with admin dashboard</span>
                  <span className="text-gray-400">Just now</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Question Documents
              </h2>
              <p className="text-gray-600">
                Upload DOCX files containing exam questions. The system will automatically extract and format questions.
              </p>
            </div>
            
            <DocumentUpload onQuestionsExtracted={handleQuestionsExtracted} />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  User Management
                </h2>
                <p className="text-gray-600">
                  Manage user access, restrictions, and permissions
                </p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="RN">RN</option>
                <option value="RM">RM</option>
                <option value="RPHN">RPHN</option>
              </select>
            </div>

            {/* Users List */}
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No users found
                  </h3>
                  <p className="text-gray-600">
                    No users match your search criteria.
                  </p>
                </div>
              ) : (
                filteredUsers.map((userData) => (
                  <div key={userData.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {userData.photoURL && (
                            <img 
                              src={userData.photoURL} 
                              alt={userData.displayName} 
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {userData.displayName || 'Unknown'}
                            </h4>
                            <p className="text-sm text-gray-600">{userData.email}</p>
                          </div>
                          {userData.isRestricted && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                              Restricted
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">University:</span>
                            <p className="font-medium">{userData.university}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <p className="font-medium">{userData.accessCategory || 'None'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Attempts:</span>
                            <p className="font-medium">{userData.totalAttempts}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Score:</span>
                            <p className="font-medium">{userData.averageScore.toFixed(1)}</p>
                          </div>
                        </div>
                        
                        {userData.isRestricted && userData.restrictionReason && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-800">
                            <strong>Restriction Reason:</strong> {userData.restrictionReason}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        {userData.isRestricted ? (
                          <Button
                            size="sm"
                            onClick={() => toggleUserRestriction(userData.id, false)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Unrestrict
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = prompt('Enter restriction reason:');
                              if (reason) toggleUserRestriction(userData.id, true, reason);
                            }}
                            className="text-red-600 hover:text-red-700 border-red-300"
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Restrict
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Rankings Tab */}
        {activeTab === 'rankings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                University Rankings
              </h2>
              <p className="text-gray-600">
                Performance rankings by university
              </p>
            </div>

            <div className="space-y-6">
              {rankings.map((ranking, index) => (
                <div key={ranking.university} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ranking.university}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {ranking.totalStudents} students • {ranking.totalAttempts} attempts
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {ranking.averageScore.toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-600">Average Score</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Top Student</h4>
                      <div className="flex items-center space-x-3">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">{ranking.topStudent.name}</p>
                          <p className="text-sm text-gray-600">Score: {ranking.topStudent.score}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Category Distribution</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>RN:</span>
                          <span className="font-medium">{ranking.categories.RN}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>RM:</span>
                          <span className="font-medium">{ranking.categories.RM}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>RPHN:</span>
                          <span className="font-medium">{ranking.categories.RPHN}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {rankings.length === 0 && (
                <div className="text-center py-12">
                  <School className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No rankings available
                  </h3>
                  <p className="text-gray-600">
                    Rankings will appear once students start taking exams.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Question Management
                </h2>
                <p className="text-gray-600">
                  View, edit, and manage all exam questions
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No questions found
                  </h3>
                  <p className="text-gray-600">
                    Upload documents to start adding questions to the database.
                  </p>
                </div>
              ) : (
                filteredQuestions.map((question) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {question.category}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                            {question.difficulty}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium mb-2">
                          {question.text}
                        </p>
                        <div className="text-sm text-gray-600">
                          <p>Options: {question.options.length}</p>
                          <p>Correct: {question.options[question.correctAnswer]}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Feedback & Support
                </h2>
                <p className="text-gray-600">
                  Manage user feedback and support requests
                </p>
              </div>
            </div>
            
            {/* Feedback Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Total Feedback</p>
                    <p className="text-2xl font-bold text-blue-900">0</p>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">0</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-900">0</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-purple-900">0.0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
              <div className="text-center py-12">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No feedback yet
                </h3>
                <p className="text-gray-600">
                  User feedback and support requests will appear here.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Universities Tab */}
        {activeTab === 'universities' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  University Management
                </h2>
                <p className="text-gray-600">
                  Manage university database and approve new additions
                </p>
              </div>
            </div>
            
            {/* University Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Total Universities</p>
                    <p className="text-2xl font-bold text-blue-900">0</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Verified</p>
                    <p className="text-2xl font-bold text-green-900">0</p>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-900">0</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Total Students</p>
                    <p className="text-2xl font-bold text-purple-900">0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* University List */}
            <div className="space-y-4">
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No universities yet
                </h3>
                <p className="text-gray-600">
                  University data will appear here as users register.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
