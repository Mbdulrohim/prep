// --- 1. FILE: src/app/exam/[examId]/layout.tsx ---
// This new file acts as a wrapper for both the exam and results pages.
// It uses React Context to manage and share the exam's state.
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// --- Mock Data (would be fetched in a real app) ---
const mockQuestions = [
  {
    id: 1,
    text: "A patient is receiving a blood transfusion and develops chills, fever, and lower back pain. What is the nurse's priority action?",
    options: [
      "Administer an antihistamine.",
      "Stop the transfusion immediately.",
      "Slow the rate of the transfusion.",
      "Notify the physician.",
    ],
    correctAnswer: 1,
    explanation:
      "This is a classic sign of a transfusion reaction. The absolute first priority is to stop the transfusion to prevent further harm to the patient.",
  },
  {
    id: 2,
    text: "When caring for a patient with a new tracheostomy, which nursing action takes priority?",
    options: [
      "Performing tracheostomy care every shift",
      "Maintaining a patent airway",
      "Teaching the patient about self-care",
      "Monitoring for signs of infection",
    ],
    correctAnswer: 1,
    explanation:
      "According to ABCs (Airway, Breathing, Circulation), maintaining a patent airway is always the highest priority.",
  },
  {
    id: 3,
    text: "What is the primary purpose of administering furosemide (Lasix)?",
    options: [
      "To lower blood pressure",
      "To reduce potassium levels",
      "To treat edema by increasing urine output",
      "To prevent blood clots",
    ],
    correctAnswer: 2,
    explanation:
      "Furosemide is a loop diuretic whose primary action is to increase renal excretion of water and electrolytes, thereby reducing edema.",
  },
  {
    id: 4,
    text: "A nurse is preparing to administer insulin. Which site is the best for absorption?",
    options: ["Thigh", "Upper arm", "Abdomen", "Buttocks"],
    correctAnswer: 2,
    explanation:
      "The abdomen provides the fastest and most consistent absorption of insulin compared to other sites.",
  },
  {
    id: 5,
    text: "Which assessment finding would indicate a potential complication of immobility?",
    options: [
      "Increased muscle mass",
      "Bradycardia",
      "Reddened area on the sacrum",
      "Increased urinary output",
    ],
    correctAnswer: 2,
    explanation:
      "Prolonged pressure on bony prominences like the sacrum can lead to pressure ulcers, a common complication of immobility.",
  },
  {
    id: 6,
    text: "A patient with a history of heart failure is prescribed a low-sodium diet. Which meal choice indicates the patient understands the dietary restrictions?",
    options: [
      "Canned soup and crackers",
      "Grilled chicken with steamed vegetables",
      "A frozen TV dinner",
      "Ham and cheese sandwich",
    ],
    correctAnswer: 1,
    explanation:
      "Grilled chicken and steamed vegetables are naturally low in sodium. Canned, processed, and cured foods are typically very high in sodium.",
  },
  {
    id: 7,
    text: "What is the correct procedure for collecting a 24-hour urine specimen?",
    options: [
      "Discard the first voiding, then collect all urine for 24 hours.",
      "Collect all urine for 24 hours, including the first voiding.",
      "Collect one sample in the morning and one at night.",
      "Keep the collection container at room temperature.",
    ],
    correctAnswer: 0,
    explanation:
      "To ensure accuracy, the 24-hour collection period begins immediately after the patient's first void, which is discarded.",
  },
  {
    id: 8,
    text: "A nurse is teaching a patient about using an incentive spirometer. What is the most important instruction?",
    options: [
      "Exhale quickly into the device.",
      "Inhale slowly and deeply.",
      "Use the device once a day.",
      "Wash the device with soap and water after each use.",
    ],
    correctAnswer: 1,
    explanation:
      "The purpose of an incentive spirometer is to encourage slow, deep breaths to expand the lungs and prevent atelectasis.",
  },
  {
    id: 9,
    text: "Which of the following is a key symptom of hypoglycemia?",
    options: [
      "Fruity breath",
      "Increased thirst",
      "Diaphoresis and shakiness",
      "Kussmaul respirations",
    ],
    correctAnswer: 2,
    explanation:
      "Diaphoresis (sweating), shakiness, and confusion are classic signs of low blood sugar (hypoglycemia). Fruity breath and increased thirst are signs of hyperglycemia.",
  },
  {
    id: 10,
    text: "What is the most effective way for a nurse to prevent the spread of infection?",
    options: [
      "Wearing gloves for all patient contact.",
      "Placing all patients in isolation.",
      "Administering prophylactic antibiotics.",
      "Performing hand hygiene consistently.",
    ],
    correctAnswer: 3,
    explanation:
      "Consistent and proper hand hygiene is the single most effective measure to prevent the transmission of healthcare-associated infections.",
  },
];

// --- Context for State Management ---
type Question = (typeof mockQuestions)[0] & { flagged: boolean };
interface ExamContextType {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  userAnswers: (number | null)[];
  setUserAnswers: React.Dispatch<React.SetStateAction<(number | null)[]>>;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  resetExam: () => void;
}
const ExamContext = createContext<ExamContextType | undefined>(undefined);

export function useExam() {
  const context = useContext(ExamContext);
  if (!context) throw new Error("useExam must be used within an ExamProvider");
  return context;
}

export default function ExamLayout({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>(
    mockQuestions.map((q) => ({ ...q, flagged: false }))
  );
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60 * 60);

  const resetExam = () => {
    setQuestions(mockQuestions.map((q) => ({ ...q, flagged: false })));
    setUserAnswers(Array(questions.length).fill(null));
    setCurrentQuestionIndex(0);
    setTimeLeft(60 * 60);
  };

  const value = {
    questions,
    setQuestions,
    userAnswers,
    setUserAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    timeLeft,
    setTimeLeft,
    resetExam,
  };

  return (
    <ExamContext.Provider value={value}>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
        {children}
      </div>
    </ExamContext.Provider>
  );
}
