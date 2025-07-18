"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { aiHelper } from "@/lib/aiHelper";
import {
  Brain,
  Lightbulb,
  BookOpen,
  Target,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  topics: string[];
}

interface AIHelpModalProps {
  question: Question;
  userAnswer: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AIHelpModal({ question, userAnswer, isOpen, onClose }: AIHelpModalProps) {
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getAIHelp = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await aiHelper.getHelpForMissedQuestion({
        questionText: question.text,
        correctAnswer: question.options[question.correctAnswer],
        userAnswer: question.options[userAnswer],
        explanation: question.explanation,
        category: question.category,
        topic: question.topics[0] || 'General'
      });

      if (response.success) {
        setAiResponse(response);
      } else {
        setError(response.error || 'Failed to get AI help');
      }
    } catch (err) {
      setError('Unable to connect to AI assistant');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-8 w-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">AI Learning Assistant</h2>
                <p className="text-purple-100">Personalized help for your missed question</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-purple-600"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Question Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Question Summary</h3>
            <p className="text-gray-700 mb-4">{question.text}</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">
                  <strong>Correct:</strong> {question.options[question.correctAnswer]}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm">
                  <strong>Your answer:</strong> {question.options[userAnswer]}
                </span>
              </div>
            </div>
          </div>

          {/* AI Help Button */}
          {!aiResponse && !loading && (
            <div className="text-center mb-6">
              <Button
                onClick={getAIHelp}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
              >
                <Brain className="h-5 w-5 mr-2" />
                Get AI-Powered Explanation
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Our AI will analyze your mistake and provide personalized learning guidance
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600 mb-4" />
              <p className="text-gray-600">AI is analyzing your response...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
              <Button
                onClick={getAIHelp}
                variant="outline"
                className="mt-3 border-red-300 text-red-700 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* AI Response */}
          {aiResponse && (
            <div className="space-y-6">
              {/* Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-blue-900">AI Explanation</h4>
                </div>
                <p className="text-blue-800">{aiResponse.explanation}</p>
              </div>

              {/* Key Learning Points */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Target className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-900">Key Learning Points</h4>
                </div>
                <ul className="space-y-2">
                  {aiResponse.keyPoints.map((point: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-green-800">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Study Tips */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <BookOpen className="h-5 w-5 text-purple-600 mr-2" />
                  <h4 className="font-semibold text-purple-900">Study Tips</h4>
                </div>
                <ul className="space-y-2">
                  {aiResponse.studyTips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <ArrowRight className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-purple-800">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related Topics */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Target className="h-5 w-5 text-orange-600 mr-2" />
                  <h4 className="font-semibold text-orange-900">Related Topics to Review</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiResponse.relatedTopics.map((topic: string, index: number) => (
                    <span
                      key={index}
                      className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Original Explanation */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Original Explanation</h4>
                <p className="text-gray-700">{question.explanation}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6"
            >
              Close
            </Button>
            
            {aiResponse && (
              <div className="flex space-x-3">
                <Button
                  onClick={() => window.open('https://example.com/study-resources', '_blank')}
                  variant="outline"
                  className="px-6"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Study Resources
                </Button>
                <Button
                  onClick={() => {
                    // Mark as reviewed or save to study list
                    console.log('Question marked for review');
                    onClose();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Reviewed
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
