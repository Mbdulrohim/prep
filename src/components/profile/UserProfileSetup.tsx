"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Award, User } from "lucide-react";

interface UserProfileSetupProps {
  initialName: string;
  initialUniversity: string | null;
  onSave: (name: string, university: string) => Promise<void>;
  isLoading: boolean;
}

export function UserProfileSetup({
  initialName,
  initialUniversity,
  onSave,
  isLoading,
}: UserProfileSetupProps) {
  const [name, setName] = useState(initialName);
  const [university, setUniversity] = useState(initialUniversity || "");
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim() || !university.trim()) {
      setError("Please provide both your full name and university.");
      return;
    }
    setError("");
    await onSave(name, university);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
      <div className="text-center">
        <div className="mx-auto bg-blue-100 p-4 rounded-full w-fit mb-4">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-slate-600">
          Welcome to PREP! Let&apos;s get your profile set up so we can
          personalize your experience.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Florence Nightingale"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="university"
            className="text-sm font-medium text-slate-700"
          >
            University / Institution
          </label>
          <input
            type="text"
            id="university"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Scutari College of Nursing"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg mt-6">
          {error}
        </p>
      )}

      <div className="mt-8">
        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save and Continue"}
        </Button>
      </div>
    </div>
  );
}
