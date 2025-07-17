// --- 3. FILE: src/app/exam/[examId]/results/page.tsx ---
// This is the new, dedicated page for showing results.
"use client";

import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useExam } from "../layout"; // Use context from the parent

export default function ExamResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { questions, userAnswers, resetExam } = useExam();

  const correctAnswersCount = questions.reduce((acc, question, index) => {
    return userAnswers[index] === question.correctAnswer ? acc + 1 : acc;
  }, 0);
  const score = (correctAnswersCount / questions.length) * 100;

  const handleRestart = () => {
    resetExam();
    router.push(`/exam/${params.examId}`);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">Exam Results</h1>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800">
              Exam Completed!
            </h2>
            <p className="mt-2 text-slate-600">
              Here is your performance summary.
            </p>
            <div className="my-8">
              <div
                className={`text-6xl font-bold ${
                  score >= 70 ? "text-green-600" : "text-red-600"
                }`}
              >
                {score.toFixed(1)}%
              </div>
              <p className="text-slate-600 mt-2">
                You answered {correctAnswersCount} out of {questions.length}{" "}
                questions correctly.
              </p>
            </div>
            <Button onClick={handleRestart} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Take Exam Again
            </Button>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Review Your Answers</h3>
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6"
                >
                  <p className="font-semibold text-slate-800">
                    {index + 1}. {q.text}
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <p
                      className={`flex items-center gap-2 ${
                        userAnswers[index] === q.correctAnswer
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {userAnswers[index] === q.correctAnswer ? (
                        <CheckCircle size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Your Answer:{" "}
                      {userAnswers[index] !== null
                        ? q.options[userAnswers[index]!]
                        : "Not Answered"}
                    </p>
                    <p className="flex items-center gap-2 text-slate-700">
                      <CheckCircle size={16} className="text-green-600" />
                      Correct Answer: {q.options[q.correctAnswer]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
