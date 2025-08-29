// src/components/debug/TestAdminAccess.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shield, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export default function TestAdminAccess() {
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState("");

  const adminEmails = [
    "admin@prep.com",
    "mbdulrohim@gmail.com",
  ];

  const checkAdminAccess = (email: string) => {
    return adminEmails.includes(email) || email.includes("admin");
  };

  const currentUserIsAdmin = user?.email ? checkAdminAccess(user.email) : false;
  const testEmailIsAdmin = testEmail ? checkAdminAccess(testEmail) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Shield className="h-5 w-5 text-purple-600 mr-2" />
        Admin Access Testing
      </h3>

      {/* Current User Status */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-2">Current User Access</h4>
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex-grow">
            <p className="text-sm font-medium text-gray-900">
              {user?.email || "Not logged in"}
            </p>
            <p className="text-xs text-gray-500">
              {user ? "Authenticated user" : "Please log in to test admin access"}
            </p>
          </div>
          <div className="flex items-center ml-3">
            {user ? (
              currentUserIsAdmin ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Admin</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">No Access</span>
                </div>
              )
            ) : (
              <div className="flex items-center text-gray-400">
                <XCircle className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Not Logged In</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Email Access */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-2">Test Email Access</h4>
        <div className="flex space-x-2">
          <input
            type="email"
            placeholder="Enter email to test admin access..."
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
          <button
            onClick={() => setTestEmail("")}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
          >
            Clear
          </button>
        </div>
        
        {testEmail && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{testEmail}</span>
              <div className="flex items-center">
                {testEmailIsAdmin ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Would have admin access</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Would be denied access</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Email List */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-2">Authorized Admin Emails</h4>
        <div className="space-y-2">
          {adminEmails.map((email) => (
            <div key={email} className="flex items-center p-2 bg-green-50 rounded text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-green-800">{email}</span>
            </div>
          ))}
          <div className="flex items-center p-2 bg-blue-50 rounded text-sm">
            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-blue-800">*admin* (any email containing "admin")</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <a
          href="/admin/rm-dashboard"
          target="_blank"
          className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Test Admin Dashboard Access
        </a>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={() => setTestEmail("admin@prep.com")}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Test Admin Email
          </button>
          <button
            onClick={() => setTestEmail("user@example.com")}
            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Test Regular User
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h5 className="font-medium text-yellow-800 mb-2">Testing Instructions</h5>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Only authorized admin emails can access the admin dashboard</li>
          <li>• Emails containing "admin" are automatically granted access</li>
          <li>• Regular users will see an access denied page</li>
          <li>• Update admin email list in /admin/rm-dashboard/page.tsx</li>
        </ul>
      </div>
    </div>
  );
}
