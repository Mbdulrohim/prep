"use client";

import React, { useState } from "react";
// 1. Import useRouter from next/navigation
import { useRouter } from "next/navigation";
import { PreExamModal, StudentDetails } from "./PreExamModal";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Lock } from "lucide-react";

interface Exam {
  id: "rn" | "rm" | "rphn";
  title: string;
  fullName: string;
  description: string;
  available: boolean;
  subExams?: number; // Number of sub-exams
}

const exams: Exam[] = [
  {
    id: "rn",
    title: "Registered Nursing (RN)",
    fullName: "Registered Nursing Exam",
    description:
      "Prepare for the core competencies in professional nursing practice.",
    available: true,
    subExams: 3,
  },
  {
    id: "rm",
    title: "Registered Midwifery (RM)",
    fullName: "Registered Midwifery Exam",
    description:
      "Assess your knowledge in antenatal, intrapartum, and postnatal care.",
    available: false,
  },
  {
    id: "rphn",
    title: "Public Health Nursing (RPHN)",
    fullName: "Public Health Nursing Exam",
    description:
      "Test your skills in community health, disease prevention, and health promotion.",
    available: false,
  },
];

export function ExamSelector() {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showUnavailableToast, setShowUnavailableToast] =
    useState<boolean>(false);

  // 2. Initialize the router
  const router = useRouter();

  const handleExamClick = (exam: Exam) => {
    if (exam.available) {
      if (exam.id === "rn") {
        router.push("/exam/rn");
      } else {
        setSelectedExam(exam);
        setModalOpen(true);
      }
    } else {
      setShowUnavailableToast(true);
      setTimeout(() => setShowUnavailableToast(false), 3000);
    }
  };

  const handleStartExam = (studentDetails: StudentDetails) => {
    if (!selectedExam) return;

    console.log(`Navigating to exam for: ${selectedExam.title}`);
    console.log("Student Details:", studentDetails);

    // 3. This is the new navigation logic.
    // It replaces the old alert() with a command to change the page.
    router.push(`/exam/${selectedExam.id}`);
  };

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className={`bg-card border rounded-2xl p-8 flex flex-col transition-all duration-300 ${
              exam.available
                ? "border-border hover:border-primary hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
                : "border-border/60 bg-secondary"
            }`}
            onClick={() => handleExamClick(exam)} // Make the whole card clickable
          >
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-foreground">
                  {exam.title}
                </h3>
                <div
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    exam.available
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {exam.available ? "Available" : "Coming Soon"}
                </div>
              </div>
              <p className="text-muted-foreground text-sm h-12">
                {exam.description}
              </p>
            </div>
            <div className="mt-8">
              {/* The button is now more for visual indication, the whole card is the trigger */}
              <div
                className={`w-full inline-flex items-center justify-center rounded-lg text-sm font-semibold px-6 py-3 ${
                  exam.available
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {exam.available ? (
                  <>
                    Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Unavailable <Lock className="ml-2 h-4 w-4" />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showUnavailableToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-sm font-semibold py-3 px-6 rounded-lg shadow-2xl animate-in fade-in-0 slide-in-from-bottom-5">
          This assessment is not yet available.
        </div>
      )}

      {selectedExam && (
        <PreExamModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onStartExam={handleStartExam}
          examTitle={selectedExam.fullName}
        />
      )}
    </div>
  );
}
