// src/components/feedback/FeedbackForm.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { feedbackManager } from "@/lib/feedback";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Star, Send, X, AlertTriangle } from "lucide-react";

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  examId?: string;
  initialType?:
    | "bug"
    | "feature"
    | "complaint"
    | "compliment"
    | "suggestion"
    | "other";
}

export function FeedbackForm({
  isOpen,
  onClose,
  examId,
  initialType = "other",
}: FeedbackFormProps) {
  const { user, userProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [formData, setFormData] = useState({
    type: initialType,
    category: "other" as const,
    subject: "",
    message: "",
  });

  const feedbackTypes = [
    {
      value: "bug",
      label: "Bug Report",
      description: "Something isn't working",
    },
    {
      value: "feature",
      label: "Feature Request",
      description: "Suggest a new feature",
    },
    {
      value: "complaint",
      label: "Complaint",
      description: "Report an issue or problem",
    },
    {
      value: "compliment",
      label: "Compliment",
      description: "Share positive feedback",
    },
    {
      value: "suggestion",
      label: "Suggestion",
      description: "General improvement idea",
    },
    { value: "other", label: "Other", description: "Something else" },
  ];

  const categories = [
    { value: "exam", label: "Exam & Questions" },
    { value: "payment", label: "Payment & Billing" },
    { value: "ui", label: "User Interface" },
    { value: "performance", label: "Performance" },
    { value: "content", label: "Content Quality" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      setError("Please sign in to submit feedback");
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      setError("Please fill in both subject and message fields");
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const feedbackId = await feedbackManager.submitFeedback({
        userId: user.uid,
        userEmail: user.email || "",
        userName: userProfile.displayName || user.email || "Anonymous",
        university: userProfile.university || "Not specified",
        type: formData.type as any,
        category: formData.category,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        rating: rating > 0 ? rating : undefined,
        examId,
      });

      console.log("Feedback submitted successfully:", feedbackId);
      setSubmitted(true);
      
      // Reset form and close after delay
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({
          type: initialType,
          category: "other",
          subject: "",
          message: "",
        });
        setRating(0);
        setError(null);
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      setError(error.message || "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
      setSubmitted(false);
      setError(null);
      setFormData({
        type: initialType,
        category: "other",
        subject: "",
        message: "",
      });
      setRating(0);
    }
  };

  if (submitted) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Feedback Submitted!
          </h3>
          <p className="text-gray-600">
            Thank you for your feedback. We'll review it and get back to you if
            needed.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Share Your Feedback">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate your overall experience?
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-colors"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </span>
            )}
          </div>
        </div>

        {/* Feedback Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What type of feedback is this?
          </label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as any })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {feedbackTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.description}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value as any })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            placeholder="Brief summary of your feedback"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            placeholder="Please provide detailed feedback..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* User Info Display */}
        {userProfile && (
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600">
              <div>
                <strong>Name:</strong>{" "}
                {userProfile.displayName || "Not provided"}
              </div>
              <div>
                <strong>Email:</strong> {user?.email}
              </div>
              <div>
                <strong>University:</strong>{" "}
                {userProfile.university || "Not specified"}
              </div>
              {examId && (
                <div>
                  <strong>Exam ID:</strong> {examId}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex items-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
