"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Award,
  GraduationCap,
  TrendingUp,
  User,
} from "lucide-react";
import { LeaderboardEntry } from "@/types/user";
import { UserService } from "@/services/userService";

interface LeaderboardProps {
  currentUserId?: string;
}

export function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await UserService.getLeaderboard(20);
      setLeaderboard(data);
    } catch (err) {
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="h-6 w-6 bg-slate-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-slate-600">{rank}</span>
          </div>
        );
    }
  };

  const getRankBgColor = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return "bg-blue-50 border-blue-200";
    }

    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200";
      default:
        return "bg-white border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Leaderboard
        </h2>
        <button
          onClick={loadLeaderboard}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No exam results yet</p>
          <p className="text-sm text-slate-500 mt-2">
            Be the first to complete an exam and claim the top spot!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.uid === currentUserId;

            return (
              <div
                key={entry.uid}
                className={`
                  flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200
                  ${getRankBgColor(rank, isCurrentUser)}
                  ${isCurrentUser ? "ring-2 ring-blue-200" : ""}
                `}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">{getRankIcon(rank)}</div>

                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      {entry.profilePicture ? (
                        <img
                          src={entry.profilePicture}
                          alt={entry.displayName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-slate-800">
                          {entry.displayName}
                          {isCurrentUser && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                              You
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <GraduationCap className="h-4 w-4 mr-1" />
                        <span>{entry.university}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-slate-800">
                    {entry.averageScore.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-500">
                    {entry.examsCompleted} exam
                    {entry.examsCompleted !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Showing top {leaderboard.length} performers
          </p>
        </div>
      )}
    </div>
  );
}
