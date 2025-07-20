// src/components/admin/AccessCodeManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { accessCodeManager, AccessCode } from "@/lib/accessCodes";
import {
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface AccessCodeManagerProps {
  createdBy?: string;
}

export const AccessCodeManager: React.FC<AccessCodeManagerProps> = ({
  createdBy = "admin",
}) => {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [newlyCreatedCode, setNewlyCreatedCode] = useState<AccessCode | null>(
    null
  );

  // Form state for creating new codes
  const [formData, setFormData] = useState({
    examCategory: "RN" as "RN" | "RM" | "RPHN" | "ALL",
    papers: [] as string[],
    validFor: 90,
    maxUses: 1,
    description: "",
  });

  const paperOptions = {
    RN: ["Paper 1", "Paper 2"],
    RM: ["Paper 1", "Paper 2"],
    RPHN: ["Paper 1", "Paper 2"],
    ALL: [
      "RN Paper 1",
      "RN Paper 2",
      "RM Paper 1",
      "RM Paper 2",
      "RPHN Paper 1",
      "RPHN Paper 2",
    ],
  };

  useEffect(() => {
    loadAccessCodes();
  }, []);

  const loadAccessCodes = async () => {
    setLoading(true);
    try {
      const codes = await accessCodeManager.getAllAccessCodes();
      setAccessCodes(codes);
    } catch (error) {
      console.error("Error loading access codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async () => {
    try {
      const selectedPapers =
        formData.papers.length > 0
          ? formData.papers
          : paperOptions[formData.examCategory];

      const newCode = await accessCodeManager.createAccessCode(
        formData.examCategory,
        selectedPapers,
        formData.validFor,
        formData.maxUses,
        formData.description,
        createdBy
      );

      setNewlyCreatedCode(newCode);
      setShowCreateModal(false);
      setShowCodeModal(true);
      await loadAccessCodes();

      // Reset form
      setFormData({
        examCategory: "RN",
        papers: [],
        validFor: 90,
        maxUses: 1,
        description: "",
      });
    } catch (error) {
      console.error("Error creating access code:", error);
      alert("Failed to create access code");
    }
  };

  const handleDeactivateCode = async (codeId: string) => {
    if (!confirm("Are you sure you want to deactivate this access code?"))
      return;

    try {
      await accessCodeManager.deactivateAccessCode(codeId);
      await loadAccessCodes();
      alert("Access code deactivated successfully");
    } catch (error) {
      console.error("Error deactivating access code:", error);
      alert("Failed to deactivate access code");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Code copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatDate = (date: Date | any) => {
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiresAt: Date | any) => {
    const expiryDate = expiresAt?.toDate
      ? expiresAt.toDate()
      : new Date(expiresAt);
    return new Date() > expiryDate;
  };

  const getStatusColor = (code: AccessCode) => {
    if (!code.isActive) return "text-gray-500";
    if (isExpired(code.expiresAt)) return "text-red-500";
    if (code.currentUses >= code.maxUses) return "text-orange-500";
    return "text-green-500";
  };

  const getStatusText = (code: AccessCode) => {
    if (!code.isActive) return "Deactivated";
    if (isExpired(code.expiresAt)) return "Expired";
    if (code.currentUses >= code.maxUses) return "Used Up";
    return "Active";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Access Code Management
          </h3>
          <p className="text-gray-600">
            Create and manage access codes for exam access
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Access Code
        </Button>
      </div>

      {/* Access Codes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading access codes...</p>
          </div>
        ) : accessCodes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No access codes yet
            </h3>
            <p className="text-gray-600">
              Create your first access code to get started
            </p>
          </div>
        ) : (
          accessCodes.map((code) => (
            <div
              key={code.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-lg font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                      {code.code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(code.code)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <span
                      className={`flex items-center gap-1 text-sm font-medium ${getStatusColor(
                        code
                      )}`}
                    >
                      {code.isActive &&
                      !isExpired(code.expiresAt) &&
                      code.currentUses < code.maxUses ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {getStatusText(code)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <p className="font-medium">{code.examCategory}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Usage:</span>
                      <p className="font-medium">
                        {code.currentUses}/{code.maxUses}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Valid for:</span>
                      <p className="font-medium">{code.validFor} days</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Expires:</span>
                      <p className="font-medium">
                        {formatDate(code.expiresAt)}
                      </p>
                    </div>
                  </div>

                  {code.description && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">
                        Description:
                      </span>
                      <p className="text-gray-700">{code.description}</p>
                    </div>
                  )}

                  <div className="mt-2">
                    <span className="text-gray-500 text-sm">Papers:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {code.papers.map((paper, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {paper}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {code.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeactivateCode(code.id)}
                      className="text-red-600 hover:text-red-700 border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Code Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Access Code"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Category
            </label>
            <select
              value={formData.examCategory}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  examCategory: e.target.value as any,
                  papers: [],
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="RN">Registered Nurse (RN)</option>
              <option value="RM">Registered Midwife (RM)</option>
              <option value="RPHN">
                Registered Public Health Nurse (RPHN)
              </option>
              <option value="ALL">All Categories</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Papers (optional - defaults to all papers for category)
            </label>
            <div className="space-y-2">
              {paperOptions[formData.examCategory].map((paper) => (
                <label key={paper} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.papers.includes(paper)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          papers: [...formData.papers, paper],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          papers: formData.papers.filter((p) => p !== paper),
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  {paper}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid for (days)
              </label>
              <input
                type="number"
                value={formData.validFor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    validFor: parseInt(e.target.value) || 90,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="365"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Uses
              </label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxUses: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Brief description of this access code..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreateCode} className="flex-1">
              Create Access Code
            </Button>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Show Created Code Modal */}
      <Modal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        title="Access Code Created Successfully!"
      >
        {newlyCreatedCode && (
          <div className="text-center space-y-4">
            <div className="p-6 bg-green-50 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Your access code is ready!
              </p>
              <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                <code className="text-2xl font-mono font-bold text-green-600">
                  {newlyCreatedCode.code}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(newlyCreatedCode.code)}
                className="mt-3 text-green-600 hover:text-green-700 flex items-center gap-1 mx-auto"
              >
                <Copy className="h-4 w-4" />
                Copy to clipboard
              </button>
            </div>

            <div className="text-left bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Code Details:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Category: {newlyCreatedCode.examCategory}</li>
                <li>• Max uses: {newlyCreatedCode.maxUses}</li>
                <li>• Valid for: {newlyCreatedCode.validFor} days</li>
                <li>• Expires: {formatDate(newlyCreatedCode.expiresAt)}</li>
              </ul>
            </div>

            <Button onClick={() => setShowCodeModal(false)} className="w-full">
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
