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

  // Filter the exams to show only those matching the current category
  const examsForCategory = allExams.filter(
    (exam) => exam.category.toLowerCase() === categoryId
  );

  const categoryTitle = categoryId === "rn" ? "Registered Nursing" : "Exams";

  const handleExamClick = (exam: ExamData) => {
    if (exam.available) {
      // Navigate to the specific exam, e.g., /exam/rn-mock-1
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
                className="bg-card border border-border rounded-2xl p-6 transition-all hover:border-primary hover:shadow-lg cursor-pointer"
                onClick={() => handleExamClick(exam)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-grow">
                    <h2 className="text-lg font-semibold text-foreground">
                      {exam.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {exam.description}
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                      <ProgressBar progress={0} />
                      <span className="text-sm font-semibold text-slate-600">
                        0%
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button className="!w-auto gap-2">
                      Start Exam
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
