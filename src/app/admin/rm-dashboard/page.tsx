// src/app/admin/rm-dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AccessCodeManager from "@/components/admin/AccessCodeManager";
import { Loader2, Shield, AlertTriangle, Key, BarChart3, BookOpen, CreditCard, Settings } from "lucide-react";

export default function RMAdminDashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user, userProfile]);

  const checkAdminAccess = async () => {
    try {
      // Check if user is logged in
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Check admin access
      // For now, we'll check if user email contains "admin" or is in a whitelist
      const adminEmails = [
        "admin@prep.com",
        "mbdulrohim@gmail.com", // Add your admin email here
        // Add more admin emails as needed
      ];

      const isAdmin = adminEmails.includes(user.email || "") || 
                     (user.email && user.email.includes("admin"));

      if (!isAdmin) {
        setHasAdminAccess(false);
        setLoading(false);
        return;
      }

      setHasAdminAccess(true);
      setLoading(false);
    } catch (error) {
      console.error("Error checking admin access:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking Access</h2>
          <p className="text-gray-600">Verifying administrative privileges...</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have administrative privileges to access this page. Only authorized administrators can view the RM admin dashboard.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push("/")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Back to Home
              </button>
              
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <Shield className="h-4 w-4 inline mr-1" />
                Current user: {user?.email || "Not logged in"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RM Admin Control System</h1>
                <p className="text-sm text-gray-600">Complete management for Registered Midwife examinations</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                PostgreSQL Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <AccessCodeManager />
      </div>
    </div>
  );
}
