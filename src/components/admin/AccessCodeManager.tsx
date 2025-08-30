// src/components/admin/AccessCodeManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Plus, Copy, Trash2, Download } from "lucide-react";

interface AccessCode {
  id: string;
  code: string;
  type: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  examAccess: {
    paper1: boolean;
    paper2: boolean;
    attempts: number;
    expiryDate?: string;
  };
  metadata?: {
    batchId?: string;
    generatedBy?: string;
    description?: string;
  };
  createdAt: string;
}

interface AccessCodeStats {
  total: number;
  used: number;
  active: number;
  usageRate: number;
}

const AccessCodeManager: React.FC = () => {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [stats, setStats] = useState<AccessCodeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    count: 10,
    description: "",
  });

  useEffect(() => {
    fetchStats();
    fetchCodes();
  }, [filter]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/access-codes?action=stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/access-codes?filter=${filter}&limit=50`
      );
      const data = await response.json();
      if (data.success) {
        setCodes(data.codes);
      }
    } catch (error) {
      console.error("Failed to fetch codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          count: generateForm.count,
          description: generateForm.description,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Generated ${data.codes.length} access codes`);
        setIsModalOpen(false);
        fetchStats();
        fetchCodes();
        setGenerateForm({ count: 10, description: "" });
      } else {
        alert(data.error || "Failed to generate codes");
      }
    } catch (error) {
      console.error("Failed to generate codes:", error);
      alert("Failed to generate access codes");
    } finally {
      setLoading(false);
    }
  };

  const deleteCode = async (codeId: string) => {
    if (!confirm("Are you sure you want to delete this access code?")) return;

    try {
      const response = await fetch(`/api/admin/access-codes?id=${codeId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        alert("Access code deleted");
        fetchStats();
        fetchCodes();
      } else {
        alert(data.error || "Failed to delete code");
      }
    } catch (error) {
      console.error("Failed to delete code:", error);
      alert("Failed to delete access code");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard");
  };

  const exportCodes = () => {
    const csvContent = [
      "Code,Type,Status,Created,Used At,User",
      ...codes.map((code) =>
        [
          code.code,
          code.type,
          code.isUsed ? "Used" : "Active",
          new Date(code.createdAt).toLocaleDateString(),
          code.usedAt ? new Date(code.usedAt).toLocaleDateString() : "",
          code.usedBy || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `access-codes-${filter}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Access Code Management</h1>
          <p className="text-gray-600">
            Generate and manage RM exam access codes
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={exportCodes} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Generate Codes
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Codes</h3>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Active Codes</h3>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Used Codes</h3>
            <div className="text-2xl font-bold text-blue-600">{stats.used}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Usage Rate</h3>
            <div className="text-2xl font-bold">{stats.usageRate}%</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Codes</option>
          <option value="unused">Active Codes</option>
          <option value="used">Used Codes</option>
        </select>
      </div>

      {/* Access Codes Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Access Codes</h2>
          <p className="text-gray-600">
            Manage RM exam access codes. Each code provides 3 attempts for both
            Paper 1 and Paper 2.
          </p>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <code className="font-mono font-bold text-lg">
                        {code.code}
                      </code>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          code.isUsed
                            ? "bg-gray-100 text-gray-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {code.isUsed ? "Used" : "Active"}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {code.examAccess.attempts} attempts
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Created: {new Date(code.createdAt).toLocaleDateString()}
                      {code.usedAt && (
                        <span>
                          {" "}
                          • Used: {new Date(code.usedAt).toLocaleDateString()}
                        </span>
                      )}
                      {code.metadata?.description && (
                        <span> • {code.metadata.description}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(code.code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>

                    {!code.isUsed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCode(code.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {codes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No access codes found for the selected filter.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Access Codes"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Number of Codes
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={generateForm.count}
              onChange={(e) =>
                setGenerateForm((prev) => ({
                  ...prev,
                  count: parseInt(e.target.value) || 1,
                }))
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="Batch description..."
              value={generateForm.description}
              onChange={(e) =>
                setGenerateForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>
          <Button onClick={generateCodes} disabled={loading} className="w-full">
            {loading ? "Generating..." : `Generate ${generateForm.count} Codes`}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AccessCodeManager;
