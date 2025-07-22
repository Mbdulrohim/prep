"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Alert, useToast } from "@/components/ui/Alert";
import { DocumentUpload } from "@/components/admin/DocumentUpload";
import { AccessCodeManager } from "@/components/admin/AccessCodeManager";
import { ParsedQuestion } from "@/lib/documentParser";
import { examAttemptManager } from "@/lib/examAttempts";
import { db } from "@/lib/firebase";
import { feedbackManager, type Feedback } from "@/lib/feedback";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  doc,
  writeBatch,
  addDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
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
  Filter,
  Key,
} from "lucide-react";

// Admin access control
const ADMIN_EMAILS = [
  "doyextech@gmail.com",
  "ibrahimadekunle3030@gmail.com",
  "adekunleibrahim6060@gmail.com",
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
  const { showToast, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "exam-schedule"
    | "upload"
    | "questions"
    | "users"
    | "rankings"
    | "feedback"
    | "universities"
    | "access-codes"
  >("overview");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [rankings, setRankings] = useState<UniversityRanking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    averageScore: 0,
    activeUsers: 0,
    restrictedUsers: 0,
  });

  // Exam scheduling state
  const [examSchedules, setExamSchedules] = useState<{
    [examId: string]: {
      startDate: string;
      endDate: string;
      isScheduled: boolean;
    };
  }>({});
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  // Check if user is admin
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

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
        loadUniversityRankings(),
        loadFeedback(),
      ]);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Load user access data
      const accessQuery = query(
        collection(db, "userAccess"),
        orderBy("createdAt", "desc")
      );
      const accessSnapshot = await getDocs(accessQuery);

      // Load user profiles
      const profilesQuery = query(collection(db, "users"));
      const profilesSnapshot = await getDocs(profilesQuery);

      const usersMap = new Map();

      // Map user profiles
      profilesSnapshot.docs.forEach((doc) => {
        const profile = doc.data();
        usersMap.set(doc.id, {
          id: doc.id,
          email: profile.email,
          displayName: profile.displayName,
          university: profile.university || "Unknown",
          photoURL: profile.photoURL,
          isRestricted: false,
          totalAttempts: 0,
          averageScore: 0,
        });
      });

      // Add access data
      accessSnapshot.docs.forEach((doc) => {
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
          lastLoginAt: access.lastLoginAt,
        });
      });

      setUsers(Array.from(usersMap.values()));
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadQuestions = async () => {
    try {
      const questionsQuery = query(
        collection(db, "questions"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(questionsQuery);
      const questionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Question[];
      setQuestions(questionsData);
    } catch (error) {
      console.error("Error loading questions:", error);
    }
  };

  const loadStats = async () => {
    try {
      // Load exam attempts for statistics
      const attemptsQuery = query(collection(db, "examAttempts"));
      const attemptsSnapshot = await getDocs(attemptsQuery);

      let totalScore = 0;
      let totalAttempts = 0;
      const activeUserIds = new Set();

      attemptsSnapshot.docs.forEach((doc) => {
        const attempt = doc.data();
        if (attempt.completed) {
          totalScore += attempt.score || 0;
          totalAttempts++;
          activeUserIds.add(attempt.userId);
        }
      });

      const avgScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
      const restrictedUsers = users.filter((u) => u.isRestricted).length;

      setStats({
        totalUsers: users.length,
        totalQuestions: questions.length,
        totalAttempts,
        averageScore: avgScore,
        activeUsers: activeUserIds.size,
        restrictedUsers,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadUniversityRankings = async () => {
    try {
      const attemptsQuery = query(
        collection(db, "examAttempts"),
        where("completed", "==", true)
      );
      const snapshot = await getDocs(attemptsQuery);

      const universityData = new Map<
        string,
        {
          students: Set<string>;
          totalScore: number;
          totalAttempts: number;
          topScore: number;
          topStudent: string;
          categories: { RN: number; RM: number; RPHN: number };
        }
      >();

      snapshot.docs.forEach((doc) => {
        const attempt = doc.data();
        const university = attempt.userUniversity || "Unknown";

        if (!universityData.has(university)) {
          universityData.set(university, {
            students: new Set(),
            totalScore: 0,
            totalAttempts: 0,
            topScore: 0,
            topStudent: "",
            categories: { RN: 0, RM: 0, RPHN: 0 },
          });
        }

        const data = universityData.get(university)!;
        data.students.add(attempt.userId);
        data.totalScore += attempt.score || 0;
        data.totalAttempts++;
        data.categories[attempt.examCategory as keyof typeof data.categories]++;

        if ((attempt.score || 0) > data.topScore) {
          data.topScore = attempt.score || 0;
          data.topStudent = attempt.userName || "Unknown";
        }
      });

      const rankings: UniversityRanking[] = Array.from(universityData.entries())
        .map(([university, data]) => ({
          university,
          totalStudents: data.students.size,
          averageScore:
            data.totalAttempts > 0 ? data.totalScore / data.totalAttempts : 0,
          totalAttempts: data.totalAttempts,
          topStudent: {
            name: data.topStudent,
            score: data.topScore,
          },
          categories: data.categories,
        }))
        .sort((a, b) => b.averageScore - a.averageScore);

      setRankings(rankings);
    } catch (error) {
      console.error("Error loading university rankings:", error);
    }
  };

  const loadFeedback = async () => {
    try {
      const feedback = await feedbackManager.getAllFeedback();
      setFeedbackList(feedback);
    } catch (error) {
      console.error("Error loading feedback:", error);
    }
  };

  const handleQuestionsExtracted = async (
    newQuestions: ParsedQuestion[],
    examId: string
  ) => {
    try {
      const formattedQuestions: Question[] = newQuestions.map((q) => ({
        ...q,
        category: q.category || examId,
        difficulty: q.difficulty || "Intermediate",
        explanation: q.explanation || "",
        createdAt: new Date(),
      }));

      // Save questions to Firestore
      const batch = writeBatch(db);
      const questionsRef = collection(db, "questions");

      formattedQuestions.forEach((question) => {
        const docRef = doc(questionsRef, question.id);
        batch.set(docRef, {
          text: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          category: question.category,
          difficulty: question.difficulty,
          createdAt: question.createdAt,
          updatedAt: new Date(),
          examId: examId,
        });
      });

      await batch.commit();

      // Update local state
      setQuestions((prev) => [...prev, ...formattedQuestions]);

      console.log("Questions saved to database:", examId, formattedQuestions);
      alert(
        `Successfully saved ${formattedQuestions.length} questions to database for ${examId}`
      );

      // Refresh questions list
      await loadQuestions();
    } catch (error) {
      console.error("Error saving questions to database:", error);
      alert("Failed to save questions to database. Please try again.");
    }
  };

  // Question Management Functions
  const editQuestion = async (
    questionId: string,
    updatedQuestion: Partial<Question>
  ) => {
    try {
      await updateDoc(doc(db, "questions", questionId), {
        ...updatedQuestion,
        updatedAt: new Date(),
      });

      // Update local state
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, ...updatedQuestion } : q
        )
      );

      alert("Question updated successfully!");
    } catch (error) {
      console.error("Error updating question:", error);
      alert("Failed to update question. Please try again.");
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this question? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await updateDoc(doc(db, "questions", questionId), {
        deleted: true,
        deletedAt: new Date(),
      });

      // Remove from local state
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));

      alert("Question deleted successfully!");
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Failed to delete question. Please try again.");
    }
  };

  const addNewQuestion = async (
    questionData: Omit<Question, "id" | "createdAt">
  ) => {
    try {
      const docRef = await addDoc(collection(db, "questions"), {
        ...questionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newQuestion: Question = {
        id: docRef.id,
        ...questionData,
        createdAt: new Date(),
      };

      setQuestions((prev) => [newQuestion, ...prev]);
      alert("Question added successfully!");
    } catch (error) {
      console.error("Error adding question:", error);
      alert("Failed to add question. Please try again.");
    }
  };

  const toggleUserRestriction = async (
    userId: string,
    restrict: boolean,
    reason?: string
  ) => {
    try {
      await updateDoc(doc(db, "userAccess", userId), {
        isRestricted: restrict,
        restrictionReason: reason || "",
        updatedAt: new Date(),
      });

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, isRestricted: restrict, restrictionReason: reason }
            : user
        )
      );

      alert(`User ${restrict ? "restricted" : "unrestricted"} successfully`);
    } catch (error) {
      console.error("Error updating user restriction:", error);
      alert("Failed to update user restriction");
    }
  };

  const grantUserAccess = async (
    userId: string,
    planType: string = "full_access",
    daysValid: number = 90
  ) => {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysValid);

      // Get user data for userAccess record
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      await setDoc(doc(db, "userAccess", userId), {
        userId: userId,
        userEmail: userData.email || "",
        userName: userData.displayName || "",
        userUniversity: userData.university || "",
        examCategory: "ALL",
        papers: ["paper-1", "paper-2"],
        hasAccess: true,
        isActive: true,
        isRestricted: false,
        planType: planType,
        accessGrantedAt: new Date(),
        expiryDate: expiryDate,
        grantedBy: user?.uid,
        updatedAt: new Date(),
        createdAt: new Date(),
        attemptsMade: {},
        maxAttempts: 10,
        remainingAttempts: 10,
        accessCode: "ADMIN_GRANTED",
      });

      // Update local state
      setUsers((prev) =>
        prev.map((userData) =>
          userData.id === userId
            ? { ...userData, accessCategory: planType, expiryDate }
            : userData
        )
      );

      showToast({
        type: "success",
        title: "Access Granted",
        message: `Access granted successfully for ${daysValid} days`,
      });
    } catch (error) {
      console.error("Error granting user access:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to grant user access",
      });
    }
  };

  const revokeUserAccess = async (userId: string) => {
    try {
      await updateDoc(doc(db, "userAccess", userId), {
        hasAccess: false,
        planType: "",
        accessRevokedAt: new Date(),
        revokedBy: user?.uid,
        updatedAt: new Date(),
      });

      // Update local state
      setUsers((prev) =>
        prev.map((userData) =>
          userData.id === userId
            ? { ...userData, accessCategory: "", expiryDate: undefined }
            : userData
        )
      );

      alert("Access revoked successfully");
    } catch (error) {
      console.error("Error revoking user access:", error);
      alert("Failed to revoke user access");
    }
  };

  const handleScheduleExam = async (examId: string) => {
    if (!user?.uid) {
      console.error("No user authenticated");
      return;
    }

    console.log("Authenticated user:", { uid: user.uid, email: user.email });

    const schedule = examSchedules[examId];
    if (!schedule?.startDate) {
      alert("Please set the exam start date and time");
      return;
    }

    const startDate = new Date(schedule.startDate);

    if (startDate <= new Date()) {
      alert("Exam start time must be in the future");
      return;
    }

    setSchedulingLoading(true);
    try {
      const { examScheduleManager } = await import("@/lib/examSchedule");

      // Convert examId to proper format for exam schedule manager
      const examType = examId.includes("rn")
        ? "RN"
        : examId.includes("rm")
        ? "RM"
        : "RPHN";
      const paper = examId.includes("paper-2") ? "paper2" : "paper1";
      const scheduleId = `${examType}_${paper}`;

      console.log("Scheduling exam:", {
        examId,
        examType,
        paper,
        scheduleId,
        startDate,
      });

      // First initialize if doesn't exist
      await examScheduleManager.initializeDefaultSchedules();
      console.log("Default schedules initialized");

      // Then update with the scheduled date
      const updateResult = await examScheduleManager.updateSchedule(
        scheduleId,
        {
          scheduledDate: startDate,
          isActive: true,
          duration: 150, // 2.5 hours
          totalQuestions: 250,
        }
      );

      console.log("Schedule update result:", updateResult);

      // Update local state
      setExamSchedules((prev) => ({
        ...prev,
        [examId]: {
          ...prev[examId],
          isScheduled: true,
          endDate: new Date(startDate.getTime() + 150 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
        },
      }));

      showToast({
        type: "success",
        title: "Exam Scheduled",
        message: `${examId.toUpperCase()} has been scheduled for ${startDate.toLocaleString()}`,
      });

      console.log("Exam scheduled successfully");
    } catch (error) {
      console.error("Error scheduling exam:", error);
      console.error(
        "Error details:",
        error instanceof Error ? error.message : "Unknown error"
      );
      showToast({
        type: "error",
        title: "Scheduling Failed",
        message: `Failed to schedule exam: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setSchedulingLoading(false);
    }
  };

  // Special function for RN exams (2-day consecutive)
  const handleScheduleRNExam = async (examId: string) => {
    if (!user?.uid) {
      console.error("No user authenticated");
      return;
    }

    console.log("Authenticated user:", { uid: user.uid, email: user.email });

    const schedule = examSchedules[examId];
    if (!schedule?.startDate) {
      alert("Please set the exam start date and time for Day 1");
      return;
    }

    const day1StartDate = new Date(schedule.startDate);

    if (day1StartDate <= new Date()) {
      alert("Exam start time must be in the future");
      return;
    }

    // Calculate Day 2 (next day at same time)
    const day2StartDate = new Date(day1StartDate);
    day2StartDate.setDate(day2StartDate.getDate() + 1);

    setSchedulingLoading(true);
    try {
      const { examScheduleManager } = await import("@/lib/examSchedule");

      console.log("Scheduling RN exams (2 days):", {
        day1: day1StartDate,
        day2: day2StartDate,
      });

      // Initialize if needed
      await examScheduleManager.initializeDefaultSchedules();
      console.log("Default schedules initialized");

      // Schedule Day 1 (RN Paper 1)
      await examScheduleManager.updateSchedule("RN_paper1", {
        scheduledDate: day1StartDate,
        isActive: true,
        duration: 150,
        totalQuestions: 250,
      });

      // Schedule Day 2 (RN Paper 2)
      await examScheduleManager.updateSchedule("RN_paper2", {
        scheduledDate: day2StartDate,
        isActive: true,
        duration: 150,
        totalQuestions: 250,
      });

      console.log("Both RN papers scheduled successfully");

      // Update local state for both papers
      setExamSchedules((prev) => ({
        ...prev,
        "rn-paper-1": {
          ...prev["rn-paper-1"],
          isScheduled: true,
          endDate: new Date(day1StartDate.getTime() + 150 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
        },
        "rn-paper-2": {
          startDate: day2StartDate.toISOString().slice(0, 16),
          isScheduled: true,
          endDate: new Date(day2StartDate.getTime() + 150 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
        },
      }));

      showToast({
        type: "success",
        title: "RN Exam Scheduled",
        message: `Day 1: ${day1StartDate.toLocaleString()}\nDay 2: ${day2StartDate.toLocaleString()}`,
      });

      console.log("RN exams scheduled successfully (2 days)");
    } catch (error) {
      console.error("Error scheduling RN exam:", error);
      console.error(
        "Error details:",
        error instanceof Error ? error.message : "Unknown error"
      );
      showToast({
        type: "error",
        title: "Scheduling Failed",
        message: `Failed to schedule RN exam: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setSchedulingLoading(false);
    }
  };

  const handleScheduleInputChange = (
    examId: string,
    field: "startDate",
    value: string
  ) => {
    setExamSchedules((prev) => ({
      ...prev,
      [examId]: {
        ...prev[examId],
        [field]: value,
        isScheduled: false,
        // Auto-calculate end time (150 minutes later)
        endDate: value
          ? new Date(new Date(value).getTime() + 150 * 60 * 1000)
              .toISOString()
              .slice(0, 16)
          : "",
      },
    }));
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.university?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCategory === "all" || user.accessCategory === filterCategory)
  );

  const filteredQuestions = questions.filter(
    (q) =>
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
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "exam-schedule", label: "Exam Scheduling", icon: Calendar },
    { id: "upload", label: "Upload Documents", icon: Upload },
    { id: "questions", label: "Manage Questions", icon: Database },
    { id: "users", label: "User Management", icon: Users },
    { id: "access-codes", label: "Access Codes", icon: Key },
    { id: "rankings", label: "University Rankings", icon: Award },
    { id: "feedback", label: "Feedback & Support", icon: MessageCircle },
    { id: "universities", label: "Universities", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Crown className="w-8 h-8 text-yellow-500" />
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive exam platform management
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <span className="text-sm text-gray-500 px-3 py-1 bg-white rounded-lg border">
                  Welcome, {user?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex flex-wrap gap-2 sm:gap-0 sm:space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 bg-blue-50 sm:bg-transparent rounded-t-lg sm:rounded-none"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 sm:hover:bg-transparent rounded-lg sm:rounded-none"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm text-blue-600 font-medium">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {stats.totalUsers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm text-green-600 font-medium">
                        Total Questions
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {stats.totalQuestions}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm text-purple-600 font-medium">
                        Total Attempts
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {stats.totalAttempts}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <Award className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm text-yellow-600 font-medium">
                        Average Score
                      </p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {stats.averageScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-indigo-600" />
                    <div className="ml-4">
                      <p className="text-sm text-indigo-600 font-medium">
                        Active Users
                      </p>
                      <p className="text-2xl font-bold text-indigo-900">
                        {stats.activeUsers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <UserX className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm text-red-600 font-medium">
                        Restricted Users
                      </p>
                      <p className="text-2xl font-bold text-red-900">
                        {stats.restrictedUsers}
                      </p>
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
                    <span className="text-gray-600">
                      System initialized with admin dashboard
                    </span>
                    <span className="text-gray-400">Just now</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Exam Scheduling Tab */}
          {activeTab === "exam-schedule" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Exam Scheduling Management
                  </h2>
                  <p className="text-gray-600">
                    Set exam dates and manage availability for all exam
                    categories. Exams will remain unavailable until scheduled.
                  </p>
                </div>

                {/* Exam Schedule Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* RN Paper 1 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-blue-600">
                        RN Paper 1 (Day 1)
                      </h3>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                        {examSchedules["rn-paper-1"]?.isScheduled
                          ? "Scheduled"
                          : "Not Scheduled"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      250 Questions • 150 Minutes
                    </p>
                    <p className="text-xs text-blue-600 mb-4">
                      📅 Scheduling this will automatically set Paper 2 for the
                      next day
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date & Time (150 minutes duration)
                        </label>
                        <input
                          type="datetime-local"
                          value={examSchedules["rn-paper-1"]?.startDate || ""}
                          onChange={(e) =>
                            handleScheduleInputChange(
                              "rn-paper-1",
                              "startDate",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {examSchedules["rn-paper-1"]?.endDate && (
                          <p className="text-xs text-gray-600 mt-1">
                            Ends at:{" "}
                            {new Date(
                              examSchedules["rn-paper-1"].endDate
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleScheduleRNExam("rn-paper-1")}
                        disabled={schedulingLoading}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {schedulingLoading
                          ? "Scheduling Both Days..."
                          : "Schedule RN Exam (2 Days)"}
                      </button>
                    </div>
                  </div>

                  {/* RN Paper 2 */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-blue-600">
                        RN Paper 2 (Day 2)
                      </h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                        {examSchedules["rn-paper-2"]?.isScheduled
                          ? "Auto-Scheduled"
                          : "Pending Day 1"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      250 Questions • 150 Minutes
                    </p>
                    <p className="text-xs text-blue-600 mb-4">
                      📅 Automatically scheduled for the day after Paper 1
                    </p>

                    <div className="space-y-3 opacity-75">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Auto-calculated (Day 2 at same time)
                        </label>
                        <input
                          type="datetime-local"
                          value={examSchedules["rn-paper-2"]?.startDate || ""}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-100"
                        />
                        {examSchedules["rn-paper-2"]?.endDate && (
                          <p className="text-xs text-gray-600 mt-1">
                            Ends at:{" "}
                            {new Date(
                              examSchedules["rn-paper-2"].endDate
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <button
                        disabled
                        className="w-full bg-gray-400 text-white px-4 py-2 rounded text-sm cursor-not-allowed"
                      >
                        Automatically Scheduled with Paper 1
                      </button>
                    </div>
                  </div>

                  {/* RM Paper 1 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-green-600">
                        RM Paper 1
                      </h3>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                        Not Scheduled
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      250 Questions • 150 Minutes
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date & Time (150 minutes duration)
                        </label>
                        <input
                          type="datetime-local"
                          value={examSchedules["rm-paper-1"]?.startDate || ""}
                          onChange={(e) =>
                            handleScheduleInputChange(
                              "rm-paper-1",
                              "startDate",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        {examSchedules["rm-paper-1"]?.endDate && (
                          <p className="text-xs text-gray-600 mt-1">
                            Ends at:{" "}
                            {new Date(
                              examSchedules["rm-paper-1"].endDate
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleScheduleExam("rm-paper-1")}
                        disabled={schedulingLoading}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {schedulingLoading ? "Scheduling..." : "Schedule Exam"}
                      </button>
                    </div>
                  </div>

                  {/* RM Paper 2 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-green-600">
                        RM Paper 2
                      </h3>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                        Not Scheduled
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      250 Questions • 150 Minutes
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date & Time (150 minutes duration)
                        </label>
                        <input
                          type="datetime-local"
                          value={examSchedules["rm-paper-2"]?.startDate || ""}
                          onChange={(e) =>
                            handleScheduleInputChange(
                              "rm-paper-2",
                              "startDate",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        {examSchedules["rm-paper-2"]?.endDate && (
                          <p className="text-xs text-gray-600 mt-1">
                            Ends at:{" "}
                            {new Date(
                              examSchedules["rm-paper-2"].endDate
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleScheduleExam("rm-paper-2")}
                        disabled={schedulingLoading}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {schedulingLoading ? "Scheduling..." : "Schedule Exam"}
                      </button>
                    </div>
                  </div>

                  {/* RPHN Paper 1 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-purple-600">
                        RPHN Paper 1
                      </h3>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                        Not Scheduled
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      250 Questions • 150 Minutes
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date & Time (150 minutes duration)
                        </label>
                        <input
                          type="datetime-local"
                          value={examSchedules["rphn-paper-1"]?.startDate || ""}
                          onChange={(e) =>
                            handleScheduleInputChange(
                              "rphn-paper-1",
                              "startDate",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        {examSchedules["rphn-paper-1"]?.endDate && (
                          <p className="text-xs text-gray-600 mt-1">
                            Ends at:{" "}
                            {new Date(
                              examSchedules["rphn-paper-1"].endDate
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleScheduleExam("rphn-paper-1")}
                        disabled={schedulingLoading}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {schedulingLoading ? "Scheduling..." : "Schedule Exam"}
                      </button>
                    </div>
                  </div>

                  {/* RPHN Paper 2 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-purple-600">
                        RPHN Paper 2
                      </h3>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                        Not Scheduled
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      250 Questions • 150 Minutes
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date & Time (150 minutes duration)
                        </label>
                        <input
                          type="datetime-local"
                          value={examSchedules["rphn-paper-2"]?.startDate || ""}
                          onChange={(e) =>
                            handleScheduleInputChange(
                              "rphn-paper-2",
                              "startDate",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        {examSchedules["rphn-paper-2"]?.endDate && (
                          <p className="text-xs text-gray-600 mt-1">
                            Ends at:{" "}
                            {new Date(
                              examSchedules["rphn-paper-2"].endDate
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleScheduleExam("rphn-paper-2")}
                        disabled={schedulingLoading}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {schedulingLoading ? "Scheduling..." : "Schedule Exam"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Exam Scheduling Instructions:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Set the start date and time for each exam (150 minutes
                      duration)
                    </li>
                    <li>
                      • All exams have 250 questions and 150 minutes duration
                    </li>
                    <li>• Students cannot access unscheduled exams</li>
                    <li>
                      • Once scheduled, exams become available at the start time
                    </li>
                    <li>
                      • End time is automatically calculated (150 minutes after
                      start)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload Question Documents
                </h2>
                <p className="text-gray-600">
                  Upload DOCX files containing exam questions. The system will
                  automatically extract and format questions.
                </p>
              </div>

              <DocumentUpload onQuestionsExtracted={handleQuestionsExtracted} />
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
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
                    <div
                      key={userData.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
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
                                {userData.displayName || "Unknown"}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {userData.email}
                              </p>
                            </div>
                            {userData.isRestricted && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                Restricted
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">University:</span>
                              <p className="font-medium">
                                {userData.university}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Access:</span>
                              <p className="font-medium">
                                {userData.accessCategory ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                    {userData.accessCategory}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                    No Access
                                  </span>
                                )}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Expiry:</span>
                              <p className="font-medium">
                                {userData.expiryDate
                                  ? new Date(
                                      userData.expiryDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Attempts:</span>
                              <p className="font-medium">
                                {userData.totalAttempts}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Avg Score:</span>
                              <p className="font-medium">
                                {userData.averageScore.toFixed(1)}
                              </p>
                            </div>
                          </div>

                          {userData.isRestricted &&
                            userData.restrictionReason && (
                              <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-800">
                                <strong>Restriction Reason:</strong>{" "}
                                {userData.restrictionReason}
                              </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {/* Access Management */}
                          {userData.accessCategory ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revokeUserAccess(userData.id)}
                              className="text-orange-600 hover:text-orange-700 border-orange-300"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Revoke Access
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() =>
                                grantUserAccess(userData.id, "full_access", 90)
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Grant Access
                            </Button>
                          )}

                          {/* Restriction Management */}
                          {userData.isRestricted ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                toggleUserRestriction(userData.id, false)
                              }
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Unrestrict
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = prompt(
                                  "Enter restriction reason:"
                                );
                                if (reason)
                                  toggleUserRestriction(
                                    userData.id,
                                    true,
                                    reason
                                  );
                              }}
                              className="text-red-600 hover:text-red-700 border-red-300"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Restrict
                            </Button>
                          )}

                          {/* Extended Access Options */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const days = prompt(
                                "Grant access for how many days? (default: 90)"
                              );
                              const daysNumber = days ? parseInt(days) : 90;
                              if (daysNumber > 0) {
                                grantUserAccess(
                                  userData.id,
                                  "full_access",
                                  daysNumber
                                );
                              }
                            }}
                            className="text-purple-600 hover:text-purple-700 border-purple-300"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Custom Access
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Rankings Tab */}
          {activeTab === "rankings" && (
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
                  <div
                    key={ranking.university}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : index === 2
                              ? "bg-orange-500"
                              : "bg-blue-500"
                          }`}
                        >
                          {index === 0 ? (
                            <Crown className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {ranking.university}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {ranking.totalStudents} students •{" "}
                            {ranking.totalAttempts} attempts
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
                        <h4 className="font-medium text-gray-900 mb-2">
                          Top Student
                        </h4>
                        <div className="flex items-center space-x-3">
                          <Award className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="font-medium">
                              {ranking.topStudent.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Score: {ranking.topStudent.score}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Category Distribution
                        </h4>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>RN:</span>
                            <span className="font-medium">
                              {ranking.categories.RN}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>RM:</span>
                            <span className="font-medium">
                              {ranking.categories.RM}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>RPHN:</span>
                            <span className="font-medium">
                              {ranking.categories.RPHN}
                            </span>
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
          {activeTab === "questions" && (
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
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowAddQuestion(true)}
                >
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
                      Upload documents to start adding questions to the
                      database.
                    </p>
                  </div>
                ) : (
                  filteredQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
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
                            <p>
                              Correct:{" "}
                              {question.options[question.correctAnswer]}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingQuestion(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => deleteQuestion(question.id)}
                          >
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
          {activeTab === "feedback" && (
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
                      <p className="text-sm font-medium text-blue-600">
                        Total Feedback
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {feedbackList.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">New</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {feedbackList.filter((f) => f.status === "new").length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <UserCheck className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">
                        Resolved
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {
                          feedbackList.filter((f) => f.status === "resolved")
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">
                        Avg Rating
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {feedbackList.length > 0
                          ? (
                              feedbackList.reduce(
                                (sum, f) => sum + (f.rating || 0),
                                0
                              ) / feedbackList.length
                            ).toFixed(1)
                          : "0.0"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback List */}
              <div className="space-y-4">
                {feedbackList.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No feedback yet
                    </h3>
                    <p className="text-gray-600">
                      User feedback and support requests will appear here.
                    </p>
                  </div>
                ) : (
                  feedbackList.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-medium text-gray-900">
                              {feedback.userEmail || "Anonymous"}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                feedback.type === "bug"
                                  ? "bg-red-100 text-red-800"
                                  : feedback.type === "feature"
                                  ? "bg-blue-100 text-blue-800"
                                  : feedback.type === "suggestion"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : feedback.type === "complaint"
                                  ? "bg-red-100 text-red-800"
                                  : feedback.type === "compliment"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {feedback.type}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                feedback.status === "new"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : feedback.status === "in-review"
                                  ? "bg-blue-100 text-blue-800"
                                  : feedback.status === "resolved"
                                  ? "bg-green-100 text-green-800"
                                  : feedback.status === "dismissed"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {feedback.status}
                            </span>
                            {feedback.rating && (
                              <div className="flex items-center">
                                <span className="text-sm text-gray-500 mr-1">
                                  Rating:
                                </span>
                                <span className="text-sm font-medium">
                                  {feedback.rating}/5
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">
                            {feedback.message}
                          </p>
                          <div className="text-sm text-gray-500">
                            {feedback.createdAt?.toLocaleDateString()}{" "}
                            {feedback.createdAt?.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Universities Tab */}
          {activeTab === "universities" && (
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
                      <p className="text-sm font-medium text-blue-600">
                        Total Universities
                      </p>
                      <p className="text-2xl font-bold text-blue-900">0</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <UserCheck className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">
                        Verified
                      </p>
                      <p className="text-2xl font-bold text-green-900">0</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">
                        Pending Review
                      </p>
                      <p className="text-2xl font-bold text-yellow-900">0</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">
                        Total Students
                      </p>
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

          {/* Access Codes Tab */}
          {activeTab === "access-codes" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <AccessCodeManager createdBy={user?.email || "admin"} />
            </div>
          )}
        </div>
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          onSave={(updatedQuestion) => {
            editQuestion(editingQuestion.id, updatedQuestion);
            setEditingQuestion(null);
          }}
          onCancel={() => setEditingQuestion(null)}
        />
      )}

      {/* Add Question Modal */}
      {showAddQuestion && (
        <QuestionAddModal
          onSave={(questionData) => {
            addNewQuestion(questionData);
            setShowAddQuestion(false);
          }}
          onCancel={() => setShowAddQuestion(false)}
        />
      )}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

// Question Edit Modal Component
function QuestionEditModal({
  question,
  onSave,
  onCancel,
}: {
  question: Question;
  onSave: (question: Partial<Question>) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(question.text);
  const [options, setOptions] = useState(question.options);
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer);
  const [explanation, setExplanation] = useState(question.explanation || "");
  const [difficulty, setDifficulty] = useState(
    question.difficulty || "Intermediate"
  );

  const handleSave = () => {
    if (!text.trim() || options.some((opt) => !opt.trim())) {
      alert("Please fill in all fields");
      return;
    }

    onSave({
      text: text.trim(),
      options: options.map((opt) => opt.trim()),
      correctAnswer,
      explanation: explanation.trim(),
      difficulty,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Edit Question</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium w-8">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index] = e.target.value;
                      setOptions(newOptions);
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === index}
                    onChange={() => setCorrectAnswer(index)}
                    className="text-blue-600"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explanation (Optional)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Question Add Modal Component
function QuestionAddModal({
  onSave,
  onCancel,
}: {
  onSave: (question: Omit<Question, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [category, setCategory] = useState("rn-paper-1");

  const handleSave = () => {
    if (!text.trim() || options.some((opt) => !opt.trim())) {
      alert("Please fill in all fields");
      return;
    }

    onSave({
      text: text.trim(),
      options: options.map((opt) => opt.trim()),
      correctAnswer,
      explanation: explanation.trim(),
      difficulty,
      category,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Question</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter the question text..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium w-8">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index] = e.target.value;
                      setOptions(newOptions);
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === index}
                    onChange={() => setCorrectAnswer(index)}
                    className="text-blue-600"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rn-paper-1">RN Paper 1</option>
                  <option value="rn-paper-2">RN Paper 2</option>
                  <option value="rm-paper-1">RM Paper 1</option>
                  <option value="rm-paper-2">RM Paper 2</option>
                  <option value="rphn-paper-1">RPHN Paper 1</option>
                  <option value="rphn-paper-2">RPHN Paper 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explanation (Optional)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Provide an explanation for the correct answer..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Question
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
