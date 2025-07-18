"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { DocumentParser, ParsedQuestion } from "@/lib/documentParser";
import {
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  Download,
  Info,
  CheckCircle,
  XCircle,
  FileCheck,
  BookOpen,
  Target,
  Eye,
} from "lucide-react";

interface DocumentUploadProps {
  onQuestionsExtracted: (questions: ParsedQuestion[], examId: string) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onQuestionsExtracted,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [extractedQuestions, setExtractedQuestions] = useState<
    ParsedQuestion[]
  >([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const examOptions = [
    {
      id: "rn-paper-1",
      label: "RN Paper 1",
      description: "Registered Nurse Paper 1",
    },
    {
      id: "rn-paper-2",
      label: "RN Paper 2",
      description: "Registered Nurse Paper 2",
    },
    {
      id: "rm-paper-1",
      label: "RM Paper 1",
      description: "Registered Midwife Paper 1",
    },
    {
      id: "rm-paper-2",
      label: "RM Paper 2",
      description: "Registered Midwife Paper 2",
    },
    {
      id: "rphn-paper-1",
      label: "RPHN Paper 1",
      description: "Registered Public Health Nurse Paper 1",
    },
    {
      id: "rphn-paper-2",
      label: "RPHN Paper 2",
      description: "Registered Public Health Nurse Paper 2",
    },
  ];

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedExam) {
      alert("Please select an exam category first");
      return;
    }

    if (!file.name.endsWith(".docx")) {
      alert("Please upload a DOCX file");
      return;
    }

    setUploading(true);
    setUploadStatus("idle");
    setUploadMessage("");

    try {
      const examCategory = selectedExam || "RN"; // Default to RN if no exam selected
      const result = await DocumentParser.parseDocxFile(file, examCategory);
      const questions = result.questions;

      if (questions.length === 0) {
        setUploadStatus("error");
        setUploadMessage(
          "No questions found in the document. Please check the formatting."
        );
        return;
      }

      setExtractedQuestions(questions);
      setUploadStatus("success");
      setUploadMessage(
        `Successfully extracted ${questions.length} questions from ${file.name}`
      );
    } catch (error) {
      console.error("Error parsing document:", error);
      setUploadStatus("error");
      setUploadMessage(
        "Failed to parse document. Please check the file format and try again."
      );
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveQuestions = () => {
    if (extractedQuestions.length > 0 && selectedExam) {
      onQuestionsExtracted(extractedQuestions, selectedExam);
      setExtractedQuestions([]);
      setUploadStatus("idle");
      setUploadMessage("");
      setShowPreview(false);
    }
  };

  const downloadTemplateDocument = () => {
    // Create a template document content
    const templateContent = `Question Format Template for Exam Upload

IMPORTANT: Follow this exact format for successful parsing:

Question 1:
What is the normal range for adult heart rate?
A) 40-60 bpm
B) 60-100 bpm **
C) 100-120 bpm
D) 120-140 bpm

Explanation: The normal resting heart rate for adults is 60-100 beats per minute. This range can vary based on fitness level and other factors.

Question 2:
Which of the following is a sign of respiratory distress?
A) Normal breathing pattern
B) Use of accessory muscles **
C) Pink nail beds
D) Clear speech

Explanation: Use of accessory muscles indicates increased work of breathing and respiratory distress.

FORMATTING RULES:
1. Each question starts with "Question [number]:"
2. Question text on the next line
3. Options labeled A), B), C), D) etc.
4. Mark correct answer with ** at the end
5. Optional explanation after options
6. Leave blank line between questions

IMPORTANT NOTES:
- Use ** to mark the correct answer
- Ensure consistent spacing
- Include explanations for better learning
- Save as .docx format
- Maximum recommended: 100 questions per file`;

    // Create and download the file
    const element = document.createElement("a");
    const file = new Blob([templateContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "Question_Format_Template.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Info className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Document Formatting Instructions
            </h3>

            <div className="space-y-4 text-blue-800">
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Required Format
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm ml-6">
                  <li>
                    Save document as <strong>.docx</strong> format
                  </li>
                  <li>Start each question with "Question [number]:"</li>
                  <li>List options as A), B), C), D), etc.</li>
                  <li>
                    Mark correct answer with <strong>**</strong> at the end
                  </li>
                  <li>Optional: Add explanations after options</li>
                  <li>Leave blank lines between questions</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Example Format
                </h4>
                <div className="bg-white rounded p-3 text-sm font-mono border">
                  <div className="text-gray-800">
                    <div>Question 1:</div>
                    <div>What is the normal adult heart rate?</div>
                    <div>A) 40-60 bpm</div>
                    <div>B) 60-100 bpm **</div>
                    <div>C) 100-120 bpm</div>
                    <div>D) 120-140 bpm</div>
                    <div className="mt-2 text-gray-600">
                      Explanation: Normal range is 60-100 bpm...
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Best Practices
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm ml-6">
                  <li>Include detailed explanations for learning</li>
                  <li>Keep questions clear and concise</li>
                  <li>Ensure only one correct answer per question</li>
                  <li>Upload 50-100 questions per file for best performance</li>
                  <li>Review questions before uploading</li>
                </ul>
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={downloadTemplateDocument}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template Format
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Exam Category *
        </label>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {examOptions.map((exam) => (
            <div
              key={exam.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedExam === exam.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedExam(exam.id)}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    selectedExam === exam.id
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedExam === exam.id && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{exam.label}</p>
                  <p className="text-sm text-gray-600">{exam.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Upload Document
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>

            <div>
              <p className="text-lg font-medium text-gray-900">
                Upload DOCX Document
              </p>
              <p className="text-gray-600 mt-1">
                Click to browse or drag and drop your question document
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading || !selectedExam}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !selectedExam}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              Supported format: DOCX • Max size: 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Upload Status */}
      {uploadStatus !== "idle" && (
        <div
          className={`p-4 rounded-lg flex items-start space-x-3 ${
            uploadStatus === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {uploadStatus === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`font-medium ${
                uploadStatus === "success" ? "text-green-800" : "text-red-800"
              }`}
            >
              {uploadStatus === "success" ? "Success!" : "Upload Failed"}
            </p>
            <p
              className={`text-sm mt-1 ${
                uploadStatus === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {uploadMessage}
            </p>
          </div>
        </div>
      )}

      {/* Questions Preview */}
      {extractedQuestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Extracted Questions ({extractedQuestions.length})
            </h3>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? "Hide" : "Preview"}
              </Button>
              <Button
                onClick={handleSaveQuestions}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Save to Database
              </Button>
            </div>
          </div>

          {/* Questions Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-600">Total Questions</p>
              <p className="text-xl font-bold text-blue-900">
                {extractedQuestions.length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-green-600">With Explanations</p>
              <p className="text-xl font-bold text-green-900">
                {extractedQuestions.filter((q) => q.explanation).length}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <p className="text-sm text-yellow-600">Average Options</p>
              <p className="text-xl font-bold text-yellow-900">
                {(
                  extractedQuestions.reduce(
                    (sum, q) => sum + q.options.length,
                    0
                  ) / extractedQuestions.length
                ).toFixed(1)}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <p className="text-sm text-purple-600">Category</p>
              <p className="text-sm font-bold text-purple-900">
                {examOptions.find((e) => e.id === selectedExam)?.label}
              </p>
            </div>
          </div>

          {/* Questions List Preview */}
          {showPreview && (
            <div className="max-h-96 overflow-y-auto space-y-4">
              {extractedQuestions.slice(0, 5).map((question, index) => (
                <div key={index} className="border border-gray-200 rounded p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      Question {index + 1}
                    </h4>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {question.options.length} options
                    </span>
                  </div>
                  <p className="text-gray-800 mb-3">{question.text}</p>
                  <div className="space-y-1 text-sm">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`flex items-center space-x-2 ${
                          optIndex === question.correctAnswer
                            ? "text-green-700 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        <span className="w-6 h-6 rounded border flex items-center justify-center text-xs">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span>{option}</span>
                        {optIndex === question.correctAnswer && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                  {question.explanation && (
                    <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              ))}

              {extractedQuestions.length > 5 && (
                <div className="text-center py-4 text-gray-600">
                  ... and {extractedQuestions.length - 5} more questions
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
