// src/components/debug/TestGuide.tsx
"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  ArrowRight, 
  ExternalLink,
  Clipboard,
  Book,
  CreditCard,
  Users,
  Settings
} from "lucide-react";

export default function TestGuide() {
  const [copiedText, setCopiedText] = useState<string>("");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const testScenarios = [
    {
      title: "🚀 Complete Payment Flow",
      steps: [
        "1. Clear RM access using the button below",
        "2. Go to /rm page",
        "3. Click on any RM exam",
        "4. See improved access denied page",
        "5. Click 'Purchase RM Access'",
        "6. See enhanced payment page with progress indicators",
        "7. Click payment button and watch step indicators",
        "8. Complete payment on Flutterwave",
        "9. Return to see payment success",
        "10. Verify immediate access to all RM exams"
      ],
      expected: "Smooth flow with clear feedback at each step"
    },
    {
      title: "🔄 Error Recovery Testing",
      steps: [
        "1. Go to payment page",
        "2. Click 'Test Error Handling'",
        "3. See error display with recovery options",
        "4. Try 'Try Again' button",
        "5. Try 'Check if Already Paid' button",
        "6. Verify error handling works properly"
      ],
      expected: "Clear error messages with working recovery actions"
    },
    {
      title: "📱 Mobile Experience",
      steps: [
        "1. Open Chrome DevTools",
        "2. Switch to mobile view",
        "3. Test payment flow on mobile",
        "4. Check responsive design",
        "5. Verify buttons and loading states work"
      ],
      expected: "Mobile-optimized payment experience"
    },
    {
      title: "🔄 Cross-Tab Testing",
      steps: [
        "1. Open /rm page in Tab 1",
        "2. Open payment page in Tab 2",
        "3. Complete payment in Tab 2",
        "4. Check if Tab 1 automatically updates access",
        "5. Verify localStorage event works"
      ],
      expected: "Automatic access refresh across tabs"
    },
    {
      title: "🎯 Phase 3: Enhanced Exam Entry",
      steps: [
        "1. Ensure you have RM access (use buttons above)",
        "2. Go to any RM exam page (e.g., /rm/rm_paper1_basic)",
        "3. See the enhanced exam entry component",
        "4. Check access validation display",
        "5. View previous attempts (if any)",
        "6. Test the improved start exam flow",
        "7. Verify better error handling",
        "8. Check responsive design on mobile"
      ],
      expected: "Improved exam entry experience with better validation and UI"
    },
    {
      title: "👑 Phase 4: Admin Controls & Management",
      steps: [
        "1. Access admin dashboard at /admin/rm-dashboard",
        "2. Check admin access control (should work for admins only)",
        "3. Review overview stats and metrics",
        "4. Test user management features (grant/revoke access)",
        "5. Explore exam analytics and performance data",
        "6. Try search and filter functionality",
        "7. Test responsive design on different screens",
        "8. Verify real-time data updates"
      ],
      expected: "Comprehensive admin dashboard with full RM system management"
    }
  ];

  const urls = [
    { name: "RM Main Page", url: "/rm", icon: Book },
    { name: "RM Payment Page", url: "/rm/payment?examId=rm-paper-1", icon: CreditCard },
    { name: "RM Exam Page", url: "/rm/rm-paper-1", icon: ExternalLink },
    { name: "Admin Dashboard", url: "/admin/rm-dashboard", icon: Settings },
    { name: "Debug Page", url: "/debug-rm", icon: Settings },
    { name: "Dashboard RM", url: "/dashboard/rm", icon: Users }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📖 RM Testing Guide
      </h3>

      {/* Quick Navigation */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">🔗 Quick Navigation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {urls.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              <link.icon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{link.name}</span>
              <ExternalLink className="w-3 h-3 text-blue-500 ml-auto" />
            </a>
          ))}
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">🧪 Test Scenarios</h4>
        <div className="space-y-4">
          {testScenarios.map((scenario, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">{scenario.title}</h5>
              <div className="space-y-1 mb-3">
                {scenario.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <p className="text-sm text-green-800">
                  <strong>Expected:</strong> {scenario.expected}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Data */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">📊 Test Data</h4>
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>RM Package Price:</strong> ₦2,000
            </div>
            <div>
              <strong>Access Duration:</strong> 90 days
            </div>
            <div>
              <strong>Exam Category:</strong> RM
            </div>
            <div>
              <strong>Plan Type:</strong> rm_access
            </div>
          </div>
        </div>
      </div>

      {/* Console Commands */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3">💻 Console Test Commands</h4>
        <div className="space-y-2">
          {[
            {
              label: "Check RM Access",
              command: "console.log('RM Access:', await rmUserAccessManager.hasRMAccess(user.uid))"
            },
            {
              label: "Get Access Details", 
              command: "console.log('Details:', await rmUserAccessManager.getRMUserAccess(user.uid))"
            },
            {
              label: "Trigger Payment Success Event",
              command: "localStorage.setItem('rm_payment_success', Date.now().toString())"
            }
          ].map((cmd, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 rounded border">
              <code className="flex-1 text-xs text-gray-700">{cmd.command}</code>
              <button
                onClick={() => copyToClipboard(cmd.command, cmd.label)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded"
              >
                <Clipboard className="w-3 h-3" />
                {copiedText === cmd.label ? "Copied!" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Success Criteria */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">✅ Success Criteria</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Payment flow shows clear progress indicators</li>
          <li>• Error handling provides actionable recovery options</li>
          <li>• Access is granted immediately after payment</li>
          <li>• UI is responsive and professional-looking</li>
          <li>• Cross-tab refresh works correctly</li>
          <li>• All loading states provide proper feedback</li>
        </ul>
      </div>
    </div>
  );
}
