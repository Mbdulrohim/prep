// src/components/feedback/FeedbackButton.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FeedbackForm } from "./FeedbackForm";
import { MessageSquare } from "lucide-react";

interface FeedbackButtonProps {
  variant?: "ghost" | "outline" | "primary" | "secondary";
  size?: "sm" | "default" | "lg";
  showText?: boolean;
  className?: string;
}

export function FeedbackButton({
  variant = "ghost",
  size = "default",
  showText = true,
  className = "",
}: FeedbackButtonProps) {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowFeedback(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <MessageSquare className="h-[18px] w-[18px]" />
        {showText && <span className="hidden sm:inline">Feedback</span>}
      </Button>

      <FeedbackForm
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </>
  );
}
