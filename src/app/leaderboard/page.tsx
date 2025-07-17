"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Sign In Required
            </h2>
            <p className="text-slate-600 mb-6">
              Please sign in to view the leaderboard and see how you stack up
              against other students.
            </p>
            <Button variant="primary" className="w-full">
              Sign In
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-blue-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              🏆 Leaderboard
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              See how you rank against other nursing students. Complete more
              exams to climb higher!
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Leaderboard currentUserId={user.uid} />
        </div>
      </main>
    </div>
  );
}
