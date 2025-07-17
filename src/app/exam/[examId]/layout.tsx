// src/app/exam/[examId]/layout.tsx
// This file acts as a wrapper for both the exam and results pages.
"use client";

import React, { ReactNode } from "react";
import { ExamProvider } from "@/components/exam/ExamProvider";

export default function ExamLayout({ children }: { children: ReactNode }) {
  return <ExamProvider>{children}</ExamProvider>;
}
