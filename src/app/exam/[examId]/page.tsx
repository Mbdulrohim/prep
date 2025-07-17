// --- 2. FILE: src/app/exam/[examId]/page.tsx ---
// This file is now ONLY the exam-taking interface.
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, Flag, Clock, BookOpen } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useExam } from "./layout"; // Use the context from the parent layout

function getExamTitle(examId: string | string[] | undefined) {
  switch (examId) {
    case "rn":
      return "Registered Nursing (RN) Mock Exam";
    case "rm":
      return "Registered Midwifery (RM) Mock Exam";
    case "rphn":
      return "Public Health Nursing (RPHN) Mock Exam";
    default:
      return "Mock Exam";
  }
}

export default function ExamInterfacePage() {
  const router = useRouter();
  const params = useParams();
  const {
    questions,
    setQuestions,
    userAnswers,
    setUserAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    timeLeft,
    setTimeLeft,
  } = useExam();

  const examId = params.examId;
  const examTitle = getExamTitle(examId);
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (timeLeft <= 0) {
      router.push(`/exam/${examId}/results`);
    }
    const timerId = setInterval(
      () => setTimeLeft((prev) => Math.max(0, prev - 1)),
      1000
    );
    return () => clearInterval(timerId);
  }, [timeLeft, router, examId, setTimeLeft]);

  const handleSelectAnswer = (index: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = index;
    setUserAnswers(newAnswers);
  };

  const navigateQuestion = (direction: "next" | "prev") => {
    if (direction === "next" && currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === "prev" && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const toggleFlag = () => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].flagged =
      !updatedQuestions[currentQuestionIndex].flagged;
    setQuestions(updatedQuestions);
  };

  const handleSubmit = () => {
    router.push(`/exam/${examId}/results`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 border-b border-slate-200 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{examTitle}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center text-sm text-slate-600">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        ((currentQuestionIndex + 1) / totalQuestions) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center px-3 py-1.5 rounded-lg ${
                  timeLeft < 300
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-mono font-bold">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Button
                onClick={toggleFlag}
                variant={currentQuestion.flagged ? "primary" : "outline"}
                className="!px-3 !py-2"
              >
                <Flag
                  className={`h-5 w-5 ${
                    currentQuestion.flagged ? "text-white" : "text-blue-600"
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-lg font-semibold text-slate-800 flex-grow">
                {currentQuestion.text}
              </h2>
              <div className="mt-6 space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      userAnswers[currentQuestionIndex] === index
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                          userAnswers[currentQuestionIndex] === index
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <p className="text-slate-700">{option}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
            <Button
              onClick={() => navigateQuestion("prev")}
              variant="outline"
              disabled={currentQuestionIndex === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Previous
            </Button>
            <div className="flex gap-3">
              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  onClick={() => navigateQuestion("next")}
                  variant="primary"
                  className="gap-2"
                >
                  <ArrowRight className="h-5 w-5" />
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  variant="primary"
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                >
                  Submit Exam
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 bg-white/80 border-t border-slate-200 py-4 shadow-lg backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto pb-2 space-x-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  currentQuestionIndex === index
                    ? "bg-blue-600 text-white scale-110 shadow-lg"
                    : q.flagged
                    ? "bg-red-100 text-red-700"
                    : userAnswers[index] !== null
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
