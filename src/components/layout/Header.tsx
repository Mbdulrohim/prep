"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { LogIn, LogOut, User as UserIcon, Menu, X, Trophy, MessageSquare } from "lucide-react";

export function Header() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo with improved typography */}
        <Link
          href="/"
          className="text-2xl font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center"
        >
          <span className="bg-gradient-to-r from-blue-600 to-indigo-700 text-transparent bg-clip-text">
            PREP
          </span>
          <span className="text-blue-600">.</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="flex space-x-3">
              <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-100 rounded-full animate-pulse"></div>
            </div>
          ) : user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="flex items-center gap-2">
                  <UserIcon className="h-[18px] w-[18px]" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Trophy className="h-[18px] w-[18px]" />
                  <span className="hidden sm:inline">Leaderboard</span>
                </Button>
              </Link>
              <FeedbackButton variant="ghost" />
              <Button
                onClick={logout}
                variant="outline"
                className="flex items-center gap-2 border-gray-300"
              >
                <LogOut className="h-[18px] w-[18px]" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="h-10 w-10 rounded-full border-2 border-blue-100 object-cover"
                />
              )}
            </>
          ) : (
            <Button
              onClick={signInWithGoogle}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md transition-all"
            >
              <LogIn className="h-[18px] w-[18px] mr-2" />
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t py-4 px-4 shadow-inner">
          <div className="flex flex-col space-y-3">
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              </div>
            ) : user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full flex justify-center items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/leaderboard" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full flex justify-center items-center gap-2"
                  >
                    <Trophy className="h-5 w-5" />
                    Leaderboard
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full flex justify-center items-center gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={signInWithGoogle}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Sign In with Google
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
