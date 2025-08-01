"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  BookOpen,
  Calendar,
  Clock,
  Trophy,
  Target,
  AlertTriangle,
  BarChart,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExamAttempt } from "@/lib/examAttempts";

interface ExamHistoryProps {
  attempts: ExamAttempt[];
  loading: boolean;
  onRefresh?: () => void;
}

export function ExamHistory({ attempts, loading, onRefresh }: ExamHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  
  const displayAttempts = showAll ? attempts : attempts.slice(0, 5);
  
  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };
  
  const getScoreIcon = (percentage: number) => {
    if (percentage >= 70) return <Trophy className="h-4 w-4" />;
    if (percentage >= 50) return <Target className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };
  
  const getBgColor = (percentage: number) => {
    if (percentage >= 70) return "bg-green-100 text-green-600";
    if (percentage >= 50) return "bg-yellow-100 text-yellow-600";
    return "bg-red-100 text-red-600";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">My Exam History</h3>
          <div className="animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">My Exam History</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <BookOpen className="h-4 w-4" />
            <span>{attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'}</span>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="text-xs"
            >
              Refresh
            </Button>
          )}
        </div>
      </div>

      {attempts.length > 0 ? (
        <div className="space-y-4">
          {displayAttempts.map((attempt) => {
            // Safe date conversion handling Firestore timestamps
            let completedAt = null;
            if (attempt.endTime) {
              try {
                if (typeof attempt.endTime === 'object' && 'toDate' in attempt.endTime) {
                  // Firestore timestamp
                  completedAt = (attempt.endTime as any).toDate();
                } else {
                  // Regular date string/object
                  completedAt = new Date(attempt.endTime);
                }
                // Validate the date
                if (isNaN(completedAt.getTime())) {
                  completedAt = null;
                }
              } catch (error) {
                console.warn('Invalid date in exam attempt:', error);
                completedAt = null;
              }
            }
            
            const score = attempt.score || 0;
            const total = attempt.assignedQuestions?.length || 50;
            const percentage = attempt.percentage || 0;
            
            return (
              <div key={attempt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getBgColor(percentage)}`}>
                        {getScoreIcon(percentage)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {attempt.examCategory?.toUpperCase() || 'Exam'} - {attempt.paper?.replace('-', ' ').toUpperCase() || 'Paper 1'}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {completedAt && completedAt instanceof Date && !isNaN(completedAt.getTime()) 
                              ? format(completedAt, 'MMM dd, yyyy') 
                              : 'In Progress'
                            }
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {attempt.timeSpent ? `${Math.round(attempt.timeSpent / 60)}min` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(percentage)}`}>
                        {percentage}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {score}/{total}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <Link href={`/exam/${attempt.examId}/results?attempt=${attempt.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                        >
                          <BarChart className="h-3 w-3 mr-1" />
                          Results
                        </Button>
                      </Link>
                      {attempt.completed && (
                        <Link href={`/exam/${attempt.examId}/review?attempt=${attempt.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Score Progress</span>
                    <span>{score} correct out of {total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        percentage >= 70 ? 'bg-green-500' :
                        percentage >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {attempts.length > 5 && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Less' : `View All Attempts (${attempts.length})`}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No Exams Taken Yet
          </h4>
          <p className="text-gray-500 mb-4">
            Start your first exam to see your results and progress here.
          </p>
          <Link href="#available-exams">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Browse Available Exams
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
