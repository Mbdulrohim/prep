"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { UserService } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";

export function TestDataButton() {
  const { user } = useAuth();

  const generateTestData = async () => {
    if (!user) return;

    // Create sample exam results
    const sampleResults = [
      {
        uid: user.uid,
        examType: "rn-paper-1" as const,
        score: 85,
        totalQuestions: 100,
        correctAnswers: 85,
        timeSpent: 3600, // 1 hour
        completedAt: new Date(),
        answers: {},
      },
      {
        uid: user.uid,
        examType: "rm" as const,
        score: 92,
        totalQuestions: 100,
        correctAnswers: 92,
        timeSpent: 3300, // 55 minutes
        completedAt: new Date(),
        answers: {},
      },
    ];

    try {
      for (const result of sampleResults) {
        await UserService.saveExamResult(result);
      }
      alert("Test data generated successfully!");
    } catch (error) {
      console.error("Error generating test data:", error);
      alert("Failed to generate test data");
    }
  };

  return (
    <Button onClick={generateTestData} variant="outline" className="text-sm">
      Generate Test Data
    </Button>
  );
}
