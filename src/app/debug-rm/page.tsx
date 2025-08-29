// src/app/debug-rm/page.tsx
"use client";

import GrantRMAccess from "@/components/debug/GrantRMAccess";
import TestRMAccessSystem from "@/components/debug/TestRMAccessSystem";
import TestRMPaymentFlow from "@/components/debug/TestRMPaymentFlow";
import TestGuide from "@/components/debug/TestGuide";
import TestAdminAccess from "@/components/debug/TestAdminAccess";
import EnhancedRMExamEntry from "@/components/rm/EnhancedRMExamEntry";

export default function DebugRMPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          🧪 RM Access Debug & Testing Center
        </h1>
        
        <div className="space-y-8">
          {/* Admin Dashboard Link */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              👑 Phase 4: Admin Controls & Management
            </h2>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Enhanced RM Admin Dashboard
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Comprehensive admin controls for managing RM system, users, exams, and analytics.
                  Features user management, exam analytics, system settings, and more.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <a
                  href="/admin/rm-dashboard"
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span className="mr-2">👑</span>
                  Open Admin Dashboard
                </a>
                <button
                  onClick={() => {
                    console.log("🎯 Phase 4: Admin dashboard accessed");
                    alert("Phase 4 Admin Dashboard ready! Check /admin/rm-dashboard");
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Test Access
                </button>
              </div>
              
              {/* Admin Access Testing */}
              <div className="mt-6">
                <TestAdminAccess />
              </div>
            </div>
          </div>
          
          {/* Test Guide */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              📖 Complete Testing Guide
            </h2>
            <TestGuide />
          </div>
          
          {/* Phase 2 Testing Component */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              💳 Phase 2: Payment Flow Testing
            </h2>
            <TestRMPaymentFlow />
          </div>
          
          {/* Phase 3 Testing Component */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              🎯 Phase 3: Enhanced Exam Entry Testing
            </h2>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Enhanced RM Exam Entry Component
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Test the improved exam entry experience with access validation, previous attempts display, and enhanced UI.
                  Note: Use a real exam ID from your RM exams collection.
                </p>
              </div>
              
              <EnhancedRMExamEntry
                examId="rm_paper1_basic" // Default test exam ID
                onStartExam={() => {
                  console.log("🎯 Enhanced exam entry test: Starting exam");
                  alert("Enhanced exam entry test successful! Check console for details.");
                }}
              />
            </div>
          </div>
          
          {/* Phase 1 Testing Component */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              📋 Phase 1: Access System Integration Test
            </h2>
            <TestRMAccessSystem />
          </div>
          
          {/* Original Grant Access Component */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              🔧 Manual RM Access Management
            </h2>
            <GrantRMAccess />
          </div>
        </div>
      </div>
    </div>
  );
}
