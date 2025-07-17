"use client";

import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { allExams, ExamData } from "@/lib/examData"; // Import our data
import { Button } from "@/components/ui/Button";
import { ArrowRight, CheckCircle, PlayCircle } from "lucide-react";

// A small component to render the progress bar
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-slate-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();

  // Get the category ID from the URL (e.g., 'rn')
  const categoryId = params.categoryId;

  // Define the exam papers for each category
  const examsByCategory = {
    rn: [
      {
        id: "rn-paper-1",
        title: "RN Paper 1",
        description: "Comprehensive nursing fundamentals and clinical practice",
        questions: 250,
        duration: "2.5 hours",
        available: true,
        difficulty: "Intermediate" as const
      },
      {
        id: "rn-paper-2", 
        title: "RN Paper 2",
        description: "Advanced nursing practice and specialized care",
        questions: 250,
        duration: "2.5 hours",
        available: true,
        difficulty: "Intermediate" as const
      }
    ],
    rm: [
      {
        id: "rm-paper-1",
        title: "RM Paper 1", 
        description: "Midwifery fundamentals and maternal care",
        questions: 250,
        duration: "2.5 hours",
        available: false,
        difficulty: "Intermediate" as const
      },
      {
        id: "rm-paper-2",
        title: "RM Paper 2",
        description: "Advanced midwifery practice and neonatal care", 
        questions: 250,
        duration: "2.5 hours",
        available: false,
        difficulty: "Intermediate" as const
      }
    ],
    rphn: [
      {
        id: "rphn-paper-1",
        title: "RPHN Paper 1",
        description: "Public health fundamentals and community care",
        questions: 250,
        duration: "2.5 hours", 
        available: false,
        difficulty: "Intermediate" as const
      },
      {
        id: "rphn-paper-2",
        title: "RPHN Paper 2",
        description: "Advanced public health practice and epidemiology",
        questions: 250,
        duration: "2.5 hours",
        available: false,
        difficulty: "Intermediate" as const
      }
    ]
  };

  const examsForCategory = examsByCategory[categoryId as keyof typeof examsByCategory] || [];
  
  const categoryTitles = {
    rn: "Registered Nursing",
    rm: "Registered Midwifery", 
    rphn: "Public Health Nursing"
  };

  const categoryTitle = categoryTitles[categoryId as keyof typeof categoryTitles] || "Exams";

  const handleExamClick = (exam: typeof examsForCategory[0]) => {
    if (exam.available) {
      // Navigate to the specific exam, e.g., /exam/rn-paper-1
      router.push(`/exam/${exam.id}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900">
            {categoryTitle} Exams
          </h1>
          <p className="mt-2 text-slate-600">
            Select a mock exam below to begin or continue your progress.
          </p>

          <div className="mt-8 space-y-4">
            {examsForCategory.map((exam) => (
              <div
                key={exam.id}
                className={`bg-white border rounded-2xl p-6 transition-all ${
                  exam.available 
                    ? 'border-slate-200 hover:border-blue-300 hover:shadow-lg cursor-pointer' 
                    : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                }`}
                onClick={() => handleExamClick(exam)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className={`text-xl font-semibold ${exam.available ? 'text-slate-800' : 'text-gray-600'}`}>
                        {exam.title}
                      </h2>
                      {!exam.available && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mb-3 ${exam.available ? 'text-slate-600' : 'text-gray-500'}`}>
                      {exam.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${exam.available ? 'text-slate-700' : 'text-gray-500'}`}>
                          📝 {exam.questions} Questions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${exam.available ? 'text-slate-700' : 'text-gray-500'}`}>
                          ⏱️ {exam.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${exam.available ? 'text-blue-600' : 'text-gray-500'}`}>
                          📊 {exam.difficulty}
                        </span>
                      </div>
                    </div>
                    {exam.available && (
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex-grow bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                        <span className="text-sm font-semibold text-slate-600">
                          0% Complete
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {exam.available ? (
                      <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        Start Exam
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button disabled className="gap-2 bg-gray-300 cursor-not-allowed">
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
